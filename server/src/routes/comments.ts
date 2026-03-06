import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { verifyTurnstileToken } from '../lib/turnstile.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const { postId } = req.query;

        if (!postId) {
            res.status(400).json({ error: 'Missing postId' });
            return;
        }

        const comments = await prisma.comment.findMany({
            where: {
                postId: parseInt(postId as string, 10),
                status: 'approved',
                parentId: null,
            },
            include: {
                replies: {
                    where: { status: 'approved' },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const { content, author, email, postId, parentId, turnstileToken } = req.body as {
            content?: string;
            author?: string;
            email?: string;
            postId?: string | number;
            parentId?: string | number;
            turnstileToken?: string;
        };

        if (!content || !author || !postId) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const validTurnstile = await verifyTurnstileToken(turnstileToken, req.ip);
        if (!validTurnstile) {
            res.status(400).json({ error: 'Turnstile validation failed' });
            return;
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                author,
                email: email || null,
                postId: parseInt(String(postId), 10),
                parentId: parentId ? parseInt(String(parentId), 10) : null,
                status: 'pending',
            },
        });

        res.status(201).json({
            message: 'Comment submitted and awaiting review',
            comment,
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Failed to submit comment' });
    }
});

router.get('/admin', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const comments = await prisma.comment.findMany({
            where: status ? { status } : undefined,
            include: {
                post: {
                    select: { id: true, title: true, slug: true },
                },
                parent: {
                    select: { id: true, author: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        res.json(comments);
    } catch (error) {
        console.error('Error fetching admin comments:', error);
        res.status(500).json({ error: 'Failed to fetch admin comments' });
    }
});

router.patch('/:id/status', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const { status } = req.body as { status?: 'pending' | 'approved' | 'rejected' };

        if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
            res.status(400).json({ error: 'Invalid status' });
            return;
        }

        const comment = await prisma.comment.update({
            where: { id },
            data: { status },
        });

        res.json(comment);
    } catch (error) {
        console.error('Error updating comment status:', error);
        res.status(500).json({ error: 'Failed to update comment status' });
    }
});

export default router;
