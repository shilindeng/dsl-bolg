import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware, getOptionalUser, requireAdmin, type AuthenticatedRequest } from '../middleware/auth.js';
import { analyticsEventTypes, recordAnalyticsEvent } from '../lib/analytics.js';
import { isEmptyCommentContent, normalizeCommentContentFormat, sanitizeCommentHtml } from '../lib/commentContent.js';

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
                user: {
                    select: { id: true, name: true, avatarUrl: true },
                },
                replies: {
                    where: { status: 'approved' },
                    include: {
                        user: {
                            select: { id: true, name: true, avatarUrl: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const currentUser = getOptionalUser(req);
        res.json(
            comments.map((comment) => ({
                ...comment,
                isOwner: currentUser?.id === comment.userId,
                replies: comment.replies.map((reply) => ({
                    ...reply,
                    isOwner: currentUser?.id === reply.userId,
                })),
            })),
        );
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { content, postId, parentId, contentFormat } = req.body as {
            content?: string;
            postId?: string | number;
            parentId?: string | number;
            contentFormat?: string;
        };
        const user = (req as AuthenticatedRequest).user!;

        if (!content || !postId) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const parsedPostId = parseInt(String(postId), 10);
        if (!Number.isFinite(parsedPostId) || parsedPostId <= 0) {
            res.status(400).json({ error: 'Invalid postId' });
            return;
        }

        const resolvedFormat = normalizeCommentContentFormat(contentFormat);

        const raw = String(content);
        if (resolvedFormat === 'html') {
            if (raw.length > 20_000) {
                res.status(400).json({ error: 'Comment is too long' });
                return;
            }
        } else {
            if (raw.trim().length > 2_000) {
                res.status(400).json({ error: 'Comment is too long' });
                return;
            }
        }

        const storedContent =
            resolvedFormat === 'html'
                ? sanitizeCommentHtml(raw)
                : raw.trim();

        if (isEmptyCommentContent(storedContent, resolvedFormat)) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const parsedParentId = parentId ? parseInt(String(parentId), 10) : null;
        if (parsedParentId) {
            const parent = await prisma.comment.findUnique({
                where: { id: parsedParentId },
                select: { id: true, postId: true, parentId: true },
            });

            if (!parent || parent.postId !== parsedPostId) {
                res.status(400).json({ error: 'Invalid parentId' });
                return;
            }

            // Only allow a single reply level (top-level -> reply).
            if (parent.parentId !== null) {
                res.status(400).json({ error: 'Invalid parentId' });
                return;
            }
        }

        const comment = await prisma.comment.create({
            data: {
                content: storedContent,
                contentFormat: resolvedFormat,
                author: user.name || user.email,
                email: user.email,
                postId: parsedPostId,
                parentId: parsedParentId,
                userId: user.id,
                status: 'pending',
            },
            include: {
                user: {
                    select: { id: true, name: true, avatarUrl: true },
                },
            },
        });

        await recordAnalyticsEvent({
            type: analyticsEventTypes.comment,
            postId: parsedPostId,
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
        const postId = typeof req.query.postId === 'string' ? parseInt(req.query.postId, 10) : undefined;
        const userId = typeof req.query.userId === 'string' ? parseInt(req.query.userId, 10) : undefined;
        const comments = await prisma.comment.findMany({
            where: {
                ...(status ? { status } : {}),
                ...(postId ? { postId } : {}),
                ...(userId ? { userId } : {}),
            },
            include: {
                post: {
                    select: { id: true, title: true, slug: true },
                },
                user: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
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

        await recordAnalyticsEvent({
            type: analyticsEventTypes.commentReview,
            postId: comment.postId,
            metadata: { commentId: comment.id, status },
        });

        res.json(comment);
    } catch (error) {
        console.error('Error updating comment status:', error);
        res.status(500).json({ error: 'Failed to update comment status' });
    }
});

export default router;
