import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { getTokenFromRequest } from '../middleware/auth.js';
import { verifyTurnstileToken } from '../lib/turnstile.js';
import { createEmailToken, consumeEmailToken, pruneExpiredEmailTokens } from '../lib/authTokens.js';
import { buildSiteUrl, sendMail } from '../lib/email.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dsl-blog-secret-key-change-in-production';
const isProduction = process.env.NODE_ENV === 'production';

function signUserToken(user: { id: number; email: string; role: string; name: string }) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' },
    );
}

function buildReaderName(email: string) {
    return email.split('@')[0].slice(0, 24) || 'Reader';
}

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

        if (!user || user.role !== 'admin' || !user.password) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const token = signUserToken(user);

        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to log in' });
    }
});

router.post('/request-code', async (req: Request, res: Response) => {
    try {
        const { email, turnstileToken } = req.body as { email?: string; turnstileToken?: string };

        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const validTurnstile = await verifyTurnstileToken(turnstileToken, req.ip);
        if (!validTurnstile) {
            res.status(400).json({ error: 'Turnstile validation failed' });
            return;
        }

        await pruneExpiredEmailTokens();
        const existingUser = await prisma.user.findUnique({ where: { email } });
        const { rawValue, expiresAt } = await createEmailToken({
            email,
            purpose: 'reader_login',
            userId: existingUser?.id,
            ttlMinutes: 10,
            kind: 'numeric',
        });

        const preview = await sendMail({
            to: email,
            subject: 'DSL Blog 登录验证码',
            html: `<p>你的登录验证码是 <strong>${rawValue}</strong></p><p>10 分钟内有效。</p>`,
            text: `你的 DSL Blog 登录验证码是：${rawValue}。10 分钟内有效。`,
        });

        res.json({
            message: 'Verification code sent',
            expiresAt: expiresAt.toISOString(),
            ...(isProduction ? {} : { previewCode: rawValue, preview }),
        });
    } catch (error) {
        console.error('Request code error:', error);
        res.status(500).json({ error: 'Failed to send verification code' });
    }
});

router.post('/verify-code', async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body as { email?: string; code?: string };

        if (!email || !code) {
            res.status(400).json({ error: 'Email and code are required' });
            return;
        }

        const tokenRecord = await consumeEmailToken({
            email,
            purpose: 'reader_login',
            value: code,
        });

        if (!tokenRecord) {
            res.status(400).json({ error: 'Code is invalid or expired' });
            return;
        }

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name: buildReaderName(email),
                    role: 'reader',
                    emailVerifiedAt: new Date(),
                    lastLoginAt: new Date(),
                },
            });
        } else {
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerifiedAt: user.emailVerifiedAt || new Date(),
                    lastLoginAt: new Date(),
                },
            });
        }

        const token = signUserToken(user);
        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
        });
    } catch (error) {
        console.error('Verify code error:', error);
        res.status(500).json({ error: 'Failed to verify code' });
    }
});

router.post('/logout', async (_req: Request, res: Response) => {
    res.status(204).end();
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
