import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { createStableSlug } from '../lib/slugs.js';

const router = Router();

async function resolveCategorySlug(input: string, excludeId?: number) {
    const base = createStableSlug(input, 'category');
    let candidate = base;
    let counter = 1;

    while (true) {
        const existing = await prisma.category.findUnique({ where: { slug: candidate } });
        if (!existing || existing.id === excludeId) {
            return candidate;
        }

        candidate = `${base}-${counter}`;
        counter += 1;
    }
}

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
        const { name } = req.body as { name?: string };
        if (!name?.trim()) {
            res.status(400).json({ error: 'Category name is required' });
            return;
        }

        const category = await prisma.category.create({
            data: { name: name.trim(), slug: await resolveCategorySlug(name) },
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

router.put('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const { name } = req.body as { name?: string };

        if (!name?.trim()) {
            res.status(400).json({ error: 'Category name is required' });
            return;
        }

        const existing = await prisma.category.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }

        const category = await prisma.category.update({
            where: { id },
            data: {
                name: name.trim(),
                slug: await resolveCategorySlug(name, id),
            },
        });

        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

router.delete('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const usage = await prisma.post.count({ where: { categoryId: id } });
        if (usage > 0) {
            res.status(400).json({ error: 'Category is still assigned to posts' });
            return;
        }

        await prisma.category.delete({ where: { id } });
        res.status(204).end();
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

export default router;
