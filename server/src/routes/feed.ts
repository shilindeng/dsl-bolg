import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

// GET /api/feed/rss — RSS 2.0 Feed
router.get('/rss', async (_req: Request, res: Response) => {
    try {
        // Fetch posts
        const { data: posts, error } = await supabaseAdmin
            .from('Post')
            .select('*')
            .eq('published', true)
            .order('createdAt', { ascending: false })
            .limit(20);

        if (error) throw error;

        // Fetch tags manually because we are using a View for the relation
        // 1. Get all post IDs
        const postIds = posts.map(p => p.id);

        // 2. Get PostTags (postId, tagId)
        const { data: postTags } = await supabaseAdmin
            .from('PostTags')
            .select('postId, tagId')
            .in('postId', postIds);

        // 3. Get all relevant Tags
        const tagIds = postTags ? [...new Set(postTags.map(pt => pt.tagId))] : [];
        const { data: allTags } = await supabaseAdmin
            .from('Tag')
            .select('*')
            .in('id', tagIds);

        // 4. Map tags to posts
        const postsWithTags = posts.map(post => {
            const currentPostTagIds = postTags
                ?.filter(pt => pt.postId === post.id)
                .map(pt => pt.tagId) || [];

            const tags = allTags?.filter(t => currentPostTagIds.includes(t.id)) || [];
            return { ...post, tags };
        });

        const siteUrl = process.env.SITE_URL || 'http://localhost:5173';

        const rssItems = postsWithTags.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid>${siteUrl}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt || ''}]]></description>
      ${post.tags.map((t: any) => `<category>${t.name}</category>`).join('\n      ')}
    </item>`).join('');

        const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DSL Blog</title>
    <link>${siteUrl}</link>
    <description>赛博朋克个人博客 — 用代码、AI 和纯粹的风格构建数字现实。</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/feed/rss" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;

        res.set('Content-Type', 'application/rss+xml; charset=utf-8');
        res.send(rss);
    } catch (error) {
        console.error('Error generating RSS:', error);
        res.status(500).json({ error: '生成 RSS 失败' });
    }
});

// GET /api/feed/sitemap.xml — XML Sitemap
router.get('/sitemap.xml', async (_req: Request, res: Response) => {
    try {
        const { data: posts, error } = await supabaseAdmin
            .from('Post')
            .select('slug, updatedAt')
            .eq('published', true);

        if (error) throw error;

        const siteUrl = process.env.SITE_URL || 'http://localhost:5173';

        const urls = [
            { loc: siteUrl, lastmod: new Date().toISOString(), priority: '1.0' },
            { loc: `${siteUrl}/blog`, lastmod: new Date().toISOString(), priority: '0.9' },
            { loc: `${siteUrl}/projects`, lastmod: new Date().toISOString(), priority: '0.8' },
            { loc: `${siteUrl}/about`, lastmod: new Date().toISOString(), priority: '0.7' },
            ...posts.map(post => ({
                loc: `${siteUrl}/blog/${post.slug}`,
                lastmod: new Date(post.updatedAt).toISOString(),
                priority: '0.6',
            })),
        ];

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

        res.set('Content-Type', 'application/xml; charset=utf-8');
        res.send(sitemap);
    } catch (error) {
        console.error('Error generating Sitemap:', error);
        res.status(500).json({ error: '生成 Sitemap 失败' });
    }
});

export default router;
