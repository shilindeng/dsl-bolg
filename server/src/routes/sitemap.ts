import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { isPublicProjectReady } from '../lib/publicPresentation.js';
import { siteConfig } from '../lib/site.js';

const router = Router();

router.get('/robots.txt', (_req, res) => {
    const robots = `User-agent: *
Allow: /
Sitemap: ${siteConfig.siteUrl}/sitemap.xml
`;

    res.header('Content-Type', 'text/plain');
    res.send(robots);
});

router.get('/sitemap.xml', async (_req, res) => {
    try {
        const [posts, projects, series] = await Promise.all([
            prisma.post.findMany({
                where: { published: true },
                select: { slug: true, updatedAt: true },
            }),
            prisma.project.findMany({
                select: { slug: true, updatedAt: true, name: true, summary: true, description: true },
            }),
            prisma.series.findMany({
                where: { posts: { some: { published: true } } },
                select: { slug: true, updatedAt: true },
            }),
        ]);

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${siteConfig.siteUrl}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${siteConfig.siteUrl}/blog</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${siteConfig.siteUrl}/projects</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${siteConfig.siteUrl}/series</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${siteConfig.siteUrl}/about</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
`;

        for (const post of posts) {
            xml += `    <url>
        <loc>${siteConfig.siteUrl}/blog/${post.slug}</loc>
        <lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
`;
        }

        for (const project of projects.filter((item) => isPublicProjectReady(item))) {
            xml += `    <url>
        <loc>${siteConfig.siteUrl}/projects/${project.slug}</loc>
        <lastmod>${new Date(project.updatedAt).toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
`;
        }

        for (const row of series) {
            xml += `    <url>
        <loc>${siteConfig.siteUrl}/series/${row.slug}</loc>
        <lastmod>${new Date(row.updatedAt).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>
`;
        }

        xml += `</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        console.error('Sitemap generation error:', error);
        res.status(500).send('Error generating sitemap');
    }
});

export default router;
