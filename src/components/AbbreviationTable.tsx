import React from 'react';
import { Abbreviation } from '../types';
import { Trash2, Edit3, ExternalLink } from 'lucide-react';

interface AbbreviationTableProps {
    data: Abbreviation[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    selectedIds: string[];
    onSelectionChange: (selectedIds: string[]) => void;
}

const AbbreviationTable: React.FC<AbbreviationTableProps> = ({
    data,
    onEdit,
    onDelete,
    selectedIds,
    onSelectionChange
}) => {
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange(data.map(item => item.id));
        } else {
            onSelectionChange([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedIds, id]);
        } else {
            onSelectionChange(selectedIds.filter(item => item !== id));
        }
    };

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="px-6 py-4 w-10">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                checked={data.length > 0 && selectedIds.length === data.length}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                            />
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">입력 약어</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">매칭 품목 (코드)</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">사용 횟수</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">출처</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">관리</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                    {data.length > 0 ? (
                        data.map((item) => (
                            <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group ${selectedIds.includes(item.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                        checked={selectedIds.includes(item.id)}
                                        onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                                    />
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200">
                                    {item.inputAbbr}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.productName}</div>
                                    <div className="text-xs text-gray-500">{item.productCode}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                        {item.usageCount}회
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.source === 'auto_learn' ? 'bg-blue-50 text-blue-600' :
                                        item.source === 'default' ? 'bg-purple-50 text-purple-600' :
                                            'bg-orange-50 text-orange-600'
                                        }`}>
                                        {item.source === 'auto_learn' ? '자동학습' : item.source === 'default' ? '기본' : '수동'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit(item.id)}
                                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(item.id)}
                                            className="p-2 text-gray-400 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="px-6 py-20 text-center text-gray-500 italic">
                                등록된 약어 정보가 없습니다.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AbbreviationTable;
