import { Router, Request, Response } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { getHomepageAdminState, getPublicHomepage, replaceHomepageSections } from '../lib/homepage.js';
import { formatZodError, homepageAdminSchema, isZodError, parseBody } from '../lib/schemas.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
    try {
        const homepage = await getPublicHomepage();
        res.json(homepage);
    } catch (error) {
        console.error('Homepage fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch homepage sections' });
    }
});

router.get('/admin', authMiddleware, requireAdmin, async (_req: Request, res: Response) => {
    try {
        const state = await getHomepageAdminState();
        res.json(state);
    } catch (error) {
        console.error('Homepage admin fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch homepage admin state' });
    }
});

router.put('/admin', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { sections } = parseBody(homepageAdminSchema, req.body);

        const data = await replaceHomepageSections(sections);
        res.json(data);
    } catch (error) {
        console.error('Homepage admin update error:', error);
        if (isZodError(error)) {
            res.status(400).json(formatZodError(error));
            return;
        }
        res.status(500).json({ error: 'Failed to update homepage sections' });
    }
});

export default router;
