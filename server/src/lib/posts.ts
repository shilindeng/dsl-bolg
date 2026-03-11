import { Prisma } from '@prisma/client';
import slugify from 'slugify';
import prisma from './prisma.js';
import { createExcerpt, estimateReadTime } from './content.js';
import { analyticsEventTypes, recordAnalyticsEvent } from './analytics.js';
import { formatPublicPost } from './publicPresentation.js';

export const includePostRelations = {
    tags: { include: { tag: true } },
    category: true,
    meta: true,
    series: true,
} satisfies Prisma.PostInclude;

export const formatPost = <
    T extends {
        title: string;
        excerpt: string;
        content: string;
        deck?: string | null;
        tags: Array<{ tag: unknown }>;
        coverImage?: string | null;
    },
>(
    post: T,
) => formatPublicPost(post);

export async function resolveUniquePostSlug(input: string, excludeId?: number) {
    const base = slugify(input, { lower: true, strict: true }) || `post-${Date.now()}`;
    let candidate = base;
    let counter = 1;

    while (true) {
        const existing = await prisma.post.findUnique({ where: { slug: candidate } });
        if (!existing || existing.id === excludeId) {
            return candidate;
        }
        candidate = `${base}-${counter}`;
        counter += 1;
    }
}

export async function upsertTags(tags: string[]) {
    const pairs: Array<{ tagId: number }> = [];
    for (const rawName of tags) {
        const name = rawName.trim();
        if (!name) continue;
        const tagSlug = slugify(name, { lower: true, strict: true }) || `tag-${Date.now()}-${pairs.length}`;
        const tagRecord = await prisma.tag.upsert({
            where: { slug: tagSlug },
            update: { name },
            create: { name, slug: tagSlug },
        });
        pairs.push({ tagId: tagRecord.id });
    }
    return pairs;
}

export async function resolveCategoryId(categoryInput?: number | string | null) {
    if (categoryInput === undefined) return undefined;
    if (categoryInput === null || categoryInput === '') return null;
    if (typeof categoryInput === 'number') return categoryInput;

    const asNumber = Number(categoryInput);
    if (!Number.isNaN(asNumber) && String(asNumber) === String(categoryInput)) {
        return asNumber;
    }

    const category = await prisma.category.findFirst({
        where: { OR: [{ slug: String(categoryInput) }, { name: String(categoryInput) }] },
    });

    return category?.id ?? null;
}

function normalizeNullableInt(input: unknown) {
    if (input === undefined) return undefined;
    if (input === null || input === '') return null;

    const asNumber = typeof input === 'number' ? input : Number(input);
    if (Number.isNaN(asNumber)) return null;

    return Math.trunc(asNumber);
}

async function resolveSeriesId(seriesInput?: number | string | null) {
    if (seriesInput === undefined) return undefined;
    if (seriesInput === null || seriesInput === '') return null;

    if (typeof seriesInput === 'number') {
        const series = await prisma.series.findUnique({ where: { id: seriesInput } });
        return series ? series.id : null;
    }

    const raw = String(seriesInput);
    const asNumber = Number(raw);
    if (!Number.isNaN(asNumber) && String(asNumber) === raw) {
        const series = await prisma.series.findUnique({ where: { id: asNumber } });
        return series ? series.id : null;
    }

    const series = await prisma.series.findUnique({ where: { slug: raw } });
    return series ? series.id : null;
}

async function resolveSeriesOrder(seriesId: number, seriesOrderInput: unknown) {
    const parsed = normalizeNullableInt(seriesOrderInput);

    if (parsed === undefined || parsed === null) {
        const maxOrder = await prisma.post.aggregate({
            where: { seriesId },
            _max: { seriesOrder: true },
        });

        return (maxOrder._max.seriesOrder ?? 0) + 1;
    }

    return Math.max(1, parsed);
}

export interface PostPayload {
    title: string;
    slug?: string;
    deck?: string;
    content: string;
    excerpt?: string;
    coverImage?: string | null;
    coverAlt?: string | null;
    published?: boolean;
    featured?: boolean;
    tags?: string[];
    categoryId?: number | string | null;
    sourceUrl?: string | null;
    seriesId?: number | string | null;
    seriesOrder?: number | string | null;
}

export async function createPostRecord(payload: PostPayload, source = 'admin') {
    const postSlug = await resolveUniquePostSlug(payload.slug || payload.title);
    const cleanExcerpt = payload.excerpt?.trim() || createExcerpt(payload.content);
    const readTime = estimateReadTime(payload.content);
    const tagPairs = Array.isArray(payload.tags) ? await upsertTags(payload.tags) : [];
    const categoryId = await resolveCategoryId(payload.categoryId);
    const seriesId = (await resolveSeriesId(payload.seriesId)) ?? null;

    if (payload.seriesId !== undefined && payload.seriesId !== null && payload.seriesId !== '' && seriesId === null) {
        throw new Error('SERIES_NOT_FOUND');
    }

    const seriesOrder = seriesId === null ? null : await resolveSeriesOrder(seriesId, payload.seriesOrder);

    const post = await prisma.post.create({
        data: {
            title: payload.title,
            slug: postSlug,
            deck: payload.deck?.trim() || null,
            content: payload.content,
            excerpt: cleanExcerpt,
            coverImage: payload.coverImage || null,
            coverAlt: payload.coverAlt?.trim() || null,
            sourceUrl: payload.sourceUrl || null,
            published: Boolean(payload.published),
            featured: Boolean(payload.featured),
            publishedAt: payload.published ? new Date() : null,
            categoryId: categoryId ?? null,
            seriesId,
            seriesOrder,
            meta: { create: { readTime } },
            tags: tagPairs.length ? { create: tagPairs } : undefined,
        },
        include: includePostRelations,
    });

    await recordAnalyticsEvent({ type: analyticsEventTypes.postCreate, postId: post.id, source });
    return post;
}

