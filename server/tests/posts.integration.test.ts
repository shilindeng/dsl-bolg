import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { closeTestContext, ensureTestContext, resetDatabase, signAdminToken } from './helpers/testContext.js';

describe('posts integration', () => {
    let app: ReturnType<typeof import('../src/app.js')['createApp']>;

    beforeAll(async () => {
        const context = await ensureTestContext();
        app = context.createApp();
    });

    afterEach(async () => {
        await resetDatabase();
    });

    afterAll(async () => {
        await closeTestContext();
    });

    it('creates and reads a markdown article', async () => {
        const token = signAdminToken();
        const createResponse = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Markdown article',
                contentFormat: 'markdown',
                content: '# Title\n\n## Section one\n\nBody text',
                deck: 'A long enough deck to publish the article safely.',
                excerpt: '',
                published: true,
                featured: false,
                tags: ['docs'],
            });

        expect(createResponse.status).toBe(201);
        expect(createResponse.body.contentFormat).toBe('markdown');

        const detailResponse = await request(app).get(`/api/posts/${createResponse.body.slug}`);
        expect(detailResponse.status).toBe(200);
        expect(detailResponse.body.toc[0].text).toBe('Section one');
    });

    it('creates and reads an html rich text article', async () => {
        const token = signAdminToken();
        const createResponse = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'HTML article',
                contentFormat: 'html',
                content: '<h2>Intro</h2><p>Body</p><h3>Details</h3><p>More text</p>',
                deck: 'A long enough deck for rich text publishing.',
                excerpt: '',
                published: true,
                featured: false,
                tags: ['html'],
            });

        expect(createResponse.status).toBe(201);
        expect(createResponse.body.contentFormat).toBe('html');

        const detailResponse = await request(app).get(`/api/posts/${createResponse.body.slug}`);
        expect(detailResponse.status).toBe(200);
        expect(detailResponse.body.toc.map((item: { text: string }) => item.text)).toEqual(['Intro', 'Details']);
    });
});
