import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';

let initialized = false;
let tempDir = '';
let prismaModule: typeof import('../../src/lib/prisma.js') | null = null;
let appFactory: typeof import('../../src/app.js') | null = null;

const serverRoot = process.cwd();

async function clearDatabase(prisma: NonNullable<typeof prismaModule>['default']) {
    await prisma.newsletterDelivery.deleteMany();
    await prisma.newsletterIssue.deleteMany();
    await prisma.newsletterSubscriber.deleteMany();
    await prisma.emailToken.deleteMany();
    await prisma.externalPostLink.deleteMany();
    await prisma.analyticsEvent.deleteMany();
    await prisma.postTag.deleteMany();
    await prisma.postMeta.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.bookmark.deleteMany();
    await prisma.readingHistory.deleteMany();
    await prisma.post.deleteMany();
    await prisma.project.deleteMany();
    await prisma.series.deleteMany();
    await prisma.category.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.homepageSection.deleteMany();
    await prisma.user.deleteMany();
}

export async function ensureTestContext() {
    if (!initialized) {
        tempDir = path.join(serverRoot, 'prisma', '.vitest');
        fs.mkdirSync(tempDir, { recursive: true });
        const testDbPath = path.join(tempDir, 'test.db');
        if (fs.existsSync(testDbPath)) {
            fs.rmSync(testDbPath, { force: true });
        }
        fs.copyFileSync(path.join(serverRoot, 'prisma', 'blog.db'), testDbPath);
        process.env.DATABASE_URL = `file:${testDbPath.replace(/\\/g, '/')}`;
        process.env.JWT_SECRET = 'test-secret-for-suite';
        process.env.DISABLE_NEWSLETTER_WORKER = 'true';
        process.env.NODE_ENV = 'test';

        prismaModule = await import('../../src/lib/prisma.js');
        appFactory = await import('../../src/app.js');
        await clearDatabase(prismaModule.default);
        initialized = true;
    }

    return {
        prisma: prismaModule!.default,
        createApp: appFactory!.createApp,
    };
}

export async function resetDatabase() {
    const { prisma } = await ensureTestContext();
    await clearDatabase(prisma);
}

export async function closeTestContext() {
    if (!initialized) {
        return;
    }

    await prismaModule?.default.$disconnect();
    initialized = false;
    prismaModule = null;
    appFactory = null;
}

export function signAdminToken(overrides?: Record<string, unknown>) {
    return jwt.sign(
        {
            id: 1,
            email: 'admin@test.local',
            role: 'admin',
            name: 'Test Admin',
            ...overrides,
        },
        process.env.JWT_SECRET || 'test-secret-for-suite',
        { expiresIn: '1h' },
    );
}