export async function updatePostRecord(id: number, payload: Partial<PostPayload>, source = 'admin') {
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
        throw new Error('POST_NOT_FOUND');
    }

    const nextContent = payload.content ?? existing.content;
    const readTime = estimateReadTime(nextContent);
    const updates: Record<string, unknown> = {};

    if (payload.title !== undefined) updates.title = payload.title;
    if (payload.deck !== undefined) updates.deck = payload.deck?.trim() || null;
    if (payload.coverImage !== undefined) updates.coverImage = payload.coverImage || null;
    if (payload.coverAlt !== undefined) updates.coverAlt = payload.coverAlt?.trim() || null;
    if (payload.featured !== undefined) updates.featured = Boolean(payload.featured);
    if (payload.content !== undefined) updates.content = payload.content;
    if (payload.sourceUrl !== undefined) updates.sourceUrl = payload.sourceUrl || null;
    if (payload.categoryId !== undefined) updates.categoryId = await resolveCategoryId(payload.categoryId);
    if (payload.excerpt !== undefined) updates.excerpt = payload.excerpt?.trim() || createExcerpt(nextContent);

    const nextSeriesId = payload.seriesId === undefined ? existing.seriesId : (await resolveSeriesId(payload.seriesId)) ?? null;
    const seriesIdChanged = payload.seriesId !== undefined && nextSeriesId !== existing.seriesId;

    if (payload.seriesId !== undefined && payload.seriesId !== null && payload.seriesId !== '' && nextSeriesId === null) {
        throw new Error('SERIES_NOT_FOUND');
    }

    const nextSeriesOrderBase =
        payload.seriesOrder !== undefined
            ? normalizeNullableInt(payload.seriesOrder)
            : seriesIdChanged
                ? null
                : existing.seriesOrder;

    const nextSeriesOrder =
        nextSeriesId === null
            ? null
            : await resolveSeriesOrder(nextSeriesId, nextSeriesOrderBase);

    if (payload.seriesId !== undefined || payload.seriesOrder !== undefined) {
        updates.seriesId = nextSeriesId;
        updates.seriesOrder = nextSeriesOrder;
    } else if (existing.seriesId !== null && existing.seriesOrder === null && nextSeriesId !== null) {
        // Backfill order for legacy posts that were assigned to a series without an explicit order.
        updates.seriesOrder = nextSeriesOrder;
    }

    if (payload.published !== undefined) {
        updates.published = Boolean(payload.published);
        if (payload.published && !existing.publishedAt) {
            updates.publishedAt = new Date();
        }
    }

    if (payload.title !== undefined || payload.slug !== undefined) {
        updates.slug = await resolveUniquePostSlug(payload.slug || payload.title || existing.title, id);
    }

    await prisma.post.update({ where: { id }, data: updates });
    await prisma.postMeta.upsert({ where: { postId: id }, update: { readTime }, create: { postId: id, readTime } });

    if (Array.isArray(payload.tags)) {
        await prisma.postTag.deleteMany({ where: { postId: id } });
        const tagPairs = await upsertTags(payload.tags);
        if (tagPairs.length) {
            await prisma.postTag.createMany({ data: tagPairs.map((pair) => ({ postId: id, tagId: pair.tagId })) });
        }
    }

    const post = await prisma.post.findUnique({ where: { id }, include: includePostRelations });
    if (!post) {
        throw new Error('POST_NOT_FOUND');
    }
    await recordAnalyticsEvent({ type: analyticsEventTypes.postUpdate, postId: id, source });
    return post;
}

export async function upsertExternalPost(input: {
    provider: string;
    externalId: string;
    payload: PostPayload;
    source?: string;
}) {
    const existingLink = await prisma.externalPostLink.findUnique({
        where: { provider_externalId: { provider: input.provider, externalId: input.externalId } },
    });

    const payloadHash = JSON.stringify(input.payload);
    const source = input.source || 'open_api';
    let post;

    if (existingLink) {
        post = await updatePostRecord(existingLink.postId, input.payload, source);
        await prisma.externalPostLink.update({
            where: { id: existingLink.id },
            data: { lastPayloadHash: payloadHash, sourceUrl: input.payload.sourceUrl || null },
        });
    } else {
        post = await createPostRecord(input.payload, source);
        await prisma.externalPostLink.create({
            data: {
                provider: input.provider,
                externalId: input.externalId,
                sourceUrl: input.payload.sourceUrl || null,
                lastPayloadHash: payloadHash,
                postId: post.id,
            },
        });
    }

    await recordAnalyticsEvent({
        type: analyticsEventTypes.apiPublish,
        postId: post.id,
        source,
        metadata: { provider: input.provider, externalId: input.externalId },
    });

    return post;
}
