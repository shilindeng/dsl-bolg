import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../hooks/useToast';
import Editor from './Editor';

const mockFetchTags = vi.fn().mockResolvedValue([]);
const mockFetchCategories = vi.fn().mockResolvedValue([]);
const mockFetchAdminSeries = vi.fn().mockResolvedValue([]);
const mockFetchPost = vi.fn();

vi.mock('../api/client', () => ({
    createPost: vi.fn(),
    fetchCategories: (...args: unknown[]) => mockFetchCategories(...args),
    fetchAdminSeries: (...args: unknown[]) => mockFetchAdminSeries(...args),
    fetchPost: (...args: unknown[]) => mockFetchPost(...args),
    fetchTags: (...args: unknown[]) => mockFetchTags(...args),
    updatePost: vi.fn(),
    uploadImage: vi.fn(),
}));

function renderEditor(initialPath: string) {
    return render(
        <HelmetProvider>
            <ToastProvider>
                <MemoryRouter initialEntries={[initialPath]}>
                    <Routes>
                        <Route path="/editor" element={<Editor />} />
                        <Route path="/editor/:slug" element={<Editor />} />
                    </Routes>
                </MemoryRouter>
            </ToastProvider>
        </HelmetProvider>,
    );
}

describe('Editor page', () => {
    it('uses rich text mode for a new article', async () => {
        mockFetchPost.mockReset();
        renderEditor('/editor');

        await screen.findByText('HTML 富文本模式');
        expect(screen.getByTestId('rich-editor-content')).toBeInTheDocument();
    });

    it('keeps markdown compatibility mode for legacy markdown posts', async () => {
        mockFetchPost.mockResolvedValueOnce({
            id: 1,
            title: 'Legacy markdown',
            slug: 'legacy-markdown',
            deck: 'A long enough deck for the editor compatibility test.',
            excerpt: 'Excerpt',
            content: '# Hello\n\nLegacy body',
            contentFormat: 'markdown',
            coverImage: null,
            coverAlt: null,
            published: true,
            featured: false,
            tags: [],
            category: null,
            series: null,
            seriesOrder: null,
        });

        renderEditor('/editor/legacy-markdown');

        await waitFor(() => expect(mockFetchPost).toHaveBeenCalledWith('legacy-markdown'));
        expect(await screen.findByText('Markdown 兼容模式')).toBeInTheDocument();
        expect(screen.getByLabelText('正文内容（Markdown）')).toBeInTheDocument();
    });
});
