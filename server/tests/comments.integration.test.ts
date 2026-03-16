import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { closeTestContext, ensureTestContext, resetDatabase, signAdminToken } from './helpers/testContext.js';

describe('comments integration', () => {
    let app: ReturnType<typeof import('../src/app.js')['createApp']>;
    let prisma: Awaited<ReturnType<typeof ensureTestContext>>['prisma'];

    beforeAll(async () => {
        const context = await ensureTestContext();
        prisma = context.prisma;
        app = context.createApp();
    });

    afterEach(async () => {
        await resetDatabase();
    });

    afterAll(async () => {
        await closeTestContext();
    });

    it('sanitizes html comments and normalizes outbound links', async () => {
        const user = await prisma.user.create({
            data: {
                email: 'reader@test.local',
                name: 'Reader',
                role: 'reader',
                emailVerifiedAt: new Date(),
            },
        });

        const token = signAdminToken({ id: user.id, role: 'reader', email: user.email, name: user.name });

        const post = await prisma.post.create({
            data: {
                title: 'Test post',
                slug: 'test-post',
                excerpt: 'This excerpt is long enough for public rendering.',
                deck: 'This deck is long enough for public rendering.',
                content: '# Title\n\nBody',
                contentFormat: 'markdown',
                published: true,
                publishedAt: new Date(),
            },
        });

        const response = await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${token}`)
            .send({
                postId: post.id,
                contentFormat: 'html',
                content: [
                    '<p>Hello <strong>World</strong></p>',
                    '<p><img src="https://evil.example/x.png" onerror="alert(1)" /></p>',
                    '<script>alert(1)</script>',
                    '<a href="javascript:alert(1)">bad</a>',
                    '<a href="https://example.com">good</a>',
                ].join(''),
            });

        expect(response.status).toBe(201);
        expect(response.body.comment.contentFormat).toBe('html');
        expect(response.body.comment.content).toContain('<strong>World</strong>');
        expect(response.body.comment.content).not.toMatch(/<script\b/i);
        expect(response.body.comment.content).not.toMatch(/onerror\s*=/i);
        expect(response.body.comment.content).not.toMatch(/<img\b/i);
        expect(response.body.comment.content).not.toMatch(/javascript:/i);
        expect(response.body.comment.content).toContain('rel="noreferrer nofollow"');
        expect(response.body.comment.content).toContain('target="_blank"');
    });

    it('rejects parentId from another post', async () => {
        const user = await prisma.user.create({
            data: {
                email: 'reader2@test.local',
                name: 'Reader 2',
                role: 'reader',
                emailVerifiedAt: new Date(),
            },
        });
        const token = signAdminToken({ id: user.id, role: 'reader', email: user.email, name: user.name });

        const [postA, postB] = await Promise.all([
            prisma.post.create({
                data: {
                    title: 'Post A',
                    slug: 'post-a',
                    excerpt: 'This excerpt is long enough for public rendering.',
                    deck: 'This deck is long enough for public rendering.',
                    content: '# A\n\nBody',
                    contentFormat: 'markdown',
                    published: true,
                    publishedAt: new Date(),
                },
            }),
            prisma.post.create({
                data: {
                    title: 'Post B',
                    slug: 'post-b',
                    excerpt: 'This excerpt is long enough for public rendering.',
                    deck: 'This deck is long enough for public rendering.',
                    content: '# B\n\nBody',
                    contentFormat: 'markdown',
                    published: true,
                    publishedAt: new Date(),
                },
            }),
        ]);

        const parent = await prisma.comment.create({
            data: {
                postId: postA.id,
                content: 'Parent',
                contentFormat: 'text',
                author: user.name,
                email: user.email,
                userId: user.id,
                status: 'approved',
            },
        });

        const response = await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${token}`)
            .send({
                postId: postB.id,
                parentId: parent.id,
                contentFormat: 'html',
                content: '<p>Reply</p>',
            });

        expect(response.status).toBe(400);
        expect(String(response.body.error || '')).toContain('parentId');
    });
});

