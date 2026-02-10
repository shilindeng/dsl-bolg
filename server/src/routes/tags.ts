import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import slugify from 'slugify';

const router = Router();

// GET /api/tags — list all tags with post count
router.get('/', async (_req: Request, res: Response) => {
    try {
        const tags = await prisma.tag.findMany({
            include: { _count: { select: { posts: true } } },
            orderBy: { name: 'asc' },
        });
        res.json(tags);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
});

// POST /api/tags — create a new tag
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const slug = slugify(name, { lower: true, strict: true });

        const tag = await prisma.tag.create({
            data: { name, slug },
        });

        res.status(201).json(tag);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create tag' });
    }
});

export default router;
