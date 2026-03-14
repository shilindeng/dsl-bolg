import crypto from 'crypto';
import prisma from './prisma.js';

const DEFAULT_TTL_MINUTES = 15;

function hashValue(input: string) {
    return crypto.createHash('sha256').update(input).digest('hex');
}

function generateNumericCode() {
    return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function generateOpaqueToken() {
    return crypto.randomBytes(24).toString('hex');
}

export async function createEmailToken(input: {
    email: string;
    purpose: 'reader_login' | 'newsletter_confirm' | 'newsletter_unsubscribe';
    userId?: number | null;
    ttlMinutes?: number;
    kind?: 'numeric' | 'opaque';
}) {
    const rawValue = input.kind === 'opaque' ? generateOpaqueToken() : generateNumericCode();
    const expiresAt = new Date(Date.now() + (input.ttlMinutes || DEFAULT_TTL_MINUTES) * 60 * 1000);

    await prisma.emailToken.updateMany({
        where: {
            email: input.email,
            purpose: input.purpose,
            consumedAt: null,
        },
        data: {
            consumedAt: new Date(),
        },
    });

    await prisma.emailToken.create({
        data: {
            email: input.email,
            purpose: input.purpose,
            codeHash: hashValue(rawValue),
            expiresAt,
            userId: input.userId ?? null,
        },
    });

    return {
        rawValue,
        expiresAt,
    };
}

export async function consumeEmailToken(input: {
    email: string;
    purpose: 'reader_login' | 'newsletter_confirm' | 'newsletter_unsubscribe';
    value: string;
}) {
    const token = await prisma.emailToken.findFirst({
        where: {
            email: input.email,
            purpose: input.purpose,
            consumedAt: null,
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
    });

    if (!token || token.codeHash !== hashValue(input.value)) {
        return null;
    }

    await prisma.emailToken.update({
        where: { id: token.id },
        data: { consumedAt: new Date() },
    });

    return token;
}

export async function pruneExpiredEmailTokens() {
    await prisma.emailToken.deleteMany({
        where: {
            expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
    });
}
