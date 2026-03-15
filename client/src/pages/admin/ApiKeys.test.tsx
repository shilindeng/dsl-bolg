import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import ApiKeysPage from './ApiKeys';

vi.mock('../../api/client', () => ({
    fetchApiKeys: vi.fn().mockResolvedValue([]),
    createApiKey: vi.fn(),
    revokeApiKey: vi.fn(),
}));

describe('API keys page', () => {
    it('shows integration guide examples', async () => {
        renderWithProviders(<ApiKeysPage />);

        expect(await screen.findByText('接入说明')).toBeInTheDocument();
        expect(screen.getByText('curl')).toBeInTheDocument();
        expect(screen.getByText('Node.js')).toBeInTheDocument();
        expect(screen.getByText('PowerShell')).toBeInTheDocument();
    });
});
