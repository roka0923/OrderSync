import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock routing since App uses BrowserRouter which doesn't work well in tests if nested
// But App already includes Router, so we can just render it.

describe('App Component', () => {
    it('renders OrderSync title', () => {
        render(<App />);
        const titleElements = screen.getAllByText(/OrderSync/i);
        expect(titleElements.length).toBeGreaterThan(0);
    });

    it('renders initial navigation links', () => {
        render(<App />);
        expect(screen.getByText(/새 변환/i)).toBeInTheDocument();
        expect(screen.getByText(/약어표/i)).toBeInTheDocument();
    });
});
