import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/comments?postId=xxx — 获取文章评论
router.get('/', async (req: Request, res: Response) => {
    try {
        const { postId } = req.query;
        if (!postId) {
            res.status(400).json({ error: '缺少 postId 参数' });
            return;
        }

        const comments = await prisma.comment.findMany({
            where: {
                postId: parseInt(postId as string),
                approved: true,
                parentId: null,
            },
            include: {
                replies: {
                    where: { approved: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

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

        const comment = await prisma.comment.create({
            data: {
                content,
                author,
                email: email || null,
                postId: parseInt(postId),
                parentId: parentId ? parseInt(parentId) : null,
                approved: true, // Auto-approve for now
            },
        });

        res.status(201).json({ message: '评论已提交', comment });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: '提交评论失败' });
    }
});

export default router;
