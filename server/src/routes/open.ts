import { NextFunction, Request, Response, Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { imageUploadSingle } from '../middleware/upload.js';
import { persistUpload } from '../lib/upload.js';
import { createApiKeyRecord, parseScopes, resolveApiKey } from '../lib/apiKeys.js';
import { analyticsEventTypes, recordAnalyticsEvent } from '../lib/analytics.js';
import { upsertExternalPost } from '../lib/posts.js';

interface ApiKeyRequest extends Request {
    apiKey?: {
        id: number;
        scopesList: string[];
        name: string;
    };
}

function requireApiKey(scopes: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing API key' });
            return;
        }

        const token = authHeader.slice('Bearer '.length).trim();
        const apiKey = await resolveApiKey(token);
        if (!apiKey) {
            res.status(401).json({ error: 'Invalid or revoked API key' });
            return;
        }

        const missingScope = scopes.find((scope) => !apiKey.scopesList.includes(scope));
        if (missingScope) {
            res.status(403).json({ error: `Missing required scope: ${missingScope}` });
            return;
        }

        (req as ApiKeyRequest).apiKey = {
            id: apiKey.id,
            scopesList: apiKey.scopesList,
            name: apiKey.name,
        };

        next();
    };
}

const router = Router();

router.get('/admin/keys', authMiddleware, requireAdmin, async (_req: Request, res: Response) => {
    const keys = await prisma.apiKey.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(
        keys.map((key: { id: number; name: string; keyPrefix: string; scopes: string; lastUsedAt: Date | null; revokedAt: Date | null; createdAt: Date }) => ({
            id: key.id,
            name: key.name,
            keyPrefix: key.keyPrefix,
            scopes: parseScopes(key.scopes),
            lastUsedAt: key.lastUsedAt,
            revokedAt: key.revokedAt,
            createdAt: key.createdAt,
        })),
    );
});

router.post('/admin/keys', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { name, scopes } = req.body as { name?: string; scopes?: string[] };
        if (!name?.trim()) {
            res.status(400).json({ error: 'Key name is required' });
            return;
        }

        const normalizedScopes = Array.isArray(scopes) && scopes.length ? scopes : ['posts:write', 'media:write'];
        const result = await createApiKeyRecord({ name: name.trim(), scopes: normalizedScopes });
        await recordAnalyticsEvent({
            type: analyticsEventTypes.apiKeyCreate,
            source: 'admin',
            metadata: { keyId: result.record.id, name: result.record.name },
        });

        res.status(201).json({
            id: result.record.id,
            name: result.record.name,
            keyPrefix: result.record.keyPrefix,
            scopes: normalizedScopes,
            key: result.plainKey,
            createdAt: result.record.createdAt,
        });
    } catch (error) {
        console.error('Create API key error:', error);
        res.status(500).json({ error: 'Failed to create API key' });
    }
});

router.post('/admin/keys/:id/revoke', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const record = await prisma.apiKey.update({
            where: { id },
            data: { revokedAt: new Date() },
        });

        await recordAnalyticsEvent({
            type: analyticsEventTypes.apiKeyRevoke,
            source: 'admin',
            metadata: { keyId: record.id, name: record.name },
        });

        res.json({ id: record.id, revokedAt: record.revokedAt });
    } catch (error) {
        console.error('Revoke API key error:', error);
        res.status(500).json({ error: 'Failed to revoke API key' });
    }
});

router.post('/v1/media', requireApiKey(['media:write']), imageUploadSingle, async (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400).json({ error: 'No image selected' });
        return;
    }

    try {
        const result = await persistUpload(req.file);
        await recordAnalyticsEvent({
            type: analyticsEventTypes.upload,
            source: 'open_api',
            metadata: { filename: result.filename, storage: result.storage },
        });
        res.status(201).json(result);
    } catch (error) {
        console.error('Open API upload failed:', error);
        res.status(500).json({ error: 'Failed to store image' });
    }
});

router.put('/v1/posts/:provider/:externalId', requireApiKey(['posts:write']), async (req: Request, res: Response) => {
    try {
        const { provider, externalId } = req.params;
        const post = await upsertExternalPost({
            provider: String(provider),
            externalId: String(externalId),
            payload: req.body,
        });

        res.json({
            postId: post.id,
            slug: post.slug,
            url: `/blog/${post.slug}`,
            published: post.published,
            updatedAt: post.updatedAt,
        });
    } catch (error) {
        console.error('Open API upsert failed:', error);
        res.status(500).json({ error: 'Failed to publish post' });
    }
});

router.patch('/v1/posts/:provider/:externalId', requireApiKey(['posts:write']), async (req: Request, res: Response) => {
    try {
        const { provider, externalId } = req.params;
        const existingLink = await prisma.externalPostLink.findUnique({
            where: { provider_externalId: { provider: String(provider), externalId: String(externalId) } },
        });

        if (!existingLink) {
            res.status(404).json({ error: 'External post mapping not found' });
            return;
        }

        const post = await upsertExternalPost({
            provider: String(provider),
            externalId: String(externalId),
            payload: req.body,
        });

        res.json({
            postId: post.id,
            slug: post.slug,
            url: `/blog/${post.slug}`,
            published: post.published,
            updatedAt: post.updatedAt,
        });
    } catch (error) {
        console.error('Open API patch failed:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

export default router;
