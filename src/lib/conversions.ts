import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { ConversionItem } from '../types';

export async function saveConversion(
    originalText: string,
    items: ConversionItem[],
    stats: {
        totalItems: number;
        autoMatched: number;
        manuallyEdited: number;
    }
): Promise<string> {
    const userId = auth.currentUser?.uid;

    // 인증이 필수인 경우 에러 처리, 아니면 익명 또는 시스템 ID 사용 등 정책 결정 필요
    // 프롬프트에서는 인증된 사용자만 가능하도록 되어 있음
    if (!userId) {
        throw new Error('User not authenticated');
    }

    const docRef = await addDoc(collection(db, 'conversions'), {
        userId,
        createdAt: serverTimestamp(),
        originalText,
        totalItems: stats.totalItems,
        autoMatched: stats.autoMatched,
        manuallyEdited: stats.manuallyEdited,
        items
    });

    return docRef.id;
}
