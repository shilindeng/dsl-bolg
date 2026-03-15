import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.js';
import { formatPost, includePostRelations } from '../lib/posts.js';
import { accountProfileSchema, formatZodError, isZodError, parseBody } from '../lib/schemas.js';

const router = Router();

router.use(authMiddleware);

function getUserId(req: Request) {
    return (req as AuthenticatedRequest).user!.id;
}

router.get('/profile', async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: getUserId(req) },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatarUrl: true,
                bio: true,
                emailVerifiedAt: true,
                lastLoginAt: true,
                createdAt: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error('Account profile error:', error);
        res.status(500).json({ error: 'Failed to fetch account profile' });
    }
});

router.patch('/profile', async (req: Request, res: Response) => {
    try {
        const { name, avatarUrl, bio } = parseBody(accountProfileSchema, req.body);

        const user = await prisma.user.update({
            where: { id: getUserId(req) },
            data: {
                ...(name !== undefined ? { name: name.trim() || 'Reader' } : {}),
                ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
                ...(bio !== undefined ? { bio: bio?.trim() || null } : {}),
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatarUrl: true,
                bio: true,
                emailVerifiedAt: true,
                lastLoginAt: true,
                createdAt: true,
            },
        });

        res.json(user);
    } catch (error) {
        console.error('Account profile update error:', error);
        if (isZodError(error)) {
            res.status(400).json(formatZodError(error));
            return;
        }
        res.status(500).json({ error: 'Failed to update account profile' });
    }
});

router.get('/comments', async (req: Request, res: Response) => {
    try {
        const comments = await prisma.comment.findMany({
            where: { userId: getUserId(req) },
            include: {
                post: {
                    select: { id: true, slug: true, title: true },
                },
                replies: {
                    where: { userId: getUserId(req) },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(comments);
    } catch (error) {
        console.error('Account comments error:', error);
        res.status(500).json({ error: 'Failed to fetch account comments' });
    }
});

router.get('/bookmarks', async (req: Request, res: Response) => {
    try {
        const bookmarks = await prisma.bookmark.findMany({
            where: { userId: getUserId(req) },
            include: {
                post: {
                    include: includePostRelations,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(
            bookmarks.map((item) => ({
                ...item,
                post: formatPost(item.post),
            })),
        );
    } catch (error) {
        console.error('Account bookmarks error:', error);
        res.status(500).json({ error: 'Failed to fetch bookmarks' });
    }
});

router.post('/bookmarks/:postId', async (req: Request, res: Response) => {
    try {
        const postId = parseInt(String(req.params.postId), 10);
        const bookmark = await prisma.bookmark.upsert({
            where: {
                userId_postId: {
                    userId: getUserId(req),
                    postId,
                },
            },
            update: {},
            create: {
                userId: getUserId(req),
                postId,
            },
        });

        res.status(201).json(bookmark);
    } catch (error) {
        console.error('Bookmark create error:', error);
        res.status(500).json({ error: 'Failed to bookmark post' });
    }
});

router.delete('/bookmarks/:postId', async (req: Request, res: Response) => {
    try {
        const postId = parseInt(String(req.params.postId), 10);
        await prisma.bookmark.delete({
            where: {
                userId_postId: {
                    userId: getUserId(req),
                    postId,
                },
            },
        });

        res.status(204).end();
    } catch (error) {
        console.error('Bookmark delete error:', error);
        res.status(500).json({ error: 'Failed to remove bookmark' });
    }
});

router.get('/history', async (req: Request, res: Response) => {
    try {
        const history = await prisma.readingHistory.findMany({
            where: { userId: getUserId(req) },
            include: {
                post: {
                    include: includePostRelations,
                },
            },
            orderBy: { lastViewedAt: 'desc' },
        });

        res.json(
            history.map((item) => ({
                ...item,
                post: formatPost(item.post),
            })),
        );
    } catch (error) {
        console.error('Reading history error:', error);
        res.status(500).json({ error: 'Failed to fetch reading history' });
    }
});

export default router;
