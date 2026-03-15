import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../hooks/useToast';

export function renderWithProviders(ui: ReactElement) {
    return render(
        <HelmetProvider>
            <ToastProvider>
                <MemoryRouter>{ui}</MemoryRouter>
            </ToastProvider>
        </HelmetProvider>,
    );
}
