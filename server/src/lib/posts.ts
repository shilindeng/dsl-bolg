import slugify from 'slugify';
import prisma from './prisma.js';
import { estimateReadTime, normalizeExcerpt } from './content.js';
import { analyticsEventTypes, recordAnalyticsEvent } from './analytics.js';

export const includePostRelations = {
    tags: { include: { tag: true } },
    category: true,
    meta: true,
    series: true,
} as const;

export const formatPost = <T extends { title: string; excerpt: string; content: string; tags: Array<{ tag: unknown }> }>(post: T) => ({
    ...post,
    excerpt: normalizeExcerpt(post.excerpt, post.content, post.title),
    tags: post.tags.map((item) => item.tag),
});

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

export interface PostPayload {
    title: string;
    slug?: string;
    content: string;
    excerpt?: string;
    coverImage?: string | null;
    published?: boolean;
    featured?: boolean;
    tags?: string[];
    categoryId?: number | string | null;
    sourceUrl?: string | null;
}

export async function createPostRecord(payload: PostPayload, source = 'admin') {
    const postSlug = await resolveUniquePostSlug(payload.slug || payload.title);
    const cleanExcerpt = normalizeExcerpt(payload.excerpt, payload.content, payload.title);
    const readTime = estimateReadTime(payload.content);
    const tagPairs = Array.isArray(payload.tags) ? await upsertTags(payload.tags) : [];
    const categoryId = await resolveCategoryId(payload.categoryId);

    const post = await prisma.post.create({
        data: {
            title: payload.title,
            slug: postSlug,
            content: payload.content,
            excerpt: cleanExcerpt,
            coverImage: payload.coverImage || null,
            sourceUrl: payload.sourceUrl || null,
            published: Boolean(payload.published),
            featured: Boolean(payload.featured),
            publishedAt: payload.published ? new Date() : null,
            categoryId: categoryId ?? null,
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
    const nextTitle = payload.title ?? existing.title;
    const readTime = estimateReadTime(nextContent);
    const updates: Record<string, unknown> = {};

    if (payload.title !== undefined) updates.title = payload.title;
    if (payload.coverImage !== undefined) updates.coverImage = payload.coverImage || null;
    if (payload.featured !== undefined) updates.featured = Boolean(payload.featured);
    if (payload.content !== undefined) updates.content = payload.content;
    if (payload.sourceUrl !== undefined) updates.sourceUrl = payload.sourceUrl || null;
    if (payload.categoryId !== undefined) updates.categoryId = await resolveCategoryId(payload.categoryId);
    if (payload.excerpt !== undefined || payload.content !== undefined || payload.title !== undefined) {
        updates.excerpt = normalizeExcerpt(payload.excerpt ?? existing.excerpt, nextContent, nextTitle);
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
