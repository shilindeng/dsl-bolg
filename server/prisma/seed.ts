import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import { createExcerpt, estimateReadTime } from '../src/lib/content.js';

const prisma = new PrismaClient();

async function ensureTag(name: string) {
    return prisma.tag.upsert({
        where: { slug: slugify(name, { lower: true, strict: true }) },
        update: { name },
        create: {
            name,
            slug: slugify(name, { lower: true, strict: true }),
        },
    });
}

async function ensureCategory(name: string, slug: string) {
    return prisma.category.upsert({
        where: { slug },
        update: { name },
        create: { name, slug },
    });
}

async function main() {
    console.log('Seeding database...');

    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@dsl.blog' },
        update: {
            password: hashedPassword,
            name: 'DSL',
            role: 'admin',
        },
        create: {
            email: 'admin@dsl.blog',
            password: hashedPassword,
            name: 'DSL',
            role: 'admin',
        },
    });

    const categories = await Promise.all([
        ensureCategory('技术洞察', 'insight'),
        ensureCategory('产品设计', 'design'),
        ensureCategory('数字生活', 'life'),
    ]);

    const tags = await Promise.all(
        ['React', 'TypeScript', 'Node.js', 'AI', 'Cloudflare', 'Design System', 'Prisma'].map(ensureTag),
    );

    const posts = [
        {
            title: '把个人博客做成专业品牌站，需要先解决什么问题',
            slug: 'build-a-professional-personal-blog',
            content: `# 把个人博客做成专业品牌站，需要先解决什么问题

## 先从结构开始，而不是先堆特效

很多博客第一眼很炫，但读者停留一分钟后就找不到文章、项目与作者价值。真正专业的个人博客，首页必须完成三件事：

1. 说明你是谁，以及你在解决什么问题
2. 给出值得读的代表内容
3. 让用户知道下一步可以去哪里

## 品牌感来自一致性

专业感不靠一句 slogan，而是来自一致的视觉节奏、文案语气、卡片体系、导航逻辑与 SEO 细节。

## 读者真正关心什么

读者并不关心你的粒子效果本身，他们关心的是：

- 文章是否有深度
- 页面是否易读
- 项目是否可信
- 作者是否有判断力

## 我的结论

如果你想把博客做成长期资产，优先级应该是：

### 1. 信息架构

首页、归档页、文章页、项目页和关于页必须各司其职。

### 2. 内容分发能力

SEO、RSS、结构化数据、社交分享图，这些都决定内容是否能被持续看见。

### 3. 可维护的系统

评论、发布、草稿、上传、部署和监控，必须能稳定运行，而不是靠记忆维持。`,
            categorySlug: 'insight',
            tagNames: ['Design System', 'AI', 'React'],
            featured: true,
        },
        {
            title: '高级赛博编辑感：如何让风格化界面依然保持专业可读',
            slug: 'premium-cyber-editorial-ui',
            content: `# 高级赛博编辑感：如何让风格化界面依然保持专业可读

## 风格不是目的，阅读才是目的

赛博风格最常见的问题，是把视觉刺激放在了信息效率前面。于是页面看起来热闹，但真正阅读起来很累。

## 我更偏好的做法

我会把风格拆成三层：

### 氛围层

背景、光感、材质、局部粒子和少量动态，用来建立记忆点。

### 信息层

标题、正文、目录、标签、元信息和按钮，这一层必须稳定、克制、清晰。

### 交互层

悬停、焦点、切换和反馈要足够明确，但不能让用户觉得页面一直在“自我表演”。

## 一个实用原则

让首页承担更多氛围，让文章页承担更多阅读。首页可以更戏剧化，正文页应该像一本经过设计的杂志。`,
            categorySlug: 'design',
            tagNames: ['Design System', 'React'],
            featured: true,
        },
        {
            title: '从本地博客到 Cloudflare + 独立 API：一次更现实的部署思路',
            slug: 'cloudflare-pages-and-api-server',
            content: `# 从本地博客到 Cloudflare + 独立 API：一次更现实的部署思路

## 为什么我不建议一开始就全量重构

很多项目一提到上线，就想一步到位改成全新的架构。但对于已经跑起来的博客，更现实的路线是先把前端和 API 稳定拆开。

## 一个适合当前阶段的方案

### 前端

部署到 Cloudflare Pages，拿到全球 CDN、证书和边缘缓存能力。

### API

保留独立服务部署，使用熟悉的 Node.js、Nginx 和 PM2，降低迁移风险。

### 静态资源

图片逐步迁移到 R2，避免本地磁盘成为长期负担。

## 这样做的收益

- 前端发布更快
- 域名和缓存策略更清晰
- 后端依然保留调试与运维自由度
- 后续可以逐步演进，而不是一次重写`,
            categorySlug: 'insight',
            tagNames: ['Cloudflare', 'Node.js', 'Prisma'],
            featured: false,
        },
    ];

    for (const item of posts) {
        const category = categories.find((entry) => entry.slug === item.categorySlug);
        const existing = await prisma.post.findUnique({ where: { slug: item.slug } });

        const post =
            existing
                ? await prisma.post.update({
                    where: { id: existing.id },
                    data: {
                        title: item.title,
                        content: item.content,
                        excerpt: createExcerpt(item.content),
                        published: true,
                        featured: item.featured,
                        publishedAt: existing.publishedAt || new Date(),
                        categoryId: category?.id,
                    },
                })
                : await prisma.post.create({
                    data: {
                        title: item.title,
                        slug: item.slug,
                        content: item.content,
                        excerpt: createExcerpt(item.content),
                        published: true,
                        featured: item.featured,
                        publishedAt: new Date(),
                        categoryId: category?.id,
                    },
                });

        await prisma.postMeta.upsert({
            where: { postId: post.id },
            update: { readTime: estimateReadTime(item.content) },
            create: { postId: post.id, readTime: estimateReadTime(item.content) },
        });

        await prisma.postTag.deleteMany({ where: { postId: post.id } });
        for (const tagName of item.tagNames) {
            const tag = tags.find((entry) => entry.name === tagName);
            if (tag) {
                await prisma.postTag.create({
                    data: { postId: post.id, tagId: tag.id },
                });
            }
        }
    }

    const projects = [
        {
            name: 'DSL Blog',
            slug: 'dsl-blog',
            summary: '个人品牌博客系统，面向长期写作与项目沉淀。',
            description:
                '一个围绕技术写作、项目复盘与数字表达打造的专业博客。前端聚焦高级赛博编辑感，后端保持稳定的内容管理与部署能力。',
            techStack: 'React, TypeScript, Express, Prisma, Cloudflare',
            repoUrl: 'https://github.com/dsl/blog',
            liveUrl: 'https://dsl.blog',
            featured: true,
            order: 1,
        },
        {
            name: 'Signal Archive',
            slug: 'signal-archive',
            summary: '面向内容创作者的轻量知识归档实验。',
            description:
                '一个把长文、卡片笔记和主题索引串联在一起的内容实验项目，重点探索信息结构与检索体验。',
            techStack: 'React, Search UX, Design Systems',
            featured: true,
            order: 2,
        },
        {
            name: 'Operator Console',
            slug: 'operator-console',
            summary: '用于管理内容发布、审核和运行状态的内部面板。',
            description:
                '为个人内容站设计的后台控制台，提供内容发布、评论审核、状态追踪和部署检查能力。',
            techStack: 'TypeScript, Node.js, Prisma',
            featured: false,
            order: 3,
        },
    ];

    for (const item of projects) {
        await prisma.project.upsert({
            where: { slug: item.slug },
            update: item,
            create: item,
        });
    }

    console.log('Seed complete.');
    console.log('Admin login: admin@dsl.blog / admin123');
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
