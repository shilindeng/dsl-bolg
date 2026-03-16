import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Post } from '../api/client';
import { renderWithProviders } from '../test/renderWithProviders';
import PostCard from './PostCard';

function createPost(overrides: Partial<Post> = {}): Post {
    return {
        id: 1,
        title: 'Grid Post',
        slug: 'grid-post',
        deck: 'Deck copy',
        excerpt: 'Excerpt copy',
        content: '<p>Hello</p>',
        contentFormat: 'html',
        coverImage: null,
        coverAlt: null,
        sourceUrl: null,
        published: true,
        featured: false,
        publishedAt: '2026-03-16T00:00:00.000Z',
        createdAt: '2026-03-15T00:00:00.000Z',
        updatedAt: '2026-03-16T00:00:00.000Z',
        tags: [],
        category: null,
        meta: { views: 0, likes: 0, readTime: 4 },
        comments: [],
        toc: [],
        relatedPosts: [],
        previousPost: null,
        nextPost: null,
        series: null,
        seriesOrder: null,
        viewerState: { bookmarked: false },
        ...overrides,
    };
}

describe('PostCard', () => {
    it('renders the grid layout class and reading metadata', () => {
        renderWithProviders(<PostCard post={createPost()} layout="grid" />);

        const card = screen.getByTestId('post-card-grid-post');
        expect(card).toHaveClass('post-card');
        expect(card).toHaveClass('is-grid');
        expect(screen.getByText('阅读全文')).toBeInTheDocument();
        expect(screen.getByText('4 分钟')).toBeInTheDocument();
    });
});
