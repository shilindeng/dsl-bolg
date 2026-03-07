import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { getDashboardAnalytics } from '../lib/analytics.js';

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/summary', async (_req: Request, res: Response) => {
    try {
        const [totalPosts, totalComments, pendingComments, metaData] = await Promise.all([
            prisma.post.count(),
            prisma.comment.count(),
            prisma.comment.count({ where: { status: 'pending' } }),
            prisma.postMeta.findMany({ select: { views: true, likes: true } }),
        ]);

        const totalViews = metaData.reduce((sum: number, item: { views: number }) => sum + item.views, 0);
        const totalLikes = metaData.reduce((sum: number, item: { likes: number }) => sum + item.likes, 0);

        res.json({ totalPosts, totalViews, totalLikes, totalComments, pendingComments });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

router.get('/dashboard', async (req: Request, res: Response) => {
    try {
        const days = typeof req.query.days === 'string' ? parseInt(req.query.days, 10) : 30;
        const result = await getDashboardAnalytics(Number.isNaN(days) ? 30 : days);
        res.json(result);
    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
    }
});

router.get('/top-posts', async (_req: Request, res: Response) => {
    try {
        const posts = await prisma.post.findMany({
            where: { published: true },
            select: {
                id: true,
                title: true,
                slug: true,
                createdAt: true,
                meta: { select: { views: true, likes: true } },
            },
            take: 50,
        });

        res.json(
            posts
                .map((post: { id: number; title: string; slug: string; createdAt: Date; meta: { views: number; likes: number } | null }) => ({
                    ...post,
                    views: post.meta?.views || 0,
                    likes: post.meta?.likes || 0,
                }))
                .sort((a: { views: number }, b: { views: number }) => b.views - a.views)
                .slice(0, 5),
        );
    } catch (error) {
        console.error('Top posts error:', error);
        res.status(500).json({ error: 'Failed to fetch top posts' });
    }
});

export default router;
