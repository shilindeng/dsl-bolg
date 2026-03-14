import { Prisma } from '@prisma/client';
import slugify from 'slugify';
import prisma from './prisma.js';
import { normalizeContentFormat, type ContentFormat } from './content.js';
import { assessPostQuality } from './contentQuality.js';
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
        contentFormat?: string | null;
        deck?: string | null;
        tags: Array<{ tag: unknown }>;
        coverImage?: string | null;
    },
>(
    post: T,
) => formatPublicPost(post);

export interface PostQualitySummary {
    contentFormat: ContentFormat;
    warnings: string[];
    excerpt: string;
    readTime: number;
}

export class PostQualityError extends Error {
    constructor(
        public readonly errors: string[],
        public readonly warnings: string[],
    ) {
        super('POST_QUALITY_INVALID');
    }
}

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
    contentFormat?: ContentFormat | string;
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

interface PreparedPostPayload {
    title: string;
    deck: string | null;
    content: string;
    contentFormat: ContentFormat;
    excerpt: string;
    coverImage: string | null;
    coverAlt: string | null;
    sourceUrl: string | null;
    published: boolean;
    featured: boolean;
    quality: PostQualitySummary;
}

function preparePostPayload(payload: PostPayload, existing?: {
    title: string;
    deck: string | null;
    content: string;
    contentFormat: string;
    excerpt: string;
    coverImage: string | null;
    coverAlt: string | null;
    sourceUrl: string | null;
    published: boolean;
    featured: boolean;
    categoryId: number | null;
    tags?: string[];
}) : PreparedPostPayload {
    const title = (payload.title ?? existing?.title ?? '').trim();
    const content = payload.content ?? existing?.content ?? '';
    const contentFormat = normalizeContentFormat(payload.contentFormat ?? existing?.contentFormat);
    const deck = payload.deck !== undefined ? payload.deck.trim() : existing?.deck || '';
    const published = payload.published ?? existing?.published ?? false;
    const featured = payload.featured ?? existing?.featured ?? false;
    const coverImage = payload.coverImage === undefined ? existing?.coverImage || null : payload.coverImage || null;
    const coverAlt = payload.coverAlt === undefined ? existing?.coverAlt || null : payload.coverAlt?.trim() || null;
    const sourceUrl = payload.sourceUrl === undefined ? existing?.sourceUrl || null : payload.sourceUrl || null;
    const tags = Array.isArray(payload.tags) ? payload.tags : existing?.tags || [];
    const categoryId = payload.categoryId ?? existing?.categoryId ?? null;

    const quality = assessPostQuality({
        title,
        deck,
        excerpt: payload.excerpt ?? existing?.excerpt ?? '',
        content,
        contentFormat,
        published,
        tags,
        categoryId,
        coverImage,
        sourceUrl,
    });

    if (quality.errors.length) {
        throw new PostQualityError(quality.errors, quality.warnings);
    }

    return {
        title,
        deck: deck || null,
        content: quality.sanitizedContent,
        contentFormat: quality.contentFormat,
        excerpt: quality.excerpt,
        coverImage,
        coverAlt,
        sourceUrl,
        published,
        featured,
        quality: {
            contentFormat: quality.contentFormat,
            warnings: quality.warnings,
            excerpt: quality.excerpt,
            readTime: quality.readTime,
        },
    };
}

export async function createPostRecord(payload: PostPayload, source = 'admin') {
    const prepared = preparePostPayload(payload);
    const postSlug = await resolveUniquePostSlug(payload.slug || prepared.title);
    const tagPairs = Array.isArray(payload.tags) ? await upsertTags(payload.tags) : [];
    const categoryId = await resolveCategoryId(payload.categoryId);
    const seriesId = (await resolveSeriesId(payload.seriesId)) ?? null;

    if (payload.seriesId !== undefined && payload.seriesId !== null && payload.seriesId !== '' && seriesId === null) {
        throw new Error('SERIES_NOT_FOUND');
    }

    const seriesOrder = seriesId === null ? null : await resolveSeriesOrder(seriesId, payload.seriesOrder);

    const post = await prisma.post.create({
        data: {
            title: prepared.title,
            slug: postSlug,
            deck: prepared.deck,
            content: prepared.content,
            contentFormat: prepared.contentFormat,
            excerpt: prepared.excerpt,
            coverImage: prepared.coverImage,
            coverAlt: prepared.coverAlt,
            sourceUrl: prepared.sourceUrl,
            published: prepared.published,
            featured: prepared.featured,
            publishedAt: prepared.published ? new Date() : null,
            categoryId: categoryId ?? null,
            seriesId,
            seriesOrder,
            meta: { create: { readTime: prepared.quality.readTime } },
            tags: tagPairs.length ? { create: tagPairs } : undefined,
        },
        include: includePostRelations,
    });

    await recordAnalyticsEvent({ type: analyticsEventTypes.postCreate, postId: post.id, source });
    return { post, quality: prepared.quality };
}

