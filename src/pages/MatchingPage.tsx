import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';
import MatchingCard from '../components/MatchingCard';
import { saveConversion } from '../lib/conversions';
import { ConversionItem } from '../types';
import { ArrowLeft, CheckCircle, Save, Copy } from 'lucide-react';

const MatchingPage: React.FC = () => {
    const navigate = useNavigate();
    const { originalText, parsedItems, updateMatchedItem, matchedItems } = useOrderStore();
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (parsedItems.length === 0) {
            navigate('/');
        }
    }, [parsedItems, navigate]);

    const handleConfirmItem = (item: ConversionItem) => {
        updateMatchedItem(item.lineNumber, item);
    };

    const handleSave = async () => {
        if (matchedItems.length < parsedItems.length) {
            alert('모든 항목의 매칭을 확인해 주세요.');
            return;
        }

        setIsSaving(true);
        try {
            const stats = {
                totalItems: matchedItems.length,
                autoMatched: matchedItems.filter(i => !i.userEdited).length,
                manuallyEdited: matchedItems.filter(i => i.userEdited).length,
            };

            await saveConversion(originalText, matchedItems, stats);
            navigate('/completed');
        } catch (error) {
            console.error('Save error:', error);
            alert('저장 중 오류가 발생했습니다. (Firebase Auth 확인 필요)');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyToClipboard = () => {
        if (matchedItems.length === 0) {
            alert('변환된 데이터가 없습니다.');
            return;
        }

        // 엑셀 복사 형식: 품목코드 [TAB] 품목명 [TAB] 수량
        const tsvContent = matchedItems
            .sort((a, b) => a.lineNumber - b.lineNumber)
            .map(item => `${item.matchedCode}\t${item.matchedName}\t${item.quantity}`)
            .join('\n');

        navigator.clipboard.writeText(tsvContent).then(() => {
            alert('클립보드에 복사되었습니다. 엑셀에 붙여넣기 하세요.');
        }).catch(err => {
            console.error('Copy failed:', err);
            alert('복사에 실패했습니다.');
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-1" /> 돌아가기
                </button>
                <div className="text-right">
                    <div className="text-sm text-gray-500 font-mono">Total {parsedItems.length} items</div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">품목 매칭 확인</h2>

                <div className="space-y-4 mb-8">
                    {parsedItems.map((item, index) => (
                        <MatchingCard
                            key={`${index}-${item.side}-${item.position}`}
                            item={item}
                            lineNumber={index + 1}
                            onConfirm={handleConfirmItem}
                        />
                    ))}
                </div>

                <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={handleCopyToClipboard}
                        className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-4 px-8 rounded-xl transition-all shadow-sm transform active:scale-95 space-x-2 w-full md:w-auto hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        <Copy size={20} />
                        <span>엑셀 복사하기</span>
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || matchedItems.length < parsedItems.length}
                        className="flex items-center justify-center bg-primary hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 px-12 rounded-xl transition-all shadow-lg hover:shadow-primary/25 transform active:scale-95 space-x-2 w-full md:w-auto"
                    >
                        {isSaving ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <Save size={20} />
                        )}
                        <span>최종 변환 결과 저장</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MatchingPage;
