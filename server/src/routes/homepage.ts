import { Router, Request, Response } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { getHomepageAdminState, getPublicHomepage, replaceHomepageSections } from '../lib/homepage.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
    try {
        const sections = await getPublicHomepage();
        res.json({ sections });
    } catch (error) {
        console.error('Homepage fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch homepage sections' });
    }
});

router.get('/admin', authMiddleware, requireAdmin, async (_req: Request, res: Response) => {
    try {
        const sections = await getHomepageAdminState();
        res.json({ sections });
    } catch (error) {
        console.error('Homepage admin fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch homepage admin state' });
    }
});

router.put('/admin', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { sections } = req.body as {
            sections?: Array<{
                type: string;
                enabled: boolean;
                sortOrder: number;
                sourceType: string;
                eyebrow?: string | null;
                title?: string | null;
                description?: string | null;
                ctaLabel?: string | null;
                ctaHref?: string | null;
                configJson?: string | null;
            }>;
        };

        if (!Array.isArray(sections)) {
            res.status(400).json({ error: 'Sections payload is required' });
            return;
        }

        const data = await replaceHomepageSections(sections);
        res.json({ sections: data });
    } catch (error) {
        console.error('Homepage admin update error:', error);
        res.status(500).json({ error: 'Failed to update homepage sections' });
    }
});

export default router;
