import React, { useState, useEffect } from 'react';
import { X, Search, Check } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Abbreviation } from '../types';

interface ProductSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: { code: string; name: string; saveAsAbbr: boolean }) => void;
    initialQuery?: string;
}

const ProductSearchModal: React.FC<ProductSearchModalProps> = ({
    isOpen,
    onSelect,
    onClose,
    initialQuery = ''
}) => {
    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saveAsAbbr, setSaveAsAbbr] = useState(true);

    const [allProducts, setAllProducts] = useState<any[]>([]);

    // 모든 데이터를 한 번에 로드 (보안 규칙 해결됨)
    const loadData = async () => {
        if (allProducts.length > 0) return; // Load only once
        setLoading(true);
        try {
            console.log("[ProductSearch] Initializing data...");

            // 1. 제품 마스터 (필터 없이 전체 로드)
            const prodSnap = await getDocs(collection(db, 'products'));
            const prodItems = prodSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    model: String(data.model || '').trim(),
                    code: String(data.code || '').trim(),
                    origin: data.origin || '국산'
                };
            });

            // 2. 약어표 데이터
            const abbrSnap = await getDocs(query(collection(db, 'abbreviations'), where('status', '==', 'active')));
            const abbrItems = abbrSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    model: String(data.productName || '').trim(),
                    code: String(data.productCode || '').trim(),
                    inputAbbr: String(data.inputAbbr || '').trim(),
                    isAbbr: true
                };
            });

            const combinedMap = new Map();
            [...prodItems, ...abbrItems].forEach(item => {
                // Prioritize actual products over abbreviations if IDs clash, or merge if needed
                // For simplicity, if an abbreviation points to an existing product, the product data will be used.
                // If an abbreviation has a unique ID, it will be added.
                // This logic might need refinement based on exact requirements for ID clashes.
                combinedMap.set(item.id, item);
            });

            const final = Array.from(combinedMap.values());
            console.log(`[ProductSearch] ${final.length} items loaded for searching.`);
            setAllProducts(final);
        } catch (error) {
            console.error("[ProductSearch] Loading failed:", error);
        } finally {
            setLoading(false);
        }
    };

    // 실시간 포함(Contains) 검색 로직
    useEffect(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) {
            setResults([]);
            return;
        }

        const filtered = allProducts.filter(item => {
            const m = (item.model || '').toLowerCase();
            const c = (item.code || '').toLowerCase();
            const a = (item.inputAbbr || '').toLowerCase(); // Check abbreviation input
            return m.includes(term) || c.includes(term) || a.includes(term);
        });

        setResults(filtered.slice(0, 100)); // Limit results for performance
    }, [searchTerm, allProducts]);

    // 모달이 열릴 때 초기 검색 실행 및 데이터 로드
    useEffect(() => {
        if (isOpen) {
            setSearchTerm(initialQuery);
            loadData(); // Load all data when modal opens
        }
    }, [isOpen]); // Dependency on isOpen

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        // Filtering is now handled by the useEffect hook reacting to searchTerm changes
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">품목 직접 선택</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors font-medium">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="모델명 또는 코드를 입력하세요"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto mb-6 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center py-10">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                                <p className="text-sm text-gray-500">검색 중...</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-2">
                                {results.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => onSelect({
                                            code: item.code,
                                            name: item.model,
                                            saveAsAbbr: saveAsAbbr
                                        })}
                                        className="w-full text-left p-4 rounded-xl hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all group flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">
                                                {item.model}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                코드: {item.code} {item.isAbbr ? '(약어표)' : item.origin ? `| 분류: ${item.origin}` : ''}
                                                {item.inputAbbr && ` | 원본: ${item.inputAbbr}`}
                                            </div>
                                        </div>
                                        <div className="bg-primary/10 text-primary p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Check size={16} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : searchTerm ? (
                            <div className="text-center py-10 text-gray-500">
                                검색 결과가 없습니다.
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500 italic">
                                검색어를 입력하여 품목을 찾아보세요.
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2 py-2 border-t border-gray-100 dark:border-gray-700">
                        <input
                            type="checkbox"
                            id="save-abbr"
                            checked={saveAsAbbr}
                            onChange={(e) => setSaveAsAbbr(e.target.checked)}
                            className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 transition-all cursor-pointer"
                        />
                        <label htmlFor="save-abbr" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                            이 선택을 약어표에 저장하여 다음에 자동으로 매칭합니다
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductSearchModal;
