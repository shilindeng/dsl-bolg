import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function looksInlineHtmlHeavy(content: string) {
    return /style=|data-blog-html-root=|<section|<div/i.test(content);
}

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
            meta: { select: { views: true, likes: true, readTime: true } },
            tags: { select: { tagId: true } },
        },
        orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
    });

    const issues = posts.map((post) => {
        const findings: string[] = [];

        if (!post.deck?.trim()) findings.push('missing_deck');
        if (!post.categoryId) findings.push('missing_category');
        if (!post.coverImage) findings.push('missing_cover');
        if (!post.seriesId) findings.push('missing_series');
        if (!post.tags.length) findings.push('missing_tags');
        if (post.excerpt.trim().length < 48) findings.push('weak_excerpt');
        if (looksInlineHtmlHeavy(post.content)) findings.push('inline_html_heavy');

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
            findings,
        };
    })
        .filter((post) => post.findings.length > 0)
        .sort((a, b) => b.score - a.score);

    const findingCounts = new Map<string, number>();
    for (const issue of issues) {
        for (const finding of issue.findings) {
            findingCounts.set(finding, (findingCounts.get(finding) || 0) + 1);
        }
    }

    console.log(JSON.stringify({
        total: posts.length,
        issueCount: issues.length,
        findingCounts: Object.fromEntries([...findingCounts.entries()].sort((a, b) => b[1] - a[1])),
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
