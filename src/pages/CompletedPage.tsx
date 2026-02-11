import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';
import { CheckCircle, Home, FileText, Download } from 'lucide-react';

const CompletedPage: React.FC = () => {
    const navigate = useNavigate();
    const { matchedItems, reset } = useOrderStore();

    const handleStartNew = () => {
        reset();
        navigate('/');
    };

    const autoMatchedCount = matchedItems.filter(i => !i.userEdited).length;
    const manuallyEditedCount = matchedItems.filter(i => i.userEdited).length;

    return (
        <div className="max-w-2xl mx-auto py-12 text-center animate-in zoom-in-95 duration-500">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-success/10 text-success rounded-full mb-8">
                <CheckCircle size={48} />
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">변환 완료!</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-10">
                주문서 변환이 성공적으로 완료되었으며,<br />학습된 약어는 다음 변환 시 자동으로 반영됩니다.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="text-3xl font-bold text-success mb-1">{autoMatchedCount}</div>
                    <div className="text-sm text-gray-500">자동 매칭</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="text-3xl font-bold text-primary mb-1">{manuallyEditedCount}</div>
                    <div className="text-sm text-gray-500">수동 수정</div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                    onClick={handleStartNew}
                    className="flex items-center justify-center bg-primary text-white font-bold py-4 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-lg w-full sm:w-auto transform active:scale-95"
                >
                    <Home size={18} className="mr-2" /> 새 주문 입력
                </button>
                <button
                    onClick={() => navigate('/abbreviations')}
                    className="flex items-center justify-center bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold py-4 px-8 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all w-full sm:w-auto transform active:scale-95"
                >
                    <FileText size={18} className="mr-2" /> 약어표 관리
                </button>
            </div>
        </div>
    );
};

export default CompletedPage;
