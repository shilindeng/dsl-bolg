import { Router } from 'express';
import { supabase } from '../lib/supabase'; // Fixed import

const router = Router();

router.get('/robots.txt', (req, res) => {
    const baseUrl = 'http://localhost:5173'; // Front-end URL
    // Or if server serves frontend, use that.
    // Robots.txt should point to the API sitemap or frontend sitemap if frontend handles it?
    // Since we are serving sitemap from API, lets point to API sitemap.
    // Sitemap: http://localhost:3001/sitemap.xml

    const sitemapUrl = 'http://localhost:3001/sitemap.xml';

    const robots = `User-agent: *
Allow: /
Sitemap: ${sitemapUrl}
`;
    res.header('Content-Type', 'text/plain');
    res.send(robots);
});

router.get('/sitemap.xml', async (req, res) => {
    try {
        const { data: posts } = await supabase
            .from('Post')
            .select('slug, updatedAt')
            .eq('published', true);

        const baseUrl = 'http://localhost:5173'; // Or production URL

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/blog</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${baseUrl}/projects</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
`;

        if (posts) {
            posts.forEach(post => {
                xml += `    <url>
        <loc>${baseUrl}/blog/${post.slug}</loc>
        <lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>
`;
            });
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
