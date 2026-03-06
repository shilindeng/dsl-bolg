import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const adminCheck = (req: Request, res: Response, next: Function) => {
    if ((req as any).user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
};

router.use(authMiddleware);
router.use(adminCheck);

// GET /api/analytics/summary
router.get('/summary', async (_req: Request, res: Response) => {
    try {
        const [totalPosts, totalComments, metaData] = await Promise.all([
            prisma.post.count(),
            prisma.comment.count(),
            prisma.postMeta.findMany({ select: { views: true, likes: true } }),
        ]);

        const totalViews = metaData.reduce((sum, m) => sum + m.views, 0);
        const totalLikes = metaData.reduce((sum, m) => sum + m.likes, 0);

        res.json({ totalPosts, totalViews, totalLikes, totalComments });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

// GET /api/analytics/top-posts
router.get('/top-posts', async (_req: Request, res: Response) => {
    try {
        const posts = await prisma.post.findMany({
            select: {
                id: true,
                title: true,
                slug: true,
                createdAt: true,
                meta: { select: { views: true, likes: true } },
            },
            take: 50,
        });

        const sorted = posts
            .map(p => ({
                ...p,
                views: p.meta?.views || 0,
                likes: p.meta?.likes || 0,
            }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);

        res.json(sorted);
    } catch (error) {
        console.error('Top posts error:', error);
        res.status(500).json({ error: 'Failed to fetch top posts' });
    }
});

export default router;
