import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Middleware to check for Admin (can be refactored to a separate middleware later)
const adminCheck = (req: Request, res: Response, next: Function) => {
    // @ts-ignore
    if (req.user?.email !== 'admin@example.com') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
};

router.use(authMiddleware);
router.use(adminCheck);

// GET /api/analytics/summary
router.get('/summary', async (req, res) => {
    try {
        // Parallel fetching
        const [
            { count: totalPosts },
            { data: totalViewsData },
            { data: totalLikesData },
            { count: totalComments }
        ] = await Promise.all([
            supabase.from('Post').select('*', { count: 'exact', head: true }),
            supabase.from('PostMeta').select('views'),
            supabase.from('PostMeta').select('likes'),
            supabase.from('Comment').select('*', { count: 'exact', head: true })
        ]);

        const totalViews = totalViewsData?.reduce((sum, item) => sum + (item.views || 0), 0) || 0;
        const totalLikes = totalLikesData?.reduce((sum, item) => sum + (item.likes || 0), 0) || 0;

        res.json({
            totalPosts: totalPosts || 0,
            totalViews,
            totalLikes,
            totalComments: totalComments || 0
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

// GET /api/analytics/top-posts
router.get('/top-posts', async (req, res) => {
    try {
        const { data: topPosts, error } = await supabase
            .from('Post')
            .select(`
                id, title, slug, createdAt,
                meta:PostMeta(views, likes)
            `)
            // Manual sorting in code might be needed if Supabase relation sorting is tricky
            // But we can try fetching Meta ordered by views
            // Actually, we fetch posts and then sort.
            .limit(50); // Fetch top 50 mostly recent then sort? 
        // Better: Select PostMeta ordered by views, then join Posts?

        if (error) throw error;

        // Sort by views desc
        const sorted = (topPosts || [])
            .map((p: any) => ({
                ...p,
                views: Array.isArray(p.meta) ? p.meta[0]?.views : p.meta?.views,
                likes: Array.isArray(p.meta) ? p.meta[0]?.likes : p.meta?.likes
            }))
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 5);

        res.json(sorted);
    } catch (error) {
        console.error('Top posts error:', error);
        res.status(500).json({ error: 'Failed to fetch top posts' });
    }
});

export default router;
