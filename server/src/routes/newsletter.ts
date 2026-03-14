import { Router, Request, Response } from 'express';
import slugify from 'slugify';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireAdmin, type AuthenticatedRequest } from '../middleware/auth.js';
import { createEmailToken, consumeEmailToken } from '../lib/authTokens.js';
import { buildSiteUrl, sendMail } from '../lib/email.js';
import { verifyTurnstileToken } from '../lib/turnstile.js';
import { enqueueNewsletterIssue, isNewsletterIssueQueued } from '../lib/newsletterQueue.js';

const router = Router();
const isProduction = process.env.NODE_ENV === 'production';

async function resolveIssueSlug(input: string, excludeId?: number) {
    const base = slugify(input, { lower: true, strict: true }) || `issue-${Date.now()}`;
    let candidate = base;
    let counter = 1;

    while (true) {
        const existing = await prisma.newsletterIssue.findUnique({ where: { slug: candidate } });
        if (!existing || existing.id === excludeId) {
            return candidate;
        }
        candidate = `${base}-${counter}`;
        counter += 1;
    }
}

router.post('/subscribe', async (req: Request, res: Response) => {
    try {
        const { email, turnstileToken, source } = req.body as {
            email?: string;
            turnstileToken?: string;
            source?: string;
        };

        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const validTurnstile = await verifyTurnstileToken(turnstileToken, req.ip);
        if (!validTurnstile) {
            res.status(400).json({ error: 'Turnstile validation failed' });
            return;
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        const subscriber = await prisma.newsletterSubscriber.upsert({
            where: { email },
            update: {
                status: 'pending',
                unsubscribedAt: null,
                source: source || 'website',
                userId: existingUser?.id ?? undefined,
            },
            create: {
                email,
                source: source || 'website',
                userId: existingUser?.id ?? null,
            },
        });

        const { rawValue, expiresAt } = await createEmailToken({
            email,
            purpose: 'newsletter_confirm',
            userId: existingUser?.id,
            ttlMinutes: 60 * 24,
            kind: 'opaque',
        });

        const confirmUrl = buildSiteUrl(`/newsletter?email=${encodeURIComponent(email)}&token=${rawValue}`);
        const preview = await sendMail({
            to: email,
            subject: '确认订阅 DSL Blog Newsletter',
            html: `<p>点击确认订阅：</p><p><a href="${confirmUrl}">${confirmUrl}</a></p>`,
            text: `打开链接确认订阅：${confirmUrl}`,
        });

        res.status(201).json({
            message: subscriber.confirmedAt ? 'Subscription refreshed' : 'Please confirm your email subscription',
            expiresAt: expiresAt.toISOString(),
            ...(isProduction ? {} : { preview }),
        });
    } catch (error) {
        console.error('Newsletter subscribe error:', error);
        res.status(500).json({ error: 'Failed to subscribe to newsletter' });
    }
});

router.post('/confirm', async (req: Request, res: Response) => {
    try {
        const { email, token } = req.body as { email?: string; token?: string };

        if (!email || !token) {
            res.status(400).json({ error: 'Email and token are required' });
            return;
        }

        const tokenRecord = await consumeEmailToken({
            email,
            purpose: 'newsletter_confirm',
            value: token,
        });

        if (!tokenRecord) {
            res.status(400).json({ error: 'Confirmation token is invalid or expired' });
            return;
        }

        const subscriber = await prisma.newsletterSubscriber.upsert({
            where: { email },
            update: {
                status: 'active',
                confirmedAt: new Date(),
                unsubscribedAt: null,
            },
            create: {
                email,
                status: 'active',
                confirmedAt: new Date(),
            },
        });

        res.json(subscriber);
    } catch (error) {
        console.error('Newsletter confirm error:', error);
        res.status(500).json({ error: 'Failed to confirm newsletter subscription' });
    }
});

router.post('/unsubscribe', async (req: Request, res: Response) => {
    try {
        const { email, token } = req.body as { email?: string; token?: string };
        if (!email || !token) {
            res.status(400).json({ error: 'Email and token are required' });
            return;
        }

        const tokenRecord = await consumeEmailToken({
            email,
            purpose: 'newsletter_unsubscribe',
            value: token,
        });

        if (!tokenRecord) {
            res.status(400).json({ error: 'Unsubscribe token is invalid or expired' });
            return;
        }

        const subscriber = await prisma.newsletterSubscriber.update({
            where: { email },
            data: {
                status: 'unsubscribed',
                unsubscribedAt: new Date(),
            },
        });

        res.json(subscriber);
    } catch (error) {
        console.error('Newsletter unsubscribe error:', error);
        res.status(500).json({ error: 'Failed to unsubscribe from newsletter' });
    }
});

router.get('/issues', async (_req: Request, res: Response) => {
    try {
        const issues = await prisma.newsletterIssue.findMany({
            where: { status: { in: ['published', 'sent', 'sent_with_errors'] } },
            orderBy: { createdAt: 'desc' },
        });

        res.json(issues);
    } catch (error) {
        console.error('Newsletter issues error:', error);
        res.status(500).json({ error: 'Failed to fetch newsletter issues' });
    }
});

router.get('/issues/:slug', async (req: Request, res: Response) => {
    try {
        const issue = await prisma.newsletterIssue.findUnique({
            where: { slug: String(req.params.slug) },
        });

        if (!issue || !['published', 'sent', 'sent_with_errors'].includes(issue.status)) {
            res.status(404).json({ error: 'Newsletter issue not found' });
            return;
        }

        res.json(issue);
    } catch (error) {
        console.error('Newsletter issue detail error:', error);
        res.status(500).json({ error: 'Failed to fetch newsletter issue' });
    }
});

router.get('/admin/subscribers', authMiddleware, requireAdmin, async (_req: Request, res: Response) => {
    try {
        const subscribers = await prisma.newsletterSubscriber.findMany({
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        });
        res.json(subscribers);
    } catch (error) {
        console.error('Newsletter subscribers error:', error);
        res.status(500).json({ error: 'Failed to fetch subscribers' });
    }
});

router.get('/admin/issues', authMiddleware, requireAdmin, async (_req: Request, res: Response) => {
    try {
        const issues = await prisma.newsletterIssue.findMany({
            include: {
                deliveries: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(issues);
    } catch (error) {
        console.error('Newsletter admin issues error:', error);
        res.status(500).json({ error: 'Failed to fetch newsletter admin issues' });
    }
});

router.post('/admin/issues', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { title, slug, subject, previewText, bodyMarkdown, status } = req.body as {
            title?: string;
            slug?: string;
            subject?: string;
            previewText?: string;
            bodyMarkdown?: string;
            status?: string;
        };

        if (!title || !subject || !bodyMarkdown) {
            res.status(400).json({ error: 'Title, subject and content are required' });
            return;
        }

        const issue = await prisma.newsletterIssue.create({
            data: {
                title,
                slug: await resolveIssueSlug(slug || title),
                subject,
                previewText: previewText?.trim() || '',
                bodyMarkdown,
                status: status || 'draft',
                createdById: (req as AuthenticatedRequest).user!.id,
            },
        });

        res.status(201).json(issue);
    } catch (error) {
        console.error('Newsletter issue create error:', error);
        res.status(500).json({ error: 'Failed to create newsletter issue' });
    }
});

router.put('/admin/issues/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const { title, slug, subject, previewText, bodyMarkdown, status } = req.body as {
            title?: string;
            slug?: string;
            subject?: string;
            previewText?: string;
            bodyMarkdown?: string;
            status?: string;
        };

        const existing = await prisma.newsletterIssue.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Newsletter issue not found' });
            return;
        }

        const issue = await prisma.newsletterIssue.update({
            where: { id },
            data: {
                ...(title !== undefined ? { title } : {}),
                ...(subject !== undefined ? { subject } : {}),
                ...(previewText !== undefined ? { previewText: previewText.trim() } : {}),
                ...(bodyMarkdown !== undefined ? { bodyMarkdown } : {}),
                ...(status !== undefined ? { status } : {}),
                ...(title !== undefined || slug !== undefined ? { slug: await resolveIssueSlug(slug || title || existing.title, id) } : {}),
            },
        });

        res.json(issue);
    } catch (error) {
        console.error('Newsletter issue update error:', error);
        res.status(500).json({ error: 'Failed to update newsletter issue' });
    }
});

router.post('/admin/issues/:id/send', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const issue = await prisma.newsletterIssue.findUnique({ where: { id } });
        if (!issue) {
            res.status(404).json({ error: 'Newsletter issue not found' });
            return;
        }

        if (isNewsletterIssueQueued(issue.id)) {
            res.status(409).json({ error: 'Newsletter issue is already queued for delivery' });
            return;
        }

        const updatedIssue = await prisma.newsletterIssue.update({
            where: { id: issue.id },
            data: {
                status: 'queued',
                sentAt: null,
            },
        });

        enqueueNewsletterIssue(issue.id);

        res.json({ issue: updatedIssue, message: 'Newsletter issue queued for delivery' });
    } catch (error) {
        console.error('Newsletter send error:', error);
        res.status(500).json({ error: 'Failed to send newsletter issue' });
    }
});

export default router;
