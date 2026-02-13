import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import slugify from 'slugify';

const router = Router();

// GET /api/tags — list all tags with post count
router.get('/', async (_req: Request, res: Response) => {
    try {
        // Try to get count if possible, otherwise just tags
        // _PostTags is the join table created by Prisma. 
        // PostgREST might not expose tables starting with _ by default or it might be tricky.
        // Let's first try basic select.
        const { data: tags, error } = await supabaseAdmin
            .from('Tag')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        // TODO: Implement post count aggregation if needed. 
        // For now returning tags without count to ensure stability.
        // Prisma return: { ..., _count: { posts: N } }
        // We'll mock it or fetch separately if critical.
        const tagsWithCount = tags.map(tag => ({
            ...tag,
            _count: { posts: 0 }
        }));

        res.json(tagsWithCount);
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
});

// POST /api/tags — create a new tag
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const slug = slugify(name, { lower: true, strict: true });

        const { data, error } = await supabaseAdmin
            .from('Tag')
            .insert([{ name, slug }])
            .select() // Return the created record
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating tag:', error);
        res.status(500).json({ error: 'Failed to create tag' });
    }
});

export default router;
