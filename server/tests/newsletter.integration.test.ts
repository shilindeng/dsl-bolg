import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { closeTestContext, ensureTestContext, resetDatabase, signAdminToken } from './helpers/testContext.js';

describe('newsletter queue', () => {
    let app: ReturnType<typeof import('../src/app.js')['createApp']>;
    let prisma: Awaited<ReturnType<typeof ensureTestContext>>['prisma'];
    let processNewsletterQueueOnce: typeof import('../src/lib/newsletterWorker.js').processNewsletterQueueOnce;

    beforeAll(async () => {
        const context = await ensureTestContext();
        app = context.createApp();
        prisma = context.prisma;
        ({ processNewsletterQueueOnce } = await import('../src/lib/newsletterWorker.js'));
    });

    afterEach(async () => {
        await resetDatabase();
    });

    afterAll(async () => {
        await closeTestContext();
    });

    it('queues and delivers newsletter issues asynchronously', async () => {
        await prisma.user.create({
            data: {
                id: 1,
                email: 'admin@test.local',
                name: 'Test Admin',
                role: 'admin',
            },
        });

        await prisma.newsletterSubscriber.create({
            data: {
                email: 'reader@test.local',
                status: 'active',
                source: 'test',
                confirmedAt: new Date(),
            },
        });

        const token = signAdminToken();
        const createIssue = await request(app)
            .post('/api/newsletter/admin/issues')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Queued issue',
                subject: 'Queued issue subject',
                previewText: 'Preview text',
                bodyMarkdown: 'Body content',
            });

        expect(createIssue.status).toBe(201);

        const sendResponse = await request(app)
            .post(`/api/newsletter/admin/issues/${createIssue.body.id}/send`)
            .set('Authorization', `Bearer ${token}`);

        expect(sendResponse.status).toBe(200);
        expect(sendResponse.body.issue.status).toBe('queued');
        expect(sendResponse.body.queued).toBe(1);

        await processNewsletterQueueOnce();

        const updatedIssue = await prisma.newsletterIssue.findUnique({
            where: { id: createIssue.body.id },
            include: { deliveries: true },
        });

        expect(updatedIssue?.status).toBe('sent');
        expect(updatedIssue?.deliveries[0]?.status).toBe('sent');
        expect(updatedIssue?.deliveries[0]?.attemptCount).toBe(1);
    });
});
