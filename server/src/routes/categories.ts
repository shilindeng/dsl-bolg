import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import slugify from 'slugify';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { categoryCreateSchema, categoryUpdateSchema, formatZodError, isZodError, parseBody } from '../lib/schemas.js';

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
        const { name } = parseBody(categoryCreateSchema, req.body);
        const slug = slugify(name, { lower: true, strict: true }) || `category-${Date.now()}`;
        const category = await prisma.category.create({
            data: { name, slug },
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        if (isZodError(error)) {
            res.status(400).json(formatZodError(error));
            return;
        }
        res.status(500).json({ error: 'Failed to create category' });
    }
});

router.put('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const existing = await prisma.category.findUnique({ where: { id } });

        if (!existing) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }

        const payload = parseBody(categoryUpdateSchema, req.body);
        const nextName = payload.name?.trim() || existing.name;
        const nextSlug = payload.slug?.trim() || slugify(nextName, { lower: true, strict: true }) || existing.slug;
        const category = await prisma.category.update({
            where: { id },
            data: {
                name: nextName,
                slug: nextSlug,
            },
        });

        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        if (isZodError(error)) {
            res.status(400).json(formatZodError(error));
            return;
        }
        res.status(500).json({ error: 'Failed to update category' });
    }
});

router.delete('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const payload = parseBody(categoryUpdateSchema.partial(), req.body);
        const replacementCategoryId = payload.replacementCategoryId === undefined || payload.replacementCategoryId === null
            ? null
            : Number(payload.replacementCategoryId);

        const existing = await prisma.category.findUnique({
            where: { id },
            include: { _count: { select: { posts: true } } },
        });

        if (!existing) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }

        if (existing._count.posts > 0 && !replacementCategoryId) {
            res.status(400).json({ error: 'Replacement category is required when deleting a category with posts' });
            return;
        }

        if (replacementCategoryId === id) {
            res.status(400).json({ error: 'Replacement category cannot be the same as the deleted category' });
            return;
        }

        if (replacementCategoryId) {
            const replacement = await prisma.category.findUnique({ where: { id: replacementCategoryId } });
            if (!replacement) {
                res.status(400).json({ error: 'Replacement category not found' });
                return;
            }
        }

        await prisma.$transaction(async (tx) => {
            if (replacementCategoryId) {
                await tx.post.updateMany({
                    where: { categoryId: id },
                    data: { categoryId: replacementCategoryId },
                });
            }

            await tx.category.delete({ where: { id } });
        });

        res.status(204).end();
    } catch (error) {
        console.error('Error deleting category:', error);
        if (isZodError(error)) {
            res.status(400).json(formatZodError(error));
            return;
        }
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

export default router;
