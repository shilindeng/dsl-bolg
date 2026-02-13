import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

// GET /api/comments?postId=xxx — 获取文章评论
router.get('/', async (req: Request, res: Response) => {
    try {
        const { postId } = req.query;
        if (!postId) {
            res.status(400).json({ error: '缺少 postId 参数' });
            return;
        }

        // Fetch top-level comments with approved replies
        // Note: 'replies' alias relies on self-relation FK. 
        // We explicitly specify the relation if needed, or rely on Supabase detection.
        // Assuming FK is parentId.
        const { data: comments, error } = await supabaseAdmin
            .from('Comment')
            .select(`
                *,
                replies:Comment!parentId(*)
            `)
            .eq('postId', postId)
            .eq('approved', true)
            .is('parentId', null) // Only top level
            .eq('replies.approved', true) // Filter replies
            .order('createdAt', { ascending: false }) // Top level order
            .order('createdAt', { foreignTable: 'replies', ascending: true }); // Replies order

        if (error) throw error;

        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: '获取评论失败' });
    }
});

// POST /api/comments — 提交评论
router.post('/', async (req: Request, res: Response) => {
    try {
        const { content, author, email, postId, parentId } = req.body;

        if (!content || !author || !postId) {
            res.status(400).json({ error: '缺少必填字段 (content, author, postId)' });
            return;
        }

        const { data: comment, error } = await supabaseAdmin
            .from('Comment')
            .insert([{
                content,
                author,
                email: email || null,
                postId: parseInt(postId),
                parentId: parentId ? parseInt(parentId) : null,
                approved: true // Auto-approve for now
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ message: '评论已提交，等待审核', comment });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: '提交评论失败' });
    }
});

export default router;
