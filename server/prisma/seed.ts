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

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@dsl.blog';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'DSL';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password: hashedPassword,
            name: adminName,
            role: 'admin',
            emailVerifiedAt: new Date(),
        },
        create: {
            email: adminEmail,
            password: hashedPassword,
            name: adminName,
            role: 'admin',
            emailVerifiedAt: new Date(),
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
            deck: '先从结构开始，而不是先堆特效。真正专业的个人博客，首页必须完成身份说明、代表内容和明确路径这三件事。',
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
            deck: '风格不是目的，阅读才是目的。首页承担气质，正文承担信任。',
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
            deck: '比起一次性重写，更现实的路线是先把前端和 API 稳定拆开，再逐步演进架构。',
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
                        deck: item.deck,
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
                        deck: item.deck,
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
            headline: '内容系统 / 设计系统 / 发布链路',
            summary: '个人品牌博客系统，面向长期写作与项目沉淀。',
            description:
                '一个围绕技术写作、项目复盘与数字表达打造的专业博客。前端聚焦高级赛博编辑感，后端保持稳定的内容管理与部署能力。',
            techStack: 'React, TypeScript, Express, Prisma, Cloudflare',
            status: 'Live',
            period: '2025 - now',
            role: 'Product / Design / Frontend / Backend',
            repoUrl: 'https://github.com/dsl/blog',
            liveUrl: 'https://dsl.blog',
            featured: true,
            order: 1,
        },
        {
            name: 'Signal Archive',
            slug: 'signal-archive',
            headline: '信息结构 / 检索体验',
            summary: '面向内容创作者的轻量知识归档实验。',
            description:
                '一个把长文、卡片笔记和主题索引串联在一起的内容实验项目，重点探索信息结构与检索体验。',
            techStack: 'React, Search UX, Design Systems',
            status: 'Prototype',
            period: '2025',
            role: 'UX / Frontend',
            featured: true,
            order: 2,
        },
        {
            name: 'Operator Console',
            slug: 'operator-console',
            headline: '运营控制台 / 审核流',
            summary: '用于管理内容发布、审核和运行状态的内部面板。',
            description:
                '为个人内容站设计的后台控制台，提供内容发布、评论审核、状态追踪和部署检查能力。',
            techStack: 'TypeScript, Node.js, Prisma',
            status: 'Internal',
            period: '2026',
            role: 'Product / Backend / Dashboard',
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

    const homepageSections = [
        {
            type: 'hero',
            enabled: true,
            sortOrder: 10,
            sourceType: 'manual',
            eyebrow: '长期主义的个人品牌主场',
            title: '把博客做成真正能持续经营的作品系统。',
            description: '这里不只是展示“我做了什么”，而是把内容、项目、审美和部署能力一起组织成可长期累积的个人资产界面。',
            ctaLabel: '进入文章归档',
            ctaHref: '/blog',
            configJson: '{}',
        },
        {
            type: 'featured_posts',
            enabled: true,
            sortOrder: 20,
            sourceType: 'auto',
            eyebrow: '精选文章',
            title: '先看到最能代表方法与判断力的内容',
            description: '首页不堆满所有文章，而是优先把最值得建立第一印象的内容推到前面。',
            ctaLabel: '打开完整归档',
            ctaHref: '/blog',
            configJson: '{"autoFill":true,"limit":4}',
        },
        {
            type: 'archive_entry',
            enabled: true,
            sortOrder: 30,
            sourceType: 'manual',
            eyebrow: '归档入口',
            title: '按主题、标签和关键词进入内容档案',
            description: '更轻、更快、更像编辑推荐列表，而不是重复的大卡片堆叠。',
            ctaLabel: '浏览内容归档',
            ctaHref: '/blog',
            configJson: '{}',
        },
        {
            type: 'featured_projects',
            enabled: true,
            sortOrder: 40,
            sourceType: 'auto',
            eyebrow: '代表项目',
            title: '项目页承担方法论与落地能力的第二层证明',
            description: '文章建立判断力，项目建立可信度。',
            ctaLabel: '查看代表项目',
            ctaHref: '/projects',
            configJson: '{"autoFill":true,"limit":3}',
        },
        {
            type: 'author_cta',
            enabled: true,
            sortOrder: 50,
            sourceType: 'manual',
            eyebrow: '作者与合作',
            title: '如果你也在做长期主义内容系统、独立项目或 AI 工作流，我们可以聊聊。',
            description: '适合交流的方向包括：个人品牌站、内容产品、设计系统、AI 自动化，以及把创作链路真正上线的工程实践。',
            ctaLabel: '发送邮件',
            ctaHref: 'mailto:hello@dsl.blog',
            configJson: '{}',
        },
        {
            type: 'newsletter_cta',
            enabled: true,
            sortOrder: 60,
            sourceType: 'manual',
            eyebrow: 'Newsletter',
            title: '订阅长期写作与产品化更新',
            description: '接收新的长文、项目复盘和工作流迭代记录。',
            ctaLabel: '前往订阅',
            ctaHref: '/newsletter',
            configJson: '{}',
        },
        {
            type: 'utility_weather',
            enabled: true,
            sortOrder: 70,
            sourceType: 'manual',
            eyebrow: '在线天气信号',
            title: '把实时天气降级为辅助信息，而不是首页主叙事',
            description: '可保留现场感，但不再抢占主内容层级。',
            ctaLabel: '',
            ctaHref: '',
            configJson: '{}',
        },
    ];

    for (const section of homepageSections) {
        await prisma.homepageSection.upsert({
            where: { type: section.type },
            update: section,
            create: section,
        });
    }

    console.log('Seed complete.');
    console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
