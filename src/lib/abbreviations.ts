import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    doc,
    updateDoc,
    increment,
    onSnapshot,
    Unsubscribe,
    deleteDoc,
    writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Abbreviation } from '../types';

const RESTRICTED_TERMS = ['뉴', '올뉴', '더뉴', '그랜드'];

export async function addAbbreviation(
    inputAbbr: string,
    productCode: string,
    productName: string,
    notes?: string
): Promise<string | null> {
    // 너무 짧거나 공통 접두사만 있는 경우 저장 제외
    const trimmed = inputAbbr.trim();
    if (trimmed.length <= 1 || RESTRICTED_TERMS.includes(trimmed)) {
        return null;
    }

    const docRef = await addDoc(collection(db, 'abbreviations'), {
        inputAbbr,
        standardAbbr: inputAbbr,
        productCode,
        productName,
        createdAt: serverTimestamp(),
        source: 'auto_learn',
        usageCount: 1,
        status: 'active',
        notes: notes || ''
    });

    return docRef.id;
}

// 문자열 유사도 계산 (Levenshtein Distance 기반)
function getSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    const editDistance = (a: string, b: string) => {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    };

    return (longer.length - editDistance(longer.toLowerCase(), shorter.toLowerCase())) / longer.length;
}

export async function findAbbreviation(
    inputAbbr: string,
    side?: 'LH' | 'RH' | null,
    position?: '전방' | '후방'
): Promise<Abbreviation | null> {
    const trimmed = inputAbbr.trim();
    if (trimmed.length <= 1 || RESTRICTED_TERMS.includes(trimmed)) {
        return null;
    }

    // 1. 정확 매칭 (abbreviations 컬렉션)
    const q = query(
        collection(db, 'abbreviations'),
        where('inputAbbr', '==', inputAbbr),
        where('status', '==', 'active'),
        orderBy('usageCount', 'desc'),
        limit(10)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        let docs = querySnapshot.docs.map((d: any) => ({
            id: d.id,
            ...d.data() as Omit<Abbreviation, 'id'>
        }));

        // 위치(전/후) 정보가 있다면 해당 정보가 포함된 항목 필터링
        if (position) {
            const posMatch = docs.filter((d: any) =>
                position === '후방'
                    ? d.productName.includes('후') || d.productName.toUpperCase().includes('REAR')
                    : !d.productName.includes('후') && !d.productName.toUpperCase().includes('REAR')
            );

            // 위치가 일치하는 항목이 전혀 없다면, 약어표 매칭을 포기하고 아래의 유사도(제품DB) 검색으로 넘어가도록 함
            if (posMatch.length === 0) {
                console.log(`[findAbbreviation] Abbr found but position mismatch (${position}). Falling back to similarity search.`);
            } else {
                docs = posMatch;

                // 방향(LH/RH) 정보가 있는 경우 최우선 선택
                if (side) {
                    const sideMatch = docs.find((d: any) =>
                        d.productName.toUpperCase().includes(side.toUpperCase())
                    );
                    if (sideMatch) {
                        return { ...sideMatch, confidence: 100 } as Abbreviation;
                    }
                }

                return {
                    ...docs[0],
                    confidence: 100
                } as Abbreviation;
            }
        } else {
            // 위치 정보가 없는 경우 기존 로직 유지
            if (side) {
                const sideMatch = docs.find((d: any) =>
                    d.productName.toUpperCase().includes(side.toUpperCase())
                );
                if (sideMatch) {
                    return { ...sideMatch, confidence: 100 } as Abbreviation;
                }
            }
            return { ...docs[0], confidence: 100 } as Abbreviation;
        }
    }

    // 2. 유사도 매칭 (products 컬렉션에서 검색)
    const cleanString = (s: string) => s.replace(/[\s\(\)\[\]\-_]/g, '').toLowerCase();
    const cleanInput = cleanString(inputAbbr);
    const prefix = inputAbbr.substring(0, 1);

    if (prefix.length >= 1) {
        try {
            let productSnap = await getDocs(query(
                collection(db, 'products'),
                where('origin', '==', '국산'),
                where('model', '>=', prefix),
                where('model', '<=', prefix + '\uf8ff'),
                limit(100)
            ));

            if (productSnap.empty) {
                productSnap = await getDocs(query(
                    collection(db, 'products'),
                    where('model', '>=', prefix),
                    where('model', '<=', prefix + '\uf8ff'),
                    limit(100)
                ));
            }

            let bestMatch: any = null;
            let maxSimilarity = 0;

            productSnap.forEach((docData: any) => {
                const data = docData.data();
                const modelName = data.model || '';
                const cleanModel = cleanString(modelName);

                // 위치 정보 가중치 적용 (불일치 시 0.1로 대폭 감점하여 오매칭 차단)
                let positionWeight = 1.0;
                if (position) {
                    const isRear = modelName.includes('후') || modelName.toUpperCase().includes('REAR');
                    if (position === '후방' && !isRear) positionWeight = 0.1;
                    if (position === '전방' && isRear) positionWeight = 0.1;
                }

                let similarity = getSimilarity(cleanInput, cleanModel) * positionWeight;

                // 부분 일치 가중치 - "크루즈후"가 "크루즈(후) LH"의 앞부분을 포함하는 경우 등
                if (cleanModel.includes(cleanInput) || cleanInput.includes(cleanModel)) {
                    similarity = Math.max(similarity, 0.8 * positionWeight);
                }

                if (similarity > maxSimilarity) {
                    maxSimilarity = similarity;
                    bestMatch = data;
                }
            });

            if (bestMatch && maxSimilarity >= 0.5) {
                const confidence = Math.round(maxSimilarity * 100);

                if (confidence >= 85) { // 신뢰도 기준 상향 (위치 정보 포함시킴)
                    try {
                        await addAbbreviation(inputAbbr, bestMatch.code, bestMatch.model, `자동 학습 (유사도 ${confidence}%)`);
                    } catch (e) {
                        console.error("Auto-learn failed:", e);
                    }
                }

                return {
                    id: 'temp-' + Date.now(),
                    inputAbbr: inputAbbr,
                    standardAbbr: bestMatch.model,
                    productCode: bestMatch.code,
                    productName: bestMatch.model,
                    createdAt: new Date(),
                    source: 'auto_learn',
                    usageCount: 1,
                    status: 'active',
                    confidence: confidence
                };
            }
        } catch (error) {
            console.error("Similarity search error:", error);
        }
    }

    return null;
}

export async function incrementUsageCount(abbrevId: string): Promise<void> {
    const docRef = doc(db, 'abbreviations', abbrevId);
    await updateDoc(docRef, {
        usageCount: increment(1)
    });
}

export function subscribeToAbbreviations(
    callback: (abbreviations: Abbreviation[]) => void
): Unsubscribe {
    const q = query(
        collection(db, 'abbreviations'),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot: any) => {
        const abbreviations: Abbreviation[] = [];
        snapshot.forEach((docData: any) => {
            abbreviations.push({
                id: docData.id,
                ...docData.data() as Omit<Abbreviation, 'id'>
            } as Abbreviation);
        });

        callback(abbreviations);
    });
}

export async function updateAbbreviation(
    id: string,
    data: Partial<Omit<Abbreviation, 'id'>>
): Promise<void> {
    const docRef = doc(db, 'abbreviations', id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
    });
}

export async function deleteAbbreviation(id: string): Promise<void> {
    await deleteDoc(doc(db, 'abbreviations', id));
}

export async function deleteAbbreviations(ids: string[]): Promise<void> {
    const batch = writeBatch(db);
    ids.forEach((id) => {
        batch.delete(doc(db, 'abbreviations', id));
    });
    await batch.commit();
}
