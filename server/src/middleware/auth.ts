import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { readJwtSecret } from '../lib/env.js';

export interface AuthUser {
    id: number;
    email: string;
    role: string;
    name?: string;
}

export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}

function decodeToken(token: string) {
    return jwt.verify(token, readJwtSecret()) as AuthUser;
}

export function getTokenFromRequest(req: Request) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.split(' ')[1];
}

export function getOptionalUser(req: Request) {
    const token = getTokenFromRequest(req);

    if (!token) {
        return null;
    }

    try {
        return decodeToken(token);
    } catch {
        return null;
    }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = getTokenFromRequest(req);

    if (!token) {
        res.status(401).json({ error: 'Unauthorized: missing token' });
        return;
    }

    try {
        const decoded = decodeToken(token);
        (req as AuthenticatedRequest).user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
    }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if ((req as AuthenticatedRequest).user?.role !== 'admin') {
        res.status(403).json({ error: 'Forbidden: Admin access required' });
        return;
    }

    next();
}
