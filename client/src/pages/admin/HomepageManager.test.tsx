import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import HomepageManager from './HomepageManager';

vi.mock('../../api/client', () => ({
    fetchAdminHomepage: vi.fn().mockResolvedValue({
        sections: [],
        health: {
            featuredPostReady: false,
            featuredProjectReady: true,
            featuredPostFallbackUsed: true,
            featuredProjectFallbackUsed: false,
            warnings: ['featured_posts_missing'],
        },
    }),
    fetchHomepage: vi.fn().mockResolvedValue({ sections: [], health: { warnings: [] } }),
    fetchPosts: vi.fn().mockResolvedValue({ data: [], pagination: { page: 1, limit: 40, total: 0, totalPages: 0 } }),
    fetchProjects: vi.fn().mockResolvedValue([]),
    saveAdminHomepage: vi.fn(),
}));

describe('Homepage manager health', () => {
    it('shows homepage health warnings from the server', async () => {
        renderWithProviders(<HomepageManager />);

        expect(await screen.findByText('首页健康检查')).toBeInTheDocument();
        expect(screen.getByText('首屏文章位：缺失')).toBeInTheDocument();
        expect(screen.getByText('featured_posts_missing')).toBeInTheDocument();
    });
});
