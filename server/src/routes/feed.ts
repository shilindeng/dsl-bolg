import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/feed/rss — RSS 2.0 Feed
router.get('/rss', async (_req: Request, res: Response) => {
    try {
        const posts = await prisma.post.findMany({
            where: { published: true },
            include: { tags: { include: { tag: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        const siteUrl = process.env.SITE_URL || 'http://localhost:5173';

        const rssItems = posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid>${siteUrl}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt || ''}]]></description>
      ${post.tags.map(pt => `<category>${pt.tag.name}</category>`).join('\n      ')}
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

export default router;
