import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/projects — 项目列表
router.get('/', async (_req: Request, res: Response) => {
    try {
        const { data: projects, error } = await supabaseAdmin
            .from('Project')
            .select('*')
            .order('featured', { ascending: false })
            .order('createdAt', { ascending: false });

        if (error) throw error;

        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: '获取项目失败' });
    }
});

// POST /api/projects — 创建项目 (需认证)
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { name, description, techStack, liveUrl, repoUrl, coverImage, featured } = req.body;

        const { data, error } = await supabaseAdmin
            .from('Project')
            .insert([{
                name,
                description,
                techStack: techStack || '',
                liveUrl: liveUrl || null,
                repoUrl: repoUrl || null,
                coverImage: coverImage || null,
                featured: featured || false,
                // createdAt will be default now()
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: '创建项目失败' });
    }
});

// PUT /api/projects/:id — 更新项目 (需认证)
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id));
        const { name, description, techStack, liveUrl, repoUrl, coverImage, featured } = req.body;

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (techStack !== undefined) updates.techStack = techStack;
        if (liveUrl !== undefined) updates.liveUrl = liveUrl;
        if (repoUrl !== undefined) updates.repoUrl = repoUrl;
        if (coverImage !== undefined) updates.coverImage = coverImage;
        if (featured !== undefined) updates.featured = featured;

        const { data, error } = await supabaseAdmin
            .from('Project')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: '更新项目失败' });
    }
});

// DELETE /api/projects/:id — 删除项目 (需认证)
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id));
        const { error } = await supabaseAdmin
            .from('Project')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: '项目已删除' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: '删除项目失败' });
    }
});

export default router;
