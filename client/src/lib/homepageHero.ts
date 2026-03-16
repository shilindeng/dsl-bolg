import type { Post } from '../api/client';

export interface HomepageHeroVisual {
    featuredPost: Post | null;
    heroImage: string | null;
    heroAlt: string | null;
}

export function resolveHomepageHeroVisual(posts: Post[]): HomepageHeroVisual {
    const featuredPost = posts[0] || null;

    if (!featuredPost || !featuredPost.coverImage) {
        return {
            featuredPost,
            heroImage: null,
            heroAlt: null,
        };
    }

    return {
        featuredPost,
        heroImage: featuredPost.coverImage,
        heroAlt: featuredPost.coverAlt || featuredPost.title,
    };
}
