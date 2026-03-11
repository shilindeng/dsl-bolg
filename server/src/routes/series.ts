import { Router, Request, Response } from 'express';
import slugify from 'slugify';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { formatPublicSeries, isPublicSeriesReady, resolvePublicAsset } from '../lib/publicPresentation.js';

const router = Router();

type SeriesStatus = 'active' | 'complete' | 'paused';

function normalizeStatus(input?: string | null): SeriesStatus {
    const value = String(input || '').trim().toLowerCase();
    if (value === 'complete' || value === 'paused') return value;
    return 'active';
}

async function resolveSeriesSlug(input: string, excludeId?: number) {
    const base = slugify(input, { lower: true, strict: true }) || `series-${Date.now()}`;
    let candidate = base;
    let counter = 1;

    while (true) {
        const existing = await prisma.series.findUnique({ where: { slug: candidate } });
        if (!existing || existing.id === excludeId) {
            return candidate;
        }

        candidate = `${base}-${counter}`;
        counter += 1;
    }
}

async function getSeriesStats(options: { publishedOnly: boolean }) {
    const where = options.publishedOnly
        ? { published: true, seriesId: { not: null } }
        : { seriesId: { not: null } };

    const rows = await prisma.post.groupBy({
        by: ['seriesId'],
        where,
        _count: { _all: true },
        _max: { updatedAt: true },
    });

    const map = new Map<number, { count: number; lastUpdatedAt: Date | null }>();
    for (const row of rows) {
        if (row.seriesId == null) continue;
        map.set(row.seriesId, {
            count: row._count._all,
            lastUpdatedAt: row._max.updatedAt ?? null,
        });
    }

    return map;
}

router.get('/', async (_req: Request, res: Response) => {
    try {
        const series = await prisma.series.findMany({
            where: { posts: { some: { published: true } } },
            orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
        });

        const stats = await getSeriesStats({ publishedOnly: true });

        res.json(
            series
                .map((row) => ({
                    ...formatPublicSeries(row),
                    stats: {
                        publishedPosts: stats.get(row.id)?.count ?? 0,
                        lastUpdatedAt: stats.get(row.id)?.lastUpdatedAt ?? null,
                    },
                }))
                .filter((row) => isPublicSeriesReady(row) && row.stats.publishedPosts > 0),
        );
    } catch (error) {
        console.error('Error fetching series:', error);
        res.status(500).json({ error: 'Failed to fetch series' });
    }
});

router.get('/admin', authMiddleware, requireAdmin, async (_req: Request, res: Response) => {
    try {
        const series = await prisma.series.findMany({
            orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
        });

        const [publishedStats, totalStats] = await Promise.all([
            getSeriesStats({ publishedOnly: true }),
            getSeriesStats({ publishedOnly: false }),
        ]);

        res.json(
            series.map((row) => ({
                ...formatPublicSeries(row),
                stats: {
                    totalPosts: totalStats.get(row.id)?.count ?? 0,
                    publishedPosts: publishedStats.get(row.id)?.count ?? 0,
                    lastUpdatedAt: totalStats.get(row.id)?.lastUpdatedAt ?? null,
                },
            })),
        );
    } catch (error) {
        console.error('Error fetching series admin list:', error);
        res.status(500).json({ error: 'Failed to fetch series' });
    }
});

router.get('/:slug', async (req: Request, res: Response) => {
    try {
        const series = await prisma.series.findUnique({ where: { slug: String(req.params.slug) } });

        if (!series) {
            res.status(404).json({ error: 'Series not found' });
            return;
        }

        const posts = await prisma.post.findMany({
            where: { published: true, seriesId: series.id },
            select: {
                id: true,
                title: true,
                slug: true,
                deck: true,
                excerpt: true,
                coverImage: true,
                coverAlt: true,
                publishedAt: true,
                createdAt: true,
                updatedAt: true,
                seriesOrder: true,
                meta: true,
                category: true,
                tags: { include: { tag: true } },
            },
        });

        const formattedPosts = posts
            .map((post) => ({
                ...post,
                deck: post.deck?.replace(/\s+/g, ' ').trim() || null,
                excerpt: post.excerpt?.replace(/\s+/g, ' ').trim() || '',
                coverImage: resolvePublicAsset(post.coverImage),
                tags: post.tags.map((item) => item.tag),
            }))
            .sort((a, b) => {
                const ao = a.seriesOrder ?? Number.POSITIVE_INFINITY;
                const bo = b.seriesOrder ?? Number.POSITIVE_INFINITY;
                if (ao !== bo) return ao - bo;
                return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
            });

        res.json({
            ...formatPublicSeries(series),
            posts: formattedPosts,
        });
    } catch (error) {
        console.error('Error fetching series detail:', error);
        res.status(500).json({ error: 'Failed to fetch series' });
    }
});

router.post('/', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { title, slug, summary, description, coverImage, status, order } = req.body as {
            title: string;
            slug?: string;
            summary?: string | null;
            description?: string | null;
            coverImage?: string | null;
            status?: string | null;
            order?: number | string | null;
        };

        if (!title?.trim()) {
            res.status(400).json({ error: 'Title is required' });
            return;
        }

        const parsedOrder = Number(order);

        const record = await prisma.series.create({
            data: {
                title: title.trim(),
                slug: await resolveSeriesSlug((slug || title).trim()),
                summary: summary?.trim() || null,
                description: description?.trim() || null,
                coverImage: coverImage?.trim() || null,
                status: normalizeStatus(status),
                order: Number.isNaN(parsedOrder) ? 0 : Math.trunc(parsedOrder),
            },
        });

        res.status(201).json(formatPublicSeries(record));
    } catch (error) {
        console.error('Error creating series:', error);
        res.status(500).json({ error: 'Failed to create series' });
    }
});

router.put('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const existing = await prisma.series.findUnique({ where: { id } });

        if (!existing) {
            res.status(404).json({ error: 'Series not found' });
            return;
        }

        const { title, slug, summary, description, coverImage, status, order } = req.body as {
            title?: string;
            slug?: string;
            summary?: string | null;
            description?: string | null;
            coverImage?: string | null;
            status?: string | null;
            order?: number | string | null;
        };

        const updates: Record<string, unknown> = {};

        if (title !== undefined) updates.title = title.trim();
        if (summary !== undefined) updates.summary = summary?.trim() || null;
        if (description !== undefined) updates.description = description?.trim() || null;
        if (coverImage !== undefined) updates.coverImage = coverImage?.trim() || null;
        if (status !== undefined) updates.status = normalizeStatus(status);
        if (order !== undefined) {
            const parsedOrder = Number(order);
            updates.order = Number.isNaN(parsedOrder) ? 0 : Math.trunc(parsedOrder);
        }
        if (title !== undefined || slug !== undefined) {
            updates.slug = await resolveSeriesSlug((slug || title || existing.title).trim(), id);
        }

        const record = await prisma.series.update({ where: { id }, data: updates });
        res.json(formatPublicSeries(record));
    } catch (error) {
        console.error('Error updating series:', error);
        res.status(500).json({ error: 'Failed to update series' });
    }
});

router.delete('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);

        await prisma.$transaction(async (tx) => {
            await tx.post.updateMany({
                where: { seriesId: id },
                data: { seriesId: null, seriesOrder: null },
            });

            await tx.series.delete({ where: { id } });
        });

        res.json({ message: 'Series deleted' });
    } catch (error) {
        console.error('Error deleting series:', error);
        res.status(500).json({ error: 'Failed to delete series' });
    }
});

export default router;
