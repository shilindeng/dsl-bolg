import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadEnv } from 'vite';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const serverDir = path.resolve(rootDir, '..', 'server');
const env = {
    ...loadEnv('production', rootDir, ''),
    ...process.env,
};

const normalizeUrl = (value) => value.replace(/\/+$/, '');
const siteUrl = normalizeUrl(env.VITE_SITE_URL || 'http://localhost:4173');
const siteName = 'AI信息差研究院';
const defaultDescription = '用研究的方式拆解 AI 时代的信息差，把结论沉淀成可复用的方法、工具与实验笔记。';
const defaultOgImage = `${siteUrl}/og-default.svg`;
const themeColor = '#f6f1e7';
const apiBaseRaw = (env.VITE_API_BASE || '/api').trim();
const apiCandidates = apiBaseRaw.startsWith('http')
    ? [normalizeUrl(apiBaseRaw)]
    : ['http://127.0.0.1:3001/api', 'http://localhost:3001/api'];

const xmlEscape = (value) =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

const htmlEscape = (value) =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

function makeAbsoluteUrl(inputPath) {
    return `${siteUrl}${inputPath.startsWith('/') ? inputPath : `/${inputPath}`}`;
}

function getMetaImage(image) {
    if (!image) {
        return defaultOgImage;
    }

    return image.startsWith('http') ? image : `${siteUrl}${image}`;
}

async function fetchJsonFromCandidates(resourcePath) {
    for (const candidate of apiCandidates) {
        try {
            const response = await fetch(`${candidate}${resourcePath}`);
            if (!response.ok) {
                continue;
            }

            return await response.json();
        } catch {
            // Try next candidate.
        }
    }

    return null;
}

async function fetchStaticDataFromPrisma() {
    try {
        const prismaModule = await import(pathToFileURL(path.resolve(serverDir, 'node_modules', '@prisma', 'client', 'index.js')).href);
        const { PrismaClient } = prismaModule;
        const databasePath = path.join(serverDir, 'prisma', 'blog.db').replace(/\\/g, '/');
        const prisma = new PrismaClient({
            datasources: {
                db: {
                    url: `file:${databasePath}`,
                },
            },
        });

        const [posts, series, projects] = await Promise.all([
            prisma.post.findMany({
                where: { published: true },
                select: {
                    slug: true,
                    title: true,
                    excerpt: true,
                    coverImage: true,
                    createdAt: true,
                    publishedAt: true,
                    updatedAt: true,
                    featured: true,
                },
                orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
            }),
            prisma.series.findMany({
                where: { posts: { some: { published: true } } },
                select: {
                    slug: true,
                    title: true,
                    summary: true,
                    description: true,
                    coverImage: true,
                    updatedAt: true,
                },
            }),
            prisma.project.findMany({
                select: {
                    slug: true,
                    updatedAt: true,
                    name: true,
                    summary: true,
                    description: true,
                    coverImage: true,
                },
            }),
        ]);

        await prisma.$disconnect();

        return {
            posts,
            series,
            projects: projects.filter((item) => {
                const summary = (item.summary || item.description || '').trim();
                const description = (item.description || '').trim();
                return Boolean(item.name?.trim() && summary.length >= 16 && description.length >= 32);
            }),
        };
    } catch {
        return {
            posts: [],
            series: [],
            projects: [],
        };
    }
}

function renderMetaBlock(meta) {
    const lines = [
        `  <title>${htmlEscape(meta.title)}</title>`,
        `  <meta name="description" content="${htmlEscape(meta.description)}" />`,
        `  <meta name="theme-color" content="${themeColor}" />`,
        `  <link rel="canonical" href="${htmlEscape(meta.url)}" />`,
        `  <meta property="og:type" content="${meta.type}" />`,
        `  <meta property="og:title" content="${htmlEscape(meta.title)}" />`,
        `  <meta property="og:description" content="${htmlEscape(meta.description)}" />`,
        `  <meta property="og:url" content="${htmlEscape(meta.url)}" />`,
        `  <meta property="og:image" content="${htmlEscape(meta.image)}" />`,
        `  <meta property="og:site_name" content="${htmlEscape(siteName)}" />`,
        `  <meta name="twitter:card" content="summary_large_image" />`,
        `  <meta name="twitter:title" content="${htmlEscape(meta.title)}" />`,
        `  <meta name="twitter:description" content="${htmlEscape(meta.description)}" />`,
        `  <meta name="twitter:image" content="${htmlEscape(meta.image)}" />`,
    ];

    if (meta.publishedTime) {
        lines.push(`  <meta property="article:published_time" content="${htmlEscape(meta.publishedTime)}" />`);
    }

    if (meta.modifiedTime) {
        lines.push(`  <meta property="article:modified_time" content="${htmlEscape(meta.modifiedTime)}" />`);
    }

    if (meta.jsonLd) {
        lines.push(`  <script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`);
    }

    return lines.join('\n');
}

function renderRouteHtml(template, meta) {
    let output = template;
    const jsonLdPattern = new RegExp('<script type="application/ld\\+json">[\\s\\S]*?<\\/script>\\s*', 'gi');

    output = output.replace(/<title>[\s\S]*?<\/title>/i, '');
    output = output.replace(/<meta\s+name="description"[^>]*>\s*/i, '');
    output = output.replace(/<meta\s+name="theme-color"[^>]*>\s*/i, '');
    output = output.replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '');
    output = output.replace(/<meta\s+property="og:[^"]+"[^>]*>\s*/gi, '');
    output = output.replace(/<meta\s+name="twitter:[^"]+"[^>]*>\s*/gi, '');
    output = output.replace(/<meta\s+property="article:[^"]+"[^>]*>\s*/gi, '');
    output = output.replace(jsonLdPattern, '');

    return output.replace('</head>', `${renderMetaBlock(meta)}\n  </head>`);
}

