import crypto from 'node:crypto';
import prisma from './prisma.js';

const API_KEY_PREFIX = 'dsl_';

function hashApiKey(value: string) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

export function createPlainApiKey() {
    return `${API_KEY_PREFIX}${crypto.randomBytes(24).toString('hex')}`;
}

export function serializeScopes(scopes: string[]) {
    return Array.from(new Set(scopes)).join(',');
}

export function parseScopes(scopes: string) {
    return scopes.split(',').map((scope) => scope.trim()).filter(Boolean);
}

export async function createApiKeyRecord(input: { name: string; scopes: string[] }) {
    const plainKey = createPlainApiKey();
    const keyPrefix = plainKey.slice(0, 12);
    const keyHash = hashApiKey(plainKey);

    const record = await prisma.apiKey.create({
        data: {
            name: input.name,
            keyPrefix,
            keyHash,
            scopes: serializeScopes(input.scopes),
        },
    });

    return { plainKey, record };
}

export async function resolveApiKey(plainKey: string) {
    const keyHash = hashApiKey(plainKey);
    const record = await prisma.apiKey.findUnique({ where: { keyHash } });

    if (!record || record.revokedAt) {
        return null;
    }

    await prisma.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } });
    return { ...record, scopesList: parseScopes(record.scopes) };
}
