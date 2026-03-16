import { describe, expect, it } from 'vitest';
import type { Post } from '../api/client';
import { resolveHomepageHeroVisual } from './homepageHero';

function createPost(overrides: Partial<Post> = {}): Post {
    return {
        id: 1,
        title: 'Hero Post',
        slug: 'hero-post',
        deck: 'Deck',
        excerpt: 'Excerpt',
        content: '<p>Hello</p>',
        contentFormat: 'html',
        coverImage: '/uploads/hero.jpg',
        coverAlt: 'Hero alt',
        sourceUrl: null,
        published: true,
        featured: true,
        publishedAt: '2026-03-16T00:00:00.000Z',
        createdAt: '2026-03-15T00:00:00.000Z',
        updatedAt: '2026-03-16T00:00:00.000Z',
        tags: [],
        category: null,
        meta: { views: 0, likes: 0, readTime: 3 },
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

describe('resolveHomepageHeroVisual', () => {
    it('uses the first featured post cover as hero image', () => {
        const post = createPost();
        const result = resolveHomepageHeroVisual([post]);

        expect(result.featuredPost?.slug).toBe('hero-post');
        expect(result.heroImage).toBe('/uploads/hero.jpg');
        expect(result.heroAlt).toBe('Hero alt');
    });

    it('falls back to generated visuals when the first featured post has no cover', () => {
        const post = createPost({ coverImage: null, coverAlt: null });
        const result = resolveHomepageHeroVisual([post]);

        expect(result.featuredPost?.slug).toBe('hero-post');
        expect(result.heroImage).toBeNull();
        expect(result.heroAlt).toBeNull();
    });
});
