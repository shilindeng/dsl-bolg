import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { createStableSlug } from '../lib/slugs.js';

const router = Router();

async function resolveTagSlug(input: string, excludeId?: number) {
    const base = createStableSlug(input, 'tag');
    let candidate = base;
    let counter = 1;

    while (true) {
        const existing = await prisma.tag.findUnique({ where: { slug: candidate } });
        if (!existing || existing.id === excludeId) {
            return candidate;
        }

        candidate = `${base}-${counter}`;
        counter += 1;
    }
}

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
        const { name } = req.body as { name?: string };
        if (!name?.trim()) {
            res.status(400).json({ error: 'Tag name is required' });
            return;
        }

        const tag = await prisma.tag.create({
            data: { name: name.trim(), slug: await resolveTagSlug(name) },
        });

        res.status(201).json(tag);
    } catch (error) {
        console.error('Error creating tag:', error);
        res.status(500).json({ error: 'Failed to create tag' });
    }
});

router.put('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const { name } = req.body as { name?: string };

        if (!name?.trim()) {
            res.status(400).json({ error: 'Tag name is required' });
            return;
        }

        const existing = await prisma.tag.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Tag not found' });
            return;
        }

        const tag = await prisma.tag.update({
            where: { id },
            data: {
                name: name.trim(),
                slug: await resolveTagSlug(name, id),
            },
        });

        res.json(tag);
    } catch (error) {
        console.error('Error updating tag:', error);
        res.status(500).json({ error: 'Failed to update tag' });
    }
});

router.delete('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const usage = await prisma.postTag.count({ where: { tagId: id } });
        if (usage > 0) {
            res.status(400).json({ error: 'Tag is still assigned to posts' });
            return;
        }

        await prisma.tag.delete({ where: { id } });
        res.status(204).end();
    } catch (error) {
        console.error('Error deleting tag:', error);
        res.status(500).json({ error: 'Failed to delete tag' });
    }
});

export default router;
