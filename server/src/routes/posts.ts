import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import slugify from 'slugify';

const router = Router();

// GET /api/posts — list all posts (with optional tag filter)
router.get('/', async (req: Request, res: Response) => {
    try {
        const { tag, published, search } = req.query;

        const where: any = {};
        if (published === 'true') where.published = true;
        if (published === 'false') where.published = false;
        if (tag) {
            where.tags = { some: { slug: tag as string } };
        }
        if (search) {
            where.OR = [
                { title: { contains: search as string } },
                { content: { contains: search as string } },
            ];
        }

        const posts = await prisma.post.findMany({
            where,
            include: { tags: true },
            orderBy: { createdAt: 'desc' },
        });

        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// GET /api/posts/:slug — single post by slug
router.get('/:slug', async (req: Request, res: Response) => {
    try {
        const post = await prisma.post.findUnique({
            where: { slug: String(req.params.slug) },
            include: { tags: true },
        });

        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }

        res.json(post);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// POST /api/posts — create a new post
router.post('/', async (req: Request, res: Response) => {
    try {
        const { title, content, excerpt, coverImage, published, tags } = req.body;

        const slug = slugify(title, { lower: true, strict: true });

        const tagConnections = tags
            ? await Promise.all(
                (tags as string[]).map(async (tagName: string) => {
                    const tagSlug = slugify(tagName, { lower: true, strict: true });
                    return prisma.tag.upsert({
                        where: { slug: tagSlug },
                        update: {},
                        create: { name: tagName, slug: tagSlug },
                    });
                })
            )
            : [];

        const post = await prisma.post.create({
            data: {
                title,
                slug,
                content,
                excerpt: excerpt || '',
                coverImage: coverImage || null,
                published: published || false,
                tags: { connect: tagConnections.map((t) => ({ id: t.id })) },
            },
            include: { tags: true },
        });

        res.status(201).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// PUT /api/posts/:id — update a post
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id));
        const { title, content, excerpt, coverImage, published, tags } = req.body;

        const data: any = {};
        if (title !== undefined) {
            data.title = title;
            data.slug = slugify(title, { lower: true, strict: true });
        }
        if (content !== undefined) data.content = content;
        if (excerpt !== undefined) data.excerpt = excerpt;
        if (coverImage !== undefined) data.coverImage = coverImage;
        if (published !== undefined) data.published = published;

        if (tags) {
            const tagConnections = await Promise.all(
                (tags as string[]).map(async (tagName: string) => {
                    const tagSlug = slugify(tagName, { lower: true, strict: true });
                    return prisma.tag.upsert({
                        where: { slug: tagSlug },
                        update: {},
                        create: { name: tagName, slug: tagSlug },
                    });
                })
            );
            data.tags = { set: tagConnections.map((t) => ({ id: t.id })) };
        }

        const post = await prisma.post.update({
            where: { id },
            data,
            include: { tags: true },
        });

        res.json(post);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// DELETE /api/posts/:id — delete a post
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id));
        await prisma.post.delete({ where: { id } });
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

export default router;
