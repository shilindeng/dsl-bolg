import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import slugify from 'slugify';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            include: { _count: { select: { posts: true } } },
            orderBy: { name: 'asc' },
        });

        res.json(
            categories.map((category: { id: number; name: string; slug: string; _count: { posts: number } }) => ({
                id: category.id,
                name: category.name,
                slug: category.slug,
                _count: { posts: category._count.posts },
            })),
        );
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

router.post('/', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const slug = slugify(name, { lower: true, strict: true }) || `category-${Date.now()}`;
        const category = await prisma.category.create({
            data: { name, slug },
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

export default router;
