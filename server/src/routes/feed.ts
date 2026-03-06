import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { siteConfig } from '../lib/site.js';

const router = Router();

router.get('/rss', async (_req: Request, res: Response) => {
    try {
        const posts = await prisma.post.findMany({
            where: { published: true },
            include: { tags: { include: { tag: true } } },
            orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
            take: 20,
        });

        const rssItems = posts
            .map(
                (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteConfig.siteUrl}/blog/${post.slug}</link>
      <guid>${siteConfig.siteUrl}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.publishedAt || post.createdAt).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt || ''}]]></description>
      ${post.tags.map((item) => `<category>${item.tag.name}</category>`).join('\n      ')}
    </item>`,
            )
            .join('');

        const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteConfig.siteName}</title>
    <link>${siteConfig.siteUrl}</link>
    <description>高质量技术文章、项目复盘与数字创作日志。</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteConfig.siteUrl}/api/feed/rss" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;

        res.set('Content-Type', 'application/rss+xml; charset=utf-8');
        res.send(rss);
    } catch (error) {
        console.error('Error generating RSS:', error);
        res.status(500).json({ error: 'Failed to generate RSS' });
    }
});

export default router;
