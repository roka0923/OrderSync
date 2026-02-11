import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToAbbreviations, deleteAbbreviation, deleteAbbreviations, updateAbbreviation } from '../lib/abbreviations';
import { Abbreviation } from '../types';
import AbbreviationTable from '../components/AbbreviationTable';
import AbbreviationEditModal from '../components/AbbreviationEditModal';
import { Search, Plus, ArrowLeft, Trash2 } from 'lucide-react';

const AbbreviationsPage: React.FC = () => {
    const navigate = useNavigate();
    const [abbrevList, setAbbrevList] = useState<Abbreviation[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAbbrev, setEditingAbbrev] = useState<Abbreviation | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToAbbreviations((list) => {
            setAbbrevList(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredList = abbrevList.filter(item =>
        item.inputAbbr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productCode.includes(searchTerm)
    );

    const handleEdit = (id: string) => {
        const item = abbrevList.find(a => a.id === id);
        if (item) {
            setEditingAbbrev(item);
            setIsEditModalOpen(true);
        }
    };

    const handleSave = async (id: string, data: any) => {
        try {
            await updateAbbreviation(id, data);
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Save failed:', error);
            throw error;
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('이 약어 정보를 삭제하시겠습니까?')) {
            try {
                await deleteAbbreviation(id);
                setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
            } catch (error) {
                alert('삭제 중 오류가 발생했습니다.');
                console.error(error);
            }
        }
    };

    const handleBulkDelete = async () => {
        if (confirm(`선택한 ${selectedIds.length}개의 약어를 모두 삭제하시겠습니까?`)) {
            try {
                await deleteAbbreviations(selectedIds);
                setSelectedIds([]);
            } catch (error) {
                alert('일괄 삭제 중 오류가 발생했습니다.');
                console.error(error);
            }
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
            {/* Sticky Header Section */}
            <div className="sticky top-0 z-30 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md pt-8 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2 transition-colors"
                        >
                            <ArrowLeft size={18} className="mr-1" /> 홈으로
                        </button>
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">약어표 관리</h2>
                        <p className="text-gray-600 dark:text-gray-400">학습된 약어를 수정하거나 새로운 약어를 등록합니다.</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center justify-center bg-error/10 text-error font-bold py-3 px-6 rounded-xl hover:bg-error hover:text-white transition-all shadow-sm transform active:scale-95 border border-error/20"
                            >
                                <Trash2 size={20} className="mr-2" /> {selectedIds.length}개 삭제
                            </button>
                        )}
                        <button className="flex items-center justify-center bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-all shadow-lg transform active:scale-95">
                            <Plus size={20} className="mr-2" /> 새 약어 추가
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl transition-all outline-none"
                        placeholder="찾으시는 약어 또는 품목명을 입력하세요"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center py-20">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500">약어표를 불러오는 중입니다...</p>
                    </div>
                ) : (
                    <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                        <AbbreviationTable
                            data={filteredList}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            selectedIds={selectedIds}
                            onSelectionChange={setSelectedIds}
                        />
                    </div>
                )}
            </div>

            <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-500">
                    약어표는 시스템 운영 과정에서 자동으로 개선됩니다. 수동 관리는 필요한 경우에만 권장합니다.
                </p>
            </div>

            <AbbreviationEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                abbreviation={editingAbbrev}
                onSave={handleSave}
            />
        </div>
    );
};

export default AbbreviationsPage;
