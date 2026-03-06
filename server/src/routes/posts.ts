import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import slugify from 'slugify';
import { authMiddleware } from '../middleware/auth.js';

interface AuthenticatedRequest extends Request {
    user?: any;
}

const router = Router();

// GET /api/posts — 分页列表
router.get('/', async (req: Request, res: Response) => {
    try {
        const { tag, published, search, category, page = '1', limit = '10' } = req.query;

        const pageNum = Math.max(1, parseInt(page as string));
        const pageSize = Math.min(50, Math.max(1, parseInt(limit as string)));
        const skip = (pageNum - 1) * pageSize;

        // Build where clause
        const where: any = {};

        if (published === 'true') where.published = true;
        if (published === 'false') where.published = false;

        if (search) {
            where.OR = [
                { title: { contains: search as string } },
                { content: { contains: search as string } }
            ];
        }

        if (category) {
            const cat = await prisma.category.findUnique({ where: { slug: category as string } });
            if (cat) {
                where.categoryId = cat.id;
            } else {
                return res.json({ data: [], pagination: { page: pageNum, limit: pageSize, total: 0, totalPages: 0 } });
            }
        }

        if (tag) {
            const t = await prisma.tag.findUnique({ where: { slug: tag as string } });
            if (t) {
                where.tags = { some: { tagId: t.id } };
            } else {
                return res.json({ data: [], pagination: { page: pageNum, limit: pageSize, total: 0, totalPages: 0 } });
            }
        }

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                include: {
                    tags: { include: { tag: true } },
                    category: true,
                    meta: true,
                    series: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            prisma.post.count({ where }),
        ]);

        // Transform tags from PostTag[] to Tag[]
        const postsFormatted = posts.map(p => ({
            ...p,
            tags: p.tags.map(pt => pt.tag),
        }));

        res.json({
            data: postsFormatted,
            pagination: {
                page: pageNum,
                limit: pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: '获取文章失败' });
    }
});

// GET /api/posts/:slug — 单篇文章
router.get('/:slug', async (req: Request, res: Response) => {
    try {
        const post = await prisma.post.findUnique({
            where: { slug: req.params.slug },
            include: {
                tags: { include: { tag: true } },
                category: true,
                meta: true,
                series: true,
            },
        });

        if (!post) {
            return res.status(404).json({ error: '文章未找到' });
        }

        // Fetch comments with replies
        const comments = await prisma.comment.findMany({
            where: { postId: post.id, approved: true, parentId: null },
            include: {
                replies: {
                    where: { approved: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Increment views
        await prisma.postMeta.upsert({
            where: { postId: post.id },
            update: { views: { increment: 1 } },
            create: { postId: post.id, views: 1, readTime: Math.ceil(post.content.length / 500) },
        });

        // Format response
        const formatted = {
            ...post,
            tags: post.tags.map(pt => pt.tag),
            comments,
        };

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '获取文章失败' });
    }
});

// POST /api/posts/:slug/like
router.post('/:slug/like', async (req: Request, res: Response) => {
    try {
        const post = await prisma.post.findUnique({ where: { slug: req.params.slug } });
        if (!post) return res.status(404).json({ error: '文章未找到' });

        const meta = await prisma.postMeta.upsert({
            where: { postId: post.id },
            update: { likes: { increment: 1 } },
            create: { postId: post.id, likes: 1 },
        });

        res.json({ likes: meta.likes });
    } catch (error) {
        res.status(500).json({ error: '点赞失败' });
    }
});

// POST /api/posts
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    try {
        const { title, content, excerpt, coverImage, published, tags, categoryId } = req.body;
        const slug = slugify(title, { lower: true, strict: true }) + '-' + Math.random().toString(36).substring(2, 8);

        // Create post with tags
        const post = await prisma.post.create({
            data: {
                title,
                slug,
                content,
                excerpt: excerpt || '',
                coverImage: coverImage || null,
                published: published || false,
                categoryId: categoryId || null,
                meta: {
                    create: { readTime: Math.ceil(content.length / 500) }
                },
                tags: tags && Array.isArray(tags) ? {
                    create: await Promise.all(
                        tags.map(async (tagName: string) => {
                            const tSlug = slugify(tagName, { lower: true, strict: true });
                            const tag = await prisma.tag.upsert({
                                where: { slug: tSlug },
                                update: {},
                                create: { name: tagName, slug: tSlug },
                            });
                            return { tagId: tag.id };
                        })
                    )
                } : undefined,
            },
            include: {
                tags: { include: { tag: true } },
                category: true,
                meta: true,
            },
        });

        res.status(201).json({
            ...post,
            tags: post.tags.map(pt => pt.tag),
        });
    } catch (error) {
        console.error('[Create Post] FAILED:', error);
        res.status(500).json({ error: '创建文章失败', details: String(error) });
    }
});

// PUT /api/posts/:id
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    try {
        const id = parseInt(req.params.id as string);
        const { title, content, excerpt, coverImage, published, tags, categoryId } = req.body;

        const updates: any = {};
        if (title !== undefined) {
            updates.title = title;
            updates.slug = slugify(title, { lower: true, strict: true });
        }
        if (content !== undefined) updates.content = content;
        if (excerpt !== undefined) updates.excerpt = excerpt;
        if (coverImage !== undefined) updates.coverImage = coverImage;
        if (published !== undefined) updates.published = published;
        if (categoryId !== undefined) updates.categoryId = categoryId;

        // Update Post
        const post = await prisma.post.update({
            where: { id },
            data: updates,
        });

        // Update Meta
        if (content !== undefined) {
            const readTime = Math.ceil(content.length / 500);
            await prisma.postMeta.upsert({
                where: { postId: id },
                update: { readTime },
                create: { postId: id, readTime },
            });
        }

        // Update Tags
        if (tags && Array.isArray(tags)) {
            // Delete old
            await prisma.postTag.deleteMany({ where: { postId: id } });

            // Re-insert
            for (const tagName of tags) {
                const tSlug = slugify(tagName, { lower: true, strict: true });
                const tag = await prisma.tag.upsert({
                    where: { slug: tSlug },
                    update: {},
                    create: { name: tagName, slug: tSlug },
                });
                await prisma.postTag.create({ data: { postId: id, tagId: tag.id } });
            }
        }

        const final = await prisma.post.findUnique({
            where: { id },
            include: {
                tags: { include: { tag: true } },
                category: true,
                meta: true,
            },
        });

        res.json({
            ...final,
            tags: final?.tags.map(pt => pt.tag) || [],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '更新文章失败' });
    }
});

// DELETE /api/posts/:id
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    try {
        const id = parseInt(req.params.id as string);
        await prisma.post.delete({ where: { id } });
        res.json({ message: '文章已删除' });
    } catch (error) {
        res.status(500).json({ error: '删除文章失败' });
    }
});

export default router;
