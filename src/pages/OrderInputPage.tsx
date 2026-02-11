import React from 'react';
import { useNavigate } from 'react-router-dom';
import OrderInput from '../components/OrderInput';
import { parseOrderText } from '../lib/parser';
import { useOrderStore } from '../store/useOrderStore';

const OrderInputPage: React.FC = () => {
    const navigate = useNavigate();
    const { setOriginalText, setParsedItems, reset, parsedItems } = useOrderStore();

    const handleParse = (text: string) => {
        reset();
        const parsed = parseOrderText(text);
        setOriginalText(text);
        setParsedItems(parsed);
        navigate('/matching');
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center flex flex-col items-center">
                {parsedItems.length > 0 && (
                    <div className="flex flex-col items-center mb-6">
                        <button
                            onClick={() => navigate('/matching')}
                            className="flex items-center bg-orange-50 text-orange-600 px-6 py-2 rounded-full text-sm font-bold border border-orange-100 hover:bg-orange-100 transition-all shadow-sm mb-2"
                        >
                            <span className="relative flex h-2 w-2 mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            중단된 작업이 있습니다. 계속하시겠습니까? 👉
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('진행 중인 모든 작업 내용이 삭제됩니다. 새로 시작하시겠습니까?')) {
                                    reset();
                                }
                            }}
                            className="text-xs text-gray-400 hover:text-error underline underline-offset-4 transition-colors"
                        >
                            기존 작업 취소하고 새로 만들기
                        </button>
                    </div>
                )}
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">새 주문서 변환</h2>
                <p className="text-gray-600 dark:text-gray-400">복사한 주문서를 아래에 붙여넣어 주세요.</p>
            </div>

            <OrderInput onParse={handleParse} />

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                    <span className="mr-2">💡</span> 팁:
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                    <li>'대분'은 자동으로 LH, RH 두 줄로 분리됩니다.</li>
                    <li>'후'가 포함되면 자동으로 후방 품목으로 인식됩니다.</li>
                    <li>'6/42'와 같은 형식도 자동으로 좌우 수량을 인식합니다.</li>
                </ul>
            </div>
        </div>
    );
};

export default OrderInputPage;
