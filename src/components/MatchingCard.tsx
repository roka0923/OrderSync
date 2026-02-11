import React, { useState, useEffect } from 'react';
import { Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { findAbbreviation, addAbbreviation } from '../lib/abbreviations';
import { ConversionItem, ParsedItem } from '../types';
import ProductSearchModal from './ProductSearchModal';

interface MatchingCardProps {
    item: ParsedItem;
    lineNumber: number;
    onConfirm: (item: ConversionItem) => void;
}

const MatchingCard: React.FC<MatchingCardProps> = ({ item, lineNumber, onConfirm }) => {
    const [loading, setLoading] = useState(true);
    const [matched, setMatched] = useState<ConversionItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const performMatching = async () => {
            setLoading(true);
            const result = await findAbbreviation(item.product, item.side, item.position);

            if (result) {
                let finalCode = result.productCode;
                let finalName = result.productName;

                if (item.side && (item.side === 'LH' || item.side === 'RH')) {
                    const matchedSide = result.productName.toUpperCase().includes('RH') ? 'RH' :
                        result.productName.toUpperCase().includes('LH') ? 'LH' : null;

                    if (matchedSide && matchedSide !== item.side) {
                        const baseName = result.productName.replace(/\s*(LH|RH)$|^(LH|RH)\s*/i, '').trim();
                        try {
                            const qAbbr = query(
                                collection(db, 'abbreviations'),
                                where('inputAbbr', '==', item.product),
                                where('status', '==', 'active')
                            );
                            const snapAbbr = await getDocs(qAbbr);
                            const abbrSideMatch = snapAbbr.docs.find(d =>
                                d.data().productName.toUpperCase().includes(item.side!)
                            );

                            if (abbrSideMatch) {
                                finalCode = abbrSideMatch.data().productCode;
                                finalName = abbrSideMatch.data().productName;
                            } else {
                                const qProd = query(
                                    collection(db, 'products'),
                                    where('model', '>=', baseName),
                                    where('model', '<=', baseName + '\uf8ff'),
                                    limit(20)
                                );
                                const snapProd = await getDocs(qProd);
                                const targetProduct = snapProd.docs.find(docData => {
                                    const model = docData.data().model || '';
                                    return model.toUpperCase().includes(item.side!);
                                });

                                if (targetProduct) {
                                    finalCode = targetProduct.data().code;
                                    finalName = targetProduct.data().model;
                                }
                            }
                        } catch (e) {
                            console.error("Side correction fallback failed:", e);
                        }
                    }
                }

                const confidence = result.confidence || 100;
                const conversionItem: ConversionItem = {
                    lineNumber,
                    originalLine: item.original,
                    parsedProduct: item.product,
                    matchedCode: finalCode,
                    matchedName: finalName,
                    position: item.position,
                    quantity: item.quantity,
                    side: item.side,
                    confidence: confidence,
                    status: confidence === 100 ? 'confirmed' : 'pending',
                    userEdited: false
                };
                setMatched(conversionItem);

                // 정확 매칭인 경우에만 즉시 확정
                if (confidence === 100) {
                    onConfirm(conversionItem);
                }
            } else {
                setMatched(null);
            }
            setLoading(false);
        };

        performMatching();
    }, [item, lineNumber]);

    const handleConfirmSimilar = async () => {
        if (!matched) return;

        const confirmedItem: ConversionItem = {
            ...matched,
            status: 'confirmed',
            confidence: 100 // 확정했으므로 100%로 간주
        };

        setMatched(confirmedItem);
        onConfirm(confirmedItem);

        // 약어표에 추가
        try {
            await addAbbreviation(
                item.product,
                matched.matchedCode,
                matched.matchedName,
                `유사 매칭 확정 (원본 유사도: ${matched.confidence}%)`
            );
        } catch (error) {
            console.error('Failed to save confirmed abbreviation:', error);
        }
    };

    const handleManualSelect = async (product: { code: string; name: string; saveAsAbbr: boolean }) => {
        let finalCode = product.code;
        let finalName = product.name;

        // 방향성 보정 로직 (LH/RH 가 일치하지 않을 경우 자동 전환 시도)
        if (item.side && (item.side === 'LH' || item.side === 'RH')) {
            const currentSide = product.name.toUpperCase().includes('RH') ? 'RH' :
                product.name.toUpperCase().includes('LH') ? 'LH' : null;

            if (currentSide && currentSide !== item.side) {
                // 선택된 품목의 이름에서 방향 표시 제거 후 반대 방향 찾기
                const baseName = product.name.replace(/\s*(LH|RH)$|^(LH|RH)\s*/i, '').trim();
                try {
                    const q = query(
                        collection(db, 'products'),
                        where('model', '>=', baseName),
                        where('model', '<=', baseName + '\uf8ff'),
                        limit(10)
                    );
                    const snap = await getDocs(q);
                    const targetProduct = snap.docs.find(doc => {
                        const model = doc.data().model || '';
                        return model.toUpperCase().includes(item.side!);
                    });

                    if (targetProduct) {
                        finalCode = targetProduct.data().code;
                        finalName = targetProduct.data().model;
                    }
                } catch (e) {
                    console.error("Side correction failed:", e);
                }
            }
        }

        const editedItem: ConversionItem = {
            lineNumber,
            originalLine: item.original,
            parsedProduct: item.product,
            matchedCode: finalCode,
            matchedName: finalName,
            position: item.position,
            quantity: item.quantity,
            side: item.side,
            confidence: 100,
            status: 'edited',
            userEdited: true
        };

        setMatched(editedItem);
        onConfirm(editedItem);
        setIsModalOpen(false);

        if (product.saveAsAbbr) {
            try {
                // 약어표에는 방향성을 제거한 기본 모델명 혹은 원본 입력어로 저장하는 것이 유리함
                await addAbbreviation(item.product, finalCode, finalName, `수동 매칭 (방향 보정 적용)`);
            } catch (error) {
                console.error('Failed to save manual abbreviation:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 animate-pulse flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded"></div>
                </div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
        );
    }

    return (
        <div className={`group bg-white dark:bg-gray-800 rounded-xl p-5 border transition-all ${matched ? 'border-success/20 bg-success/5' : 'border-warning/20 bg-warning/5'
            }`}>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className="text-xs font-bold text-gray-400 mb-1 block uppercase tracking-wider">Line {lineNumber}</span>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{item.original}</h3>
                </div>
                <div className="flex items-center space-x-2">
                    {matched ? (
                        matched.status === 'pending' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                <AlertCircle size={12} className="mr-1" /> 유사 매칭 ({matched.confidence}%)
                            </span>
                        ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${matched.confidence === 100 && !matched.userEdited ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                                <CheckCircle2 size={12} className="mr-1" />
                                {matched.userEdited ? '수동 선택' : matched.confidence === 100 ? '정확 매칭' : `유사 매칭 (${matched.confidence}%)`}
                            </span>
                        )
                    ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error animate-pulse">
                            <AlertCircle size={12} className="mr-1" /> 매칭 실패
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="bg-white/50 dark:bg-gray-900/50 p-2 rounded-lg">
                    <div className="text-gray-500 text-xs mb-1">파싱 정보</div>
                    <div className="font-semibold">{item.position} | {item.side} | {item.quantity}개</div>
                </div>
                <div className="bg-white/50 dark:bg-gray-900/50 p-2 rounded-lg">
                    <div className="text-gray-500 text-xs mb-1">매칭 품목</div>
                    <div className={`font-semibold ${matched ? 'text-gray-800 dark:text-gray-200' : 'text-error animate-pulse'}`}>
                        {matched ? (
                            <>
                                {matched.matchedName}
                                <span className="ml-2 text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                    {matched.matchedCode}
                                </span>
                            </>
                        ) : '확인 필요'}
                    </div>
                </div>
            </div>

            <div className="flex justify-end items-center space-x-2">
                {matched && matched.status === 'pending' && (
                    <button
                        onClick={handleConfirmSimilar}
                        className="inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-success hover:bg-green-600 rounded-lg shadow-sm transition-all active:scale-95 space-x-2"
                    >
                        <CheckCircle2 size={16} />
                        <span>맞음 (확정)</span>
                    </button>
                )}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-all active:scale-95"
                >
                    <Edit2 size={14} className="mr-2" /> 수정
                </button>
                {matched && (matched.status === 'confirmed' || matched.status === 'edited') && !matched.userEdited && (
                    <div className="p-2 text-success" title="확정됨">
                        <CheckCircle2 size={24} />
                    </div>
                )}
                {matched && matched.userEdited && (
                    <div className="p-2 text-primary" title="사용자 수정됨">
                        <CheckCircle2 size={24} />
                    </div>
                )}
            </div>

            <ProductSearchModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleManualSelect}
                initialQuery={item.product}
            />
        </div>
    );
};

export default MatchingCard;
