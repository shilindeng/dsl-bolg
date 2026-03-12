import fs from 'node:fs/promises';
import path from 'node:path';
import { loadEnv } from 'vite';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const env = {
    ...loadEnv('production', rootDir, ''),
    ...process.env,
};

const normalizeUrl = (value) => value.replace(/\/+$/, '');
const xmlEscape = (value) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

const siteUrl = normalizeUrl(env.VITE_SITE_URL || 'http://localhost:4173');
const apiBaseRaw = (env.VITE_API_BASE || '/api').trim();
const apiCandidates = apiBaseRaw.startsWith('http')
    ? [normalizeUrl(apiBaseRaw)]
    : ['http://127.0.0.1:3001/api', 'http://localhost:3001/api'];

async function fetchJsonFromCandidates(resourcePath) {
    for (const candidate of apiCandidates) {
        try {
            const response = await fetch(`${candidate}${resourcePath}`);
            if (!response.ok) {
                continue;
            }

            return await response.json();
        } catch {
        }
    }

    return null;
}

function makeAbsoluteUrl(inputPath) {
    return `${siteUrl}${inputPath.startsWith('/') ? inputPath : `/${inputPath}`}`;
}

const staticEntries = [
    { path: '/', changefreq: 'daily', priority: '1.0' },
    { path: '/blog', changefreq: 'daily', priority: '0.9' },
    { path: '/projects', changefreq: 'weekly', priority: '0.8' },
    { path: '/series', changefreq: 'weekly', priority: '0.8' },
    { path: '/newsletter', changefreq: 'weekly', priority: '0.8' },
    { path: '/about', changefreq: 'monthly', priority: '0.7' },
];

const postsResponse = await fetchJsonFromCandidates('/posts?limit=100');
const posts = Array.isArray(postsResponse?.data) ? postsResponse.data : [];

const seriesResponse = await fetchJsonFromCandidates('/series');
const series = Array.isArray(seriesResponse) ? seriesResponse : [];

const sitemapEntries = [
    ...staticEntries.map((entry) => ({
        loc: makeAbsoluteUrl(entry.path),
        lastmod: new Date().toISOString(),
        changefreq: entry.changefreq,
        priority: entry.priority,
    })),
    ...posts.map((post) => ({
        loc: makeAbsoluteUrl(`/blog/${post.slug}`),
        lastmod: post.updatedAt || post.publishedAt || new Date().toISOString(),
        changefreq: 'monthly',
        priority: post.featured ? '0.9' : '0.8',
    })),
    ...series.map((item) => ({
        loc: makeAbsoluteUrl(`/series/${item.slug}`),
        lastmod: item.updatedAt || new Date().toISOString(),
        changefreq: 'weekly',
        priority: '0.7',
    })),
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries
    .map(
        (entry) => `  <url>
    <loc>${xmlEscape(entry.loc)}</loc>
    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
    )
    .join('\n')}
</urlset>
`;

const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${makeAbsoluteUrl('/sitemap.xml')}
`;

const rssItems = posts
    .slice(0, 20)
    .map((post) => {
        const link = makeAbsoluteUrl(`/blog/${post.slug}`);
        return `  <item>
    <title>${xmlEscape(post.title)}</title>
    <link>${xmlEscape(link)}</link>
    <guid>${xmlEscape(link)}</guid>
    <pubDate>${new Date(post.publishedAt || post.createdAt || Date.now()).toUTCString()}</pubDate>
    <description>${xmlEscape(post.excerpt || '')}</description>
  </item>`;
    })
    .join('\n');

const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AI信息差研究院</title>
    <link>${xmlEscape(siteUrl)}</link>
    <description>AI信息差研究院 RSS Feed</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${rssItems}
  </channel>
</rss>
`;

await fs.writeFile(path.join(distDir, 'robots.txt'), robotsTxt, 'utf8');
await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf8');
await fs.writeFile(path.join(distDir, 'rss.xml'), rssXml, 'utf8');

if (!posts.length) {
    console.warn('[generate-static-seo] No posts fetched. Generated static SEO files with core routes only.');
} else {
    console.log(`[generate-static-seo] Generated robots.txt, sitemap.xml and rss.xml for ${posts.length} posts.`);
}
