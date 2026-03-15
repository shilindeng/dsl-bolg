import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { createStableSlug } from '../lib/slugs.js';
import { formatZodError, isZodError, parseBody, tagCreateSchema, tagMergeSchema, tagUpdateSchema } from '../lib/schemas.js';

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
        const { name } = parseBody(tagCreateSchema, req.body);
        const trimmedName = name.trim();

        if (!trimmedName) {
            res.status(400).json({ error: 'Tag name is required' });
            return;
        }

        const tag = await prisma.tag.create({
            data: { name: trimmedName, slug: await resolveTagSlug(trimmedName) },
        });

        res.status(201).json(tag);
    } catch (error) {
        console.error('Error creating tag:', error);
        if (isZodError(error)) {
            res.status(400).json(formatZodError(error));
            return;
        }
        res.status(500).json({ error: 'Failed to create tag' });
    }
});

router.put('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const existing = await prisma.tag.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Tag not found' });
            return;
        }

        const payload = parseBody(tagUpdateSchema, req.body);
        const nextName = payload.name !== undefined ? payload.name.trim() : existing.name;

        if (payload.name !== undefined && !nextName) {
            res.status(400).json({ error: 'Tag name is required' });
            return;
        }

        const providedSlug = payload.slug !== undefined ? payload.slug.trim() : undefined;
        if (payload.slug !== undefined && !providedSlug) {
            res.status(400).json({ error: 'Tag slug is required' });
            return;
        }

        const nextSlugInput = providedSlug ?? (payload.name !== undefined ? nextName : existing.slug);
        const nextSlug = payload.slug !== undefined || payload.name !== undefined ? await resolveTagSlug(nextSlugInput, id) : existing.slug;
        const tag = await prisma.tag.update({
            where: { id },
            data: {
                name: nextName,
                slug: nextSlug,
            },
        });

        res.json(tag);
    } catch (error) {
        console.error('Error updating tag:', error);
        if (isZodError(error)) {
            res.status(400).json(formatZodError(error));
            return;
        }
        res.status(500).json({ error: 'Failed to update tag' });
    }
});

router.post('/merge', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const payload = parseBody(tagMergeSchema, req.body);
        const sourceTagId = Number(payload.sourceTagId);
        const targetTagId = Number(payload.targetTagId);

        if (sourceTagId === targetTagId) {
            res.status(400).json({ error: 'Source and target tag must be different' });
            return;
        }

        const [source, target] = await Promise.all([
            prisma.tag.findUnique({ where: { id: sourceTagId } }),
            prisma.tag.findUnique({ where: { id: targetTagId } }),
        ]);

        if (!source || !target) {
            res.status(404).json({ error: 'Source or target tag not found' });
            return;
        }

        await prisma.$transaction(async (tx) => {
            const relations = await tx.postTag.findMany({
                where: { tagId: sourceTagId },
                select: { postId: true },
            });

            for (const relation of relations) {
                await tx.postTag.upsert({
                    where: {
                        postId_tagId: {
                            postId: relation.postId,
                            tagId: targetTagId,
                        },
                    },
                    update: {},
                    create: {
                        postId: relation.postId,
                        tagId: targetTagId,
                    },
                });
            }

            await tx.postTag.deleteMany({ where: { tagId: sourceTagId } });
            await tx.tag.delete({ where: { id: sourceTagId } });
        });

        res.json({ sourceTagId, targetTagId, merged: true });
    } catch (error) {
        console.error('Error merging tags:', error);
        if (isZodError(error)) {
            res.status(400).json(formatZodError(error));
            return;
        }
        res.status(500).json({ error: 'Failed to merge tags' });
    }
});

router.delete('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const existing = await prisma.tag.findUnique({ where: { id } });

        if (!existing) {
            res.status(404).json({ error: 'Tag not found' });
            return;
        }

        await prisma.$transaction(async (tx) => {
            await tx.postTag.deleteMany({ where: { tagId: id } });
            await tx.tag.delete({ where: { id } });
        });

        res.status(204).end();
    } catch (error) {
        console.error('Error deleting tag:', error);
        res.status(500).json({ error: 'Failed to delete tag' });
    }
});

export default router;
