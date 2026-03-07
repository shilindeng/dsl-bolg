import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware, getOptionalUser, requireAdmin } from '../middleware/auth.js';
import { estimateReadTime, extractHeadings } from '../lib/content.js';
import { analyticsEventTypes, recordAnalyticsEvent } from '../lib/analytics.js';
import { createPostRecord, formatPost, includePostRelations, updatePostRecord } from '../lib/posts.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;
        const published = typeof req.query.published === 'string' ? req.query.published : undefined;
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;
        const category = typeof req.query.category === 'string' ? req.query.category : undefined;
        const page = typeof req.query.page === 'string' ? req.query.page : '1';
        const limit = typeof req.query.limit === 'string' ? req.query.limit : '10';
        const currentUser = getOptionalUser(req);
        const isAdmin = currentUser?.role === 'admin';
        const pageNum = Math.max(1, parseInt(page, 10));
        const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * pageSize;
        const where: Record<string, unknown> = {};

        if (isAdmin) {
            if (published === 'true') where.published = true;
            if (published === 'false') where.published = false;
        } else {
            where.published = true;
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { excerpt: { contains: search } },
                { content: { contains: search } },
            ];
        }

        if (category) {
            const categoryRecord = await prisma.category.findUnique({ where: { slug: category } });

            if (!categoryRecord) {
                res.json({
                    data: [],
                    pagination: { page: pageNum, limit: pageSize, total: 0, totalPages: 0 },
                });
                return;
            }

            where.categoryId = categoryRecord.id;
        }

        if (tag) {
            const tagRecord = await prisma.tag.findUnique({ where: { slug: tag } });

            if (!tagRecord) {
                res.json({
                    data: [],
                    pagination: { page: pageNum, limit: pageSize, total: 0, totalPages: 0 },
                });
                return;
            }

            where.tags = { some: { tagId: tagRecord.id } };
        }

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                include: includePostRelations,
                orderBy: [
                    { featured: 'desc' },
                    { publishedAt: 'desc' },
                    { createdAt: 'desc' },
                ],
                skip,
                take: pageSize,
            }),
            prisma.post.count({ where }),
        ]);

        res.json({
            data: posts.map((post: Parameters<typeof formatPost>[0]) => formatPost(post)),
            pagination: {
                page: pageNum,
                limit: pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

router.get('/:slug', async (req: Request, res: Response) => {
    try {
        const currentUser = getOptionalUser(req);
        const isAdmin = currentUser?.role === 'admin';
        const post = await prisma.post.findUnique({
            where: { slug: String(req.params.slug) },
            include: includePostRelations,
        });

        if (!post || (!post.published && !isAdmin)) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }

        const readTime = estimateReadTime(post.content);
        const meta = await prisma.postMeta.upsert({
            where: { postId: post.id },
            update: {
                readTime,
                ...(post.published ? { views: { increment: 1 } } : {}),
            },
            create: {
                postId: post.id,
                readTime,
                views: post.published ? 1 : 0,
            },
        });

        if (post.published) {
            await recordAnalyticsEvent({ type: analyticsEventTypes.view, postId: post.id });
        }

        const comments = await prisma.comment.findMany({
            where: { postId: post.id, status: 'approved', parentId: null },
            include: {
                replies: {
                    where: { status: 'approved' },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const tagIds = post.tags.map((item: { tagId: number }) => item.tagId);
        const relatedFilters = [
            ...(post.categoryId ? [{ categoryId: post.categoryId }] : []),
            ...(tagIds.length ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
        ];
        const related = await prisma.post.findMany({
            where: {
                id: { not: post.id },
                published: true,
                ...(relatedFilters.length ? { OR: relatedFilters } : {}),
            },
            include: includePostRelations,
            orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
            take: 3,
        });

        const publishedPosts = await prisma.post.findMany({
            where: { published: true },
            select: { slug: true, title: true },
            orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        });

        const currentIndex = publishedPosts.findIndex((item: { slug: string }) => item.slug === post.slug);
        const previousPost = currentIndex >= 0 ? publishedPosts[currentIndex + 1] || null : null;
        const nextPost = currentIndex > 0 ? publishedPosts[currentIndex - 1] || null : null;

        res.json({
            ...formatPost(post),
            meta,
            comments,
            toc: extractHeadings(post.content),
            relatedPosts: related.map((item: Parameters<typeof formatPost>[0]) => formatPost(item)),
            previousPost,
            nextPost,
        });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

router.post('/:slug/like', async (req: Request, res: Response) => {
    try {
        const targetSlug = String(req.params.slug);
        const post = await prisma.post.findUnique({ where: { slug: targetSlug } });

        if (!post || !post.published) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }

        const meta = await prisma.postMeta.upsert({
            where: { postId: post.id },
            update: { likes: { increment: 1 } },
            create: { postId: post.id, likes: 1, readTime: estimateReadTime(post.content) },
        });

        await recordAnalyticsEvent({ type: analyticsEventTypes.like, postId: post.id });

        res.json({ likes: meta.likes });
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ error: 'Failed to like post' });
    }
});

router.post('/', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { title, slug, content, excerpt, coverImage, published, featured, tags, categoryId } = req.body as {
            title: string;
            slug?: string;
            content: string;
            excerpt?: string;
            coverImage?: string | null;
            published?: boolean;
            featured?: boolean;
            tags?: string[];
            categoryId?: number | null;
        };
        const post = await createPostRecord({ title, slug, content, excerpt, coverImage, published, featured, tags, categoryId }, 'admin');

        res.status(201).json(formatPost(post));
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

router.put('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const { title, slug, content, excerpt, coverImage, published, featured, tags, categoryId } = req.body as {
            title?: string;
            slug?: string;
            content?: string;
            excerpt?: string;
            coverImage?: string | null;
            published?: boolean;
            featured?: boolean;
            tags?: string[];
            categoryId?: number | null;
        };
        const post = await updatePostRecord(id, { title, slug, content, excerpt, coverImage, published, featured, tags, categoryId }, 'admin');
        res.json(formatPost(post!));
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(error instanceof Error && error.message === 'POST_NOT_FOUND' ? 404 : 500).json({ error: error instanceof Error && error.message === 'POST_NOT_FOUND' ? 'Post not found' : 'Failed to update post' });
    }
});

router.delete('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        await prisma.post.delete({ where: { id } });
        res.json({ message: 'Post deleted' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

export default router;
