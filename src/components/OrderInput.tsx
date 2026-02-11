import React, { useState } from 'react';

interface OrderInputProps {
    onParse: (text: string) => void;
}

const OrderInput: React.FC<OrderInputProps> = ({ onParse }) => {
    const [text, setText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onParse(text);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all hover:shadow-xl border border-gray-100 dark:border-gray-700">
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label
                        htmlFor="order-text"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                        주문서 텍스트를 붙여넣으세요
                    </label>
                    <textarea
                        id="order-text"
                        rows={10}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent bg-transparent transition-all resize-none font-mono text-sm"
                        placeholder="예시:&#10;포터2 20대분&#10;HD 후 L 30&#10;그스타후 10대분&#10;K5 R 15"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="w-full bg-primary hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md transform active:scale-[0.98]"
                >
                    주문서 변환 시작
                </button>
            </form>
        </div>
    );
};

export default OrderInput;
