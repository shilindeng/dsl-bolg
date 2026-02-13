import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import slugify from 'slugify';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/categories — 分类列表 (含文章数)
router.get('/', async (_req: Request, res: Response) => {
    try {
        const { data: categories, error } = await supabase
            .from('Category')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        // Mocking _count for compatibility
        const categoriesWithCount = categories.map(cat => ({
            ...cat,
            _count: { posts: 0 }
        }));

        res.json(categoriesWithCount);
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

        const { data, error } = await supabase
            .from('Category')
            .insert([{ name, slug }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: '创建分类失败' });
    }
});

export default router;
