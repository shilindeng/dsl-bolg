import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { getTokenFromRequest } from '../middleware/auth.js';
import { verifyTurnstileToken } from '../lib/turnstile.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dsl-blog-secret-key-change-in-production';

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password, turnstileToken } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const validTurnstile = await verifyTurnstileToken(turnstileToken, req.ip);
        if (!validTurnstile) {
            res.status(400).json({ error: 'Turnstile validation failed' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '7d' },
        );

        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to log in' });
    }
});

router.get('/me', async (req: Request, res: Response) => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, name: true, role: true },
        });

        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }

        res.json(user);
    } catch {
        res.status(401).json({ error: 'Token is invalid or expired' });
    }
});

export default router;
