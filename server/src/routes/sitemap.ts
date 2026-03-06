import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/robots.txt', (_req, res) => {
    const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
    const robots = `User-agent: *
Allow: /
Sitemap: ${siteUrl}/sitemap.xml
`;
    res.header('Content-Type', 'text/plain');
    res.send(robots);
});

router.get('/sitemap.xml', async (_req, res) => {
    try {
        const posts = await prisma.post.findMany({
            where: { published: true },
            select: { slug: true, updatedAt: true },
        });

        const siteUrl = process.env.SITE_URL || 'http://localhost:5173';

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${siteUrl}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${siteUrl}/blog</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${siteUrl}/projects</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
`;

        posts.forEach(post => {
            xml += `    <url>
        <loc>${siteUrl}/blog/${post.slug}</loc>
        <lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>
`;
        });

        xml += `</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        console.error('Sitemap generation error:', error);
        res.status(500).send('Error generating sitemap');
    }
});

export default router;
