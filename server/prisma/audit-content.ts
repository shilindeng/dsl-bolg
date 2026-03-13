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
            categoryId: true,
            seriesId: true,
            content: true,
            tags: { select: { tagId: true } },
        },
        orderBy: { updatedAt: 'desc' },
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

        return {
            slug: post.slug,
            title: post.title,
            findings,
        };
    }).filter((post) => post.findings.length > 0);

    console.log(JSON.stringify({ total: posts.length, issues }, null, 2));
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