async function writeRouteHtml(template, routePath, meta) {
    const target = routePath === '/'
        ? path.join(distDir, 'index.html')
        : path.join(distDir, routePath.replace(/^\/+/, ''), 'index.html');

    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, renderRouteHtml(template, meta), 'utf8');
}

const postsResponse = await fetchJsonFromCandidates('/posts?limit=100');
const seriesResponse = await fetchJsonFromCandidates('/series');
const projectsResponse = await fetchJsonFromCandidates('/projects');
const prismaFallback = await fetchStaticDataFromPrisma();
const posts = Array.isArray(postsResponse?.data) && postsResponse.data.length ? postsResponse.data : prismaFallback.posts;
const series = Array.isArray(seriesResponse) && seriesResponse.length ? seriesResponse : prismaFallback.series;
const projects = Array.isArray(projectsResponse) && projectsResponse.length ? projectsResponse : prismaFallback.projects;

const staticPages = [
    {
        path: '/',
        title: `首页 | ${siteName}`,
        description: defaultDescription,
    },
    {
        path: '/blog',
        title: `博客 | ${siteName}`,
        description: '按主题、分类和关键词浏览长期写作与案例判断。',
    },
    {
        path: '/projects',
        title: `项目 | ${siteName}`,
        description: '代表项目、案例、方法论与工程落地能力总览。',
    },
    {
        path: '/series',
        title: `专栏 | ${siteName}`,
        description: '按主题连续更新的写作专栏与阅读路径。',
    },
    {
        path: '/newsletter',
        title: `Newsletter | ${siteName}`,
        description: `订阅 ${siteName} 的长期写作与产品化更新。`,
    },
    {
        path: '/about',
        title: `关于 | ${siteName}`,
        description: '关于 DSL、工作方法，以及正在长期经营的内容与项目系统。',
    },
    {
        path: '/login',
        title: `登录 | ${siteName}`,
        description: '管理员登录与读者邮箱验证码登录入口。',
    },
];

const sitemapEntries = [
    ...staticPages.map((entry) => ({
        loc: makeAbsoluteUrl(entry.path),
        lastmod: new Date().toISOString(),
        changefreq: entry.path === '/' || entry.path === '/blog' ? 'daily' : 'weekly',
        priority: entry.path === '/' ? '1.0' : entry.path === '/blog' ? '0.9' : '0.8',
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
    ...projects.map((item) => ({
        loc: makeAbsoluteUrl(`/projects/${item.slug}`),
        lastmod: item.updatedAt || new Date().toISOString(),
        changefreq: 'monthly',
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
    <title>${siteName}</title>
    <link>${xmlEscape(siteUrl)}</link>
    <description>${xmlEscape(defaultDescription)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${rssItems}
  </channel>
</rss>
`;

const appTemplate = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');

await Promise.all(staticPages.map((page) => writeRouteHtml(appTemplate, page.path, {
    title: page.title,
    description: page.description,
    url: makeAbsoluteUrl(page.path),
    image: defaultOgImage,
    type: 'website',
})));

await Promise.all(posts.map((post) => writeRouteHtml(appTemplate, `/blog/${post.slug}`, {
    title: `${post.title} | ${siteName}`,
    description: post.excerpt || defaultDescription,
    url: makeAbsoluteUrl(`/blog/${post.slug}`),
    image: getMetaImage(post.coverImage),
    type: 'article',
    publishedTime: post.publishedAt || post.createdAt || null,
    modifiedTime: post.updatedAt || null,
    jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt || defaultDescription,
        url: makeAbsoluteUrl(`/blog/${post.slug}`),
        image: getMetaImage(post.coverImage),
        datePublished: post.publishedAt || post.createdAt || null,
        dateModified: post.updatedAt || null,
    },
})));

await Promise.all(series.map((item) => writeRouteHtml(appTemplate, `/series/${item.slug}`, {
    title: `${item.title} | ${siteName}`,
    description: item.summary || item.description || '按顺序阅读这个专栏的全部章节。',
    url: makeAbsoluteUrl(`/series/${item.slug}`),
    image: getMetaImage(item.coverImage),
    type: 'website',
})));

await Promise.all(projects.map((item) => writeRouteHtml(appTemplate, `/projects/${item.slug}`, {
    title: `${item.name} | ${siteName}`,
    description: item.summary || item.description || defaultDescription,
    url: makeAbsoluteUrl(`/projects/${item.slug}`),
    image: getMetaImage(item.coverImage),
    type: 'website',
    jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: item.name,
        description: item.summary || item.description || defaultDescription,
        url: makeAbsoluteUrl(`/projects/${item.slug}`),
        image: getMetaImage(item.coverImage),
    },
})));

await fs.writeFile(path.join(distDir, '404.html'), renderRouteHtml(appTemplate, {
    title: `404 | ${siteName}`,
    description: '你访问的页面可能已被移动、删除，或者当前链接本身已经失效。',
    url: makeAbsoluteUrl('/404'),
    image: defaultOgImage,
    type: 'website',
}), 'utf8');

await fs.writeFile(path.join(distDir, 'robots.txt'), robotsTxt, 'utf8');
await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf8');
await fs.writeFile(path.join(distDir, 'rss.xml'), rssXml, 'utf8');

console.log(`[generate-static-seo] Generated prerendered HTML, robots.txt, sitemap.xml and rss.xml for ${posts.length} posts, ${series.length} series and ${projects.length} projects.`);
