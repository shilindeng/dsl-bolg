import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { closeTestContext, ensureTestContext, resetDatabase } from './helpers/testContext.js';

describe('homepage fallback and health', () => {
    let prisma: Awaited<ReturnType<typeof ensureTestContext>>['prisma'];
    let getPublicHomepage: typeof import('../src/lib/homepage.js').getPublicHomepage;

    beforeAll(async () => {
        const context = await ensureTestContext();
        prisma = context.prisma;
        ({ getPublicHomepage } = await import('../src/lib/homepage.js'));
    });

    afterEach(async () => {
        await resetDatabase();
    });

    afterAll(async () => {
        await closeTestContext();
    });

    it('auto-fills featured content for the hero issue card', async () => {
        await prisma.post.create({
            data: {
                title: 'Fallback post',
                slug: 'fallback-post',
                content: '# Hello',
                contentFormat: 'markdown',
                deck: 'A long enough deck to make the post public and eligible.',
                excerpt: 'An excerpt that is also long enough.',
                published: true,
                tags: {
                    create: [{ tag: { create: { name: 'fallback', slug: 'fallback' } } }],
                },
                meta: { create: { readTime: 1 } },
            },
        });

        await prisma.project.create({
            data: {
                name: 'Fallback project',
                slug: 'fallback-project',
                summary: 'Project summary long enough.',
                description: 'Project description long enough to pass readiness checks.',
                techStack: 'React, Prisma',
            },
        });

        const homepage = await getPublicHomepage();
        const featuredPosts = homepage.sections.find((section) => section.type === 'featured_posts');
        const featuredProjects = homepage.sections.find((section) => section.type === 'featured_projects');

        expect(featuredPosts?.items?.length).toBeGreaterThan(0);
        expect(featuredProjects?.items?.length).toBeGreaterThan(0);
        expect(homepage.health.featuredPostReady).toBe(true);
        expect(homepage.health.featuredProjectReady).toBe(true);
    });
});
