import { render } from '@testing-library/react';
import { fireEvent, screen, waitFor } from '@testing-library/dom';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import Profile from './Profile';

const mockFetchAccountProfile = vi.fn();
const mockUpdateAccountProfile = vi.fn();

vi.mock('../../api/client', () => ({
    fetchAccountProfile: (...args: unknown[]) => mockFetchAccountProfile(...args),
    updateAccountProfile: (...args: unknown[]) => mockUpdateAccountProfile(...args),
}));

describe('Account profile presets', () => {
    it('renders five preset avatars and updates the preview when one is selected', async () => {
        mockFetchAccountProfile.mockResolvedValueOnce({
            id: 7,
            email: 'reader@test.local',
            name: 'Reader',
            role: 'reader',
            avatarUrl: null,
            bio: null,
        });

        renderWithProviders(<Profile />);

        expect(await screen.findByText('默认预置 5 个程序员头像')).toBeInTheDocument();
        const presetButtons = document.querySelectorAll('.avatar-preset-card');
        expect(presetButtons.length).toBeGreaterThanOrEqual(6);

        fireEvent.click(presetButtons[0] as HTMLButtonElement);
        await waitFor(() => {
            expect((screen.getByLabelText('头像地址') as HTMLInputElement).value).toContain('/avatars/dev-1.svg');
        });
    });
});
