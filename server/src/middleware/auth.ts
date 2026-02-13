import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

/**
 * 认证中间件 — 验证 Supabase JWT Token
 * 用法: router.post('/', authMiddleware, handler)
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: '未授权：缺少 Token' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            res.status(401).json({ error: '未授权：Token 无效或已过期' });
            return;
        }

        // 将用户信息挂载到 request 上，便于后续路由使用
        (req as any).user = user;
        next();
    } catch (err) {
        res.status(500).json({ error: '认证服务异常' });
    }
}