export async function updatePostRecord(id: number, payload: Partial<PostPayload>, source = 'admin') {
    const existing = await prisma.post.findUnique({
        where: { id },
        include: {
            tags: { include: { tag: true } },
        },
    });
    if (!existing) {
        throw new Error('POST_NOT_FOUND');
    }

    const prepared = preparePostPayload(
        {
            title: payload.title ?? existing.title,
            deck: payload.deck ?? existing.deck ?? undefined,
            content: payload.content ?? existing.content,
            contentFormat: payload.contentFormat ?? existing.contentFormat,
            excerpt: payload.excerpt ?? existing.excerpt,
            coverImage: payload.coverImage === undefined ? existing.coverImage : payload.coverImage,
            coverAlt: payload.coverAlt === undefined ? existing.coverAlt : payload.coverAlt,
            sourceUrl: payload.sourceUrl === undefined ? existing.sourceUrl : payload.sourceUrl,
            published: payload.published ?? existing.published,
            featured: payload.featured ?? existing.featured,
            tags: payload.tags,
            categoryId: payload.categoryId === undefined ? existing.categoryId : payload.categoryId,
        },
        {
            ...existing,
            tags: existing.tags.map((item) => item.tag.name),
        },
    );

    const updates: Record<string, unknown> = {
        title: prepared.title,
        deck: prepared.deck,
        content: prepared.content,
        contentFormat: prepared.contentFormat,
        excerpt: prepared.excerpt,
        coverImage: prepared.coverImage,
        coverAlt: prepared.coverAlt,
        sourceUrl: prepared.sourceUrl,
        featured: prepared.featured,
    };

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
        updates.seriesOrder = nextSeriesOrder;
    }

    if (payload.published !== undefined) {
        updates.published = prepared.published;
        if (prepared.published && !existing.publishedAt) {
            updates.publishedAt = new Date();
        }
    }

    if (payload.title !== undefined || payload.slug !== undefined) {
        updates.slug = await resolveUniquePostSlug(payload.slug || prepared.title || existing.title, id);
    }

    if (payload.categoryId !== undefined) {
        updates.categoryId = await resolveCategoryId(payload.categoryId);
    }

    await prisma.post.update({ where: { id }, data: updates });
    await prisma.postMeta.upsert({
        where: { postId: id },
        update: { readTime: prepared.quality.readTime },
        create: { postId: id, readTime: prepared.quality.readTime },
    });

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
    return { post, quality: prepared.quality };
}

export async function upsertExternalPost(input: {
    provider: string;
    externalId: string;
    payload: PostPayload | Partial<PostPayload>;
    source?: string;
}) {
    const existingLink = await prisma.externalPostLink.findUnique({
        where: { provider_externalId: { provider: input.provider, externalId: input.externalId } },
    });

    const payloadHash = JSON.stringify(input.payload);
    const source = input.source || 'open_api';
    const result = existingLink
        ? await updatePostRecord(existingLink.postId, input.payload, source)
        : await createPostRecord(input.payload as PostPayload, source);

    if (existingLink) {
        await prisma.externalPostLink.update({
            where: { id: existingLink.id },
            data: { lastPayloadHash: payloadHash, sourceUrl: input.payload.sourceUrl || null },
        });
    } else {
        await prisma.externalPostLink.create({
            data: {
                provider: input.provider,
                externalId: input.externalId,
                sourceUrl: input.payload.sourceUrl || null,
                lastPayloadHash: payloadHash,
                postId: result.post.id,
            },
        });
    }

    await recordAnalyticsEvent({
        type: analyticsEventTypes.apiPublish,
        postId: result.post.id,
        source,
        metadata: { provider: input.provider, externalId: input.externalId },
    });

    return result;
}
