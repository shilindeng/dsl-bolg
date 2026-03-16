import { fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../hooks/useTheme';
import Navbar from './Navbar';

vi.mock('../hooks/useAuth', () => ({
    useAuth: () => ({
        user: null,
        logout: vi.fn(),
    }),
}));

describe('Navbar', () => {
    beforeEach(() => {
        localStorage.clear();
        Object.defineProperty(window, 'scrollY', {
            value: 0,
            configurable: true,
        });
    });

    it('adds the scrolled class after the page scrolls', () => {
        render(
            <HelmetProvider>
                <ThemeProvider>
                    <MemoryRouter initialEntries={['/']}>
                        <Navbar isAdmin={false} isAuthenticated={false} />
                    </MemoryRouter>
                </ThemeProvider>
            </HelmetProvider>,
        );

        const header = document.querySelector('.site-nav');
        expect(header).not.toHaveClass('is-scrolled');

        Object.defineProperty(window, 'scrollY', {
            value: 120,
            configurable: true,
        });
        fireEvent.scroll(window);

        expect(header).toHaveClass('is-scrolled');
        expect(header).toHaveClass('is-home');
    });

    it('keeps dark theme as the default mode', () => {
        render(
            <HelmetProvider>
                <ThemeProvider>
                    <MemoryRouter initialEntries={['/blog']}>
                        <Navbar isAdmin={false} isAuthenticated={false} />
                    </MemoryRouter>
                </ThemeProvider>
            </HelmetProvider>,
        );

        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        expect(screen.getAllByTestId('primary-nav')[0]).toBeInTheDocument();
    });
});
