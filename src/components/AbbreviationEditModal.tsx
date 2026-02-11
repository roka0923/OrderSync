import React, { useState, useEffect } from 'react';
import { X, Save, Search } from 'lucide-react';
import { Abbreviation } from '../types';
import ProductSearchModal from './ProductSearchModal';

interface AbbreviationEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    abbreviation: Abbreviation | null;
    onSave: (id: string, data: any) => Promise<void>;
}

const AbbreviationEditModal: React.FC<AbbreviationEditModalProps> = ({
    isOpen,
    onClose,
    abbreviation,
    onSave
}) => {
    const [inputAbbr, setInputAbbr] = useState('');
    const [productName, setProductName] = useState('');
    const [productCode, setProductCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        if (abbreviation && isOpen) {
            setInputAbbr(abbreviation.inputAbbr);
            setProductName(abbreviation.productName);
            setProductCode(abbreviation.productCode);
        }
    }, [abbreviation, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!abbreviation) return;

        setLoading(true);
        try {
            await onSave(abbreviation.id, {
                inputAbbr,
                productName,
                productCode,
                source: 'manual' // 편집 시 수동으로 전환
            });
            onClose();
        } catch (error) {
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleProductSelect = (product: { code: string; name: string }) => {
        setProductName(product.name);
        setProductCode(product.code);
        setIsSearchOpen(false);
    };

    if (!isOpen || !abbreviation) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">약어 정보 수정</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">입력 약어</label>
                        <input
                            type="text"
                            value={inputAbbr}
                            onChange={(e) => setInputAbbr(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">매칭 품목 정보</label>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 relative group">
                            <div className="font-bold text-gray-900 dark:text-gray-100">{productName}</div>
                            <div className="text-sm text-gray-500">코드: {productCode}</div>

                            <button
                                type="button"
                                onClick={() => setIsSearchOpen(true)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:text-primary hover:border-primary transition-all shadow-sm"
                            >
                                <Search size={16} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-400">품목을 변경하려면 돋보기 버튼을 클릭하세요.</p>
                    </div>

                    <div className="flex space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 text-gray-700 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg transform active:scale-95 disabled:opacity-50 flex justify-center items-center"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save size={18} className="mr-2" /> 저장하기
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <ProductSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelect={(p) => handleProductSelect(p)}
                initialQuery={productName}
            />
        </div>
    );
};

export default AbbreviationEditModal;
