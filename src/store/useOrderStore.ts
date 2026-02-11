import { create } from 'zustand';
import { ParsedItem, ConversionItem } from '../types';

interface OrderState {
    originalText: string;
    parsedItems: ParsedItem[];
    matchedItems: ConversionItem[];

    setOriginalText: (text: string) => void;
    setParsedItems: (items: ParsedItem[]) => void;
    setMatchedItems: (items: ConversionItem[]) => void;
    updateMatchedItem: (index: number, item: ConversionItem) => void;
    reset: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
    originalText: '',
    parsedItems: [],
    matchedItems: [],

    setOriginalText: (text) => set({ originalText: text }),
    setParsedItems: (items) => set({ parsedItems: items }),
    setMatchedItems: (items) => set({ matchedItems: items }),

    updateMatchedItem: (lineNumber, item) => set((state) => {
        const newMatchedItems = [...state.matchedItems];
        const index = newMatchedItems.findIndex(i => i.lineNumber === lineNumber && i.side === item.side && i.position === item.position);

        if (index !== -1) {
            newMatchedItems[index] = item;
        } else {
            newMatchedItems.push(item);
        }

        return { matchedItems: newMatchedItems };
    }),

    reset: () => set({ originalText: '', parsedItems: [], matchedItems: [] }),
}));
