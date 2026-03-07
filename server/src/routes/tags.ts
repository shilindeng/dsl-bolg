import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import slugify from 'slugify';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
    try {
        const tags = await prisma.tag.findMany({
            include: { _count: { select: { posts: true } } },
            orderBy: { name: 'asc' },
        });

        res.json(
            tags.map((tag: { id: number; name: string; slug: string; _count: { posts: number } }) => ({
                id: tag.id,
                name: tag.name,
                slug: tag.slug,
                _count: { posts: tag._count.posts },
            })),
        );
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
});

router.post('/', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const slug = slugify(name, { lower: true, strict: true }) || `tag-${Date.now()}`;
        const tag = await prisma.tag.create({
            data: { name, slug },
        });

        res.status(201).json(tag);
    } catch (error) {
        console.error('Error creating tag:', error);
        res.status(500).json({ error: 'Failed to create tag' });
    }
});

export default router;
