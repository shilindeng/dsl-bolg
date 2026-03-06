import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import slugify from 'slugify';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/categories — 分类列表 (含文章数)
router.get('/', async (_req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            include: { _count: { select: { posts: true } } },
            orderBy: { name: 'asc' },
        });

        const formatted = categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            _count: { posts: cat._count.posts },
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: '获取分类失败' });
    }
});

// POST /api/categories — 创建分类 (需认证)
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const slug = slugify(name, { lower: true, strict: true });

        const category = await prisma.category.create({
            data: { name, slug },
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: '创建分类失败' });
    }
});

export default router;
