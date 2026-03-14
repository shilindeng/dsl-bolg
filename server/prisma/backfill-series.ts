import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseBool(value: string | undefined, fallback: boolean) {
    if (value == null) return fallback;
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
    return fallback;
}

function parseCsv(value: string | undefined) {
    if (!value) return [];
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

function toOrderKey(dateValue: Date | null, fallback: Date) {
    return (dateValue ?? fallback).getTime();
}

async function ensureSeries(input: {
    slug: string;
    title: string;
    summary?: string | null;
    description?: string | null;
    order?: number;
}) {
    const existing = await prisma.series.findUnique({ where: { slug: input.slug } });
    if (existing) {
        return existing;
    }

    return prisma.series.create({
        data: {
            slug: input.slug,
            title: input.title,
            summary: input.summary ?? null,
            description: input.description ?? null,
            order: input.order ?? 0,
            status: 'active',
        },
    });
}

async function main() {
    const targetSlug = (process.env.TARGET_SERIES_SLUG || 'ai').trim();
    const targetTitle = (process.env.TARGET_SERIES_TITLE || 'AI').trim() || 'AI';
    const dryRun = parseBool(process.env.DRY_RUN, true);
    const includeDrafts = parseBool(process.env.INCLUDE_DRAFTS, false);
    const excludeSlugs = new Set(parseCsv(process.env.EXCLUDE_SLUGS));
    const mode = (process.env.MODE || 'assign-unassigned').trim().toLowerCase();
    const orderBy = (process.env.ORDER_BY || 'publishedAt').trim();
    const orderDir = (process.env.ORDER_DIR || 'asc').trim().toLowerCase() === 'desc' ? 'desc' : 'asc';

    if (!targetSlug) {
        throw new Error('TARGET_SERIES_SLUG is required');
    }

    const existingSeries = await prisma.series.findUnique({ where: { slug: targetSlug } });
    const willCreateSeries = !existingSeries;

    if (willCreateSeries && mode !== 'assign-unassigned') {
        throw new Error(`Series "${targetSlug}" does not exist yet. Create it first or switch MODE=assign-unassigned.`);
    }

    if (willCreateSeries && dryRun) {
        console.log(
            JSON.stringify(
                {
                    targetSeries: { slug: targetSlug, title: targetTitle },
                    mode,
                    dryRun,
                    willCreateSeries,
                },
                null,
                2,
            ),
        );
        console.log('[backfill-series] DRY_RUN=1, would create series and update posts.');
        return;
    }

    const series = existingSeries
        ? existingSeries
        : await ensureSeries({
            slug: targetSlug,
            title: targetTitle,
            summary: process.env.TARGET_SERIES_SUMMARY || null,
            description: process.env.TARGET_SERIES_DESCRIPTION || null,
            order: Number.isFinite(Number(process.env.TARGET_SERIES_ORDER)) ? Number(process.env.TARGET_SERIES_ORDER) : 99,
        });

    const publishedFilter = includeDrafts ? {} : { published: true };

    const candidateSeriesWhere = (() => {
        if (mode === 'assign-unassigned') {
            return { seriesId: null as number | null };
        }

        if (mode === 'fill-missing-order') {
            return { seriesId: series.id, seriesOrder: null as number | null };
        }

        if (mode === 'reindex-series') {
            return { seriesId: series.id };
        }

        throw new Error(`Unsupported MODE=${mode}. Use assign-unassigned | fill-missing-order | reindex-series`);
    })();

    const candidates = await prisma.post.findMany({
        where: {
            ...publishedFilter,
            ...candidateSeriesWhere,
            ...(excludeSlugs.size ? { slug: { notIn: [...excludeSlugs] } } : {}),
        },
        select: {
            id: true,
            slug: true,
            title: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            seriesId: true,
            seriesOrder: true,
        },
    });

    if (candidates.length === 0) {
        console.log(`[backfill-series] No posts matched. slug=${targetSlug}`);
        return;
    }

    const existingMax = await prisma.post.aggregate({
        where: {
            ...publishedFilter,
            seriesId: series.id,
            seriesOrder: { not: null },
            ...(excludeSlugs.size ? { slug: { notIn: [...excludeSlugs] } } : {}),
        },
        _max: { seriesOrder: true },
    });

    const startOrder = mode === 'reindex-series' ? 1 : (existingMax._max.seriesOrder ?? 0) + 1;
    const now = new Date();
    const orderKey = (row: typeof candidates[number]) => {
        if (orderBy === 'updatedAt') return toOrderKey(row.updatedAt, now);
        if (orderBy === 'createdAt') return toOrderKey(row.createdAt, now);
        return toOrderKey(row.publishedAt, row.createdAt ?? now);
    };

    const sorted = [...candidates]
        .filter((row) => row.slug && row.title)
        .sort((a, b) => {
            const diff = orderKey(a) - orderKey(b);
            return orderDir === 'asc' ? diff : -diff;
        });

    const planned = sorted.map((row, index) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        fromSeriesId: row.seriesId,
        fromSeriesOrder: row.seriesOrder,
        toSeriesId: series.id,
        toSeriesOrder: startOrder + index,
    }));

    console.log(
        JSON.stringify(
            {
                targetSeries: { id: series.id, slug: series.slug, title: series.title },
                dryRun,
                plannedCount: planned.length,
                planned: planned.slice(0, 50),
            },
            null,
            2,
        ),
    );

    if (dryRun) {
        console.log('[backfill-series] DRY_RUN=1, no changes applied.');
        return;
    }

    await prisma.$transaction(
        planned.map((plan) =>
            prisma.post.update({
                where: { id: plan.id },
                data: {
                    ...(mode === 'assign-unassigned' ? { seriesId: plan.toSeriesId } : {}),
                    seriesOrder: plan.toSeriesOrder,
                },
            }),
        ),
    );

    console.log(`[backfill-series] Updated ${planned.length} posts into series=${targetSlug}.`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
