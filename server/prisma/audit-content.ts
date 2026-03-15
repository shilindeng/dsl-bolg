import { PrismaClient } from '@prisma/client';
import { assessPostQuality } from '../src/lib/contentQuality.js';

const prisma = new PrismaClient();

async function main() {
    const posts = await prisma.post.findMany({
        where: { published: true },
        select: {
            id: true,
            slug: true,
            title: true,
            deck: true,
            excerpt: true,
            coverImage: true,
            featured: true,
            categoryId: true,
            seriesId: true,
            seriesOrder: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            content: true,
            contentFormat: true,
            sourceUrl: true,
            meta: { select: { views: true, likes: true, readTime: true } },
            tags: { select: { tag: { select: { name: true } } } },
        },
        orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
    });

    const issues = posts.map((post) => {
        const quality = assessPostQuality({
            title: post.title,
            deck: post.deck,
            excerpt: post.excerpt,
            content: post.content,
            contentFormat: post.contentFormat,
            published: true,
            tags: post.tags.map((item) => item.tag.name),
            categoryId: post.categoryId,
            coverImage: post.coverImage,
            sourceUrl: post.sourceUrl,
        });

        const views = post.meta?.views ?? 0;
        const likes = post.meta?.likes ?? 0;
        const score = views + likes * 3 + (post.featured ? 10_000 : 0);

        return {
            slug: post.slug,
            title: post.title,
            featured: post.featured,
            views,
            likes,
            score,
            errors: quality.errors,
            warnings: quality.warnings,
        };
    })
        .filter((post) => post.errors.length > 0 || post.warnings.length > 0)
        .sort((a, b) => b.score - a.score);

    const counts = new Map<string, number>();
    for (const issue of issues) {
        for (const finding of [...issue.errors, ...issue.warnings]) {
            counts.set(finding, (counts.get(finding) || 0) + 1);
        }
    }

    console.log(JSON.stringify({
        total: posts.length,
        issueCount: issues.length,
        findingCounts: Object.fromEntries([...counts.entries()].sort((a, b) => b[1] - a[1])),
        issues,
    }, null, 2));
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
