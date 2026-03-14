import { PrismaClient } from '@prisma/client';
import { createExcerpt } from '../src/lib/content.js';

const prisma = new PrismaClient();

function parseBool(value: string | undefined, fallback: boolean) {
    if (value == null) return fallback;
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
    return fallback;
}

function normalizeText(value: string | null | undefined) {
    return value?.replace(/\s+/g, ' ').trim() || '';
}

function buildDeckFallback(content: string, title: string) {
    const excerpt = createExcerpt(content, 120, title);
    return excerpt.length >= 16 ? excerpt : createExcerpt(content, 160, title);
}

async function main() {
    const dryRun = parseBool(process.env.DRY_RUN, true);
    const maxUpdates = Number.isFinite(Number(process.env.MAX_UPDATES)) ? Number(process.env.MAX_UPDATES) : 500;

    const posts = await prisma.post.findMany({
        where: { published: true },
        select: {
            id: true,
            slug: true,
            title: true,
            deck: true,
            excerpt: true,
            coverImage: true,
            coverAlt: true,
            content: true,
        },
        orderBy: [{ updatedAt: 'desc' }],
    });

    const planned: Array<{
        id: number;
        slug: string;
        updates: Record<string, unknown>;
    }> = [];

    for (const post of posts) {
        if (planned.length >= maxUpdates) break;

        const updates: Record<string, unknown> = {};
        const title = normalizeText(post.title);
        const deck = normalizeText(post.deck);
        const excerpt = normalizeText(post.excerpt);
        const coverAlt = normalizeText(post.coverAlt);

        if (post.coverImage && !coverAlt) {
            updates.coverAlt = title || 'Cover';
        }

        if (!excerpt || excerpt.length < 48) {
            updates.excerpt = createExcerpt(post.content, 160, title);
        }

        if (!deck) {
            updates.deck = buildDeckFallback(post.content, title);
        }

        if (Object.keys(updates).length) {
            planned.push({ id: post.id, slug: post.slug, updates });
        }
    }

    console.log(
        JSON.stringify(
            {
                dryRun,
                scanned: posts.length,
                plannedCount: planned.length,
                planned: planned.slice(0, 50),
            },
            null,
            2,
        ),
    );

    if (dryRun) {
        console.log('[normalize-post-metadata] DRY_RUN=1, no changes applied.');
        return;
    }

    for (const plan of planned) {
        await prisma.post.update({
            where: { id: plan.id },
            data: plan.updates,
        });
    }

    console.log(`[normalize-post-metadata] Updated ${planned.length} posts.`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

