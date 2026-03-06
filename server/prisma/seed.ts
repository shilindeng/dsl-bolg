import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@dsl.blog' },
        update: {},
        create: {
            email: 'admin@dsl.blog',
            password: hashedPassword,
            name: 'DSL Admin',
            role: 'admin',
        },
    });
    console.log(`✅ Admin user created: ${admin.email}`);

    // 2. Create categories
    const categories = ['技术', '生活', '随笔'];
    for (const name of categories) {
        await prisma.category.upsert({
            where: { slug: name },
            update: {},
            create: { name, slug: name },
        });
    }
    console.log('✅ Categories created');

    // 3. Create tags
    const tagNames = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'AI', 'Vibe Coding'];
    const tags = [];
    for (const name of tagNames) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const tag = await prisma.tag.upsert({
            where: { slug },
            update: {},
            create: { name, slug },
        });
        tags.push(tag);
    }
    console.log('✅ Tags created');

    // 4. Create sample posts
    const techCategory = await prisma.category.findUnique({ where: { slug: '技术' } });

    const samplePosts = [
        {
            title: '用 Vite + React 打造赛博朋克个人博客',
            slug: 'vite-react-cyberpunk-blog',
            excerpt: '从零开始构建一个充满赛博朋克风格的个人博客系统，使用最新的 Vite 6 和 React 19。',
            content: `# 用 Vite + React 打造赛博朋克个人博客

## 为什么选择赛博朋克风格？

赛博朋克不仅仅是一种视觉风格，更是一种关于技术与人性交织的哲学思考。在这个 AI 快速发展的时代，用赛博朋克风格来装饰我们的数字空间，似乎再合适不过了。

## 技术栈选择

- **Vite 6** — 闪电般的构建速度
- **React 19** — 最新的前端框架
- **Express** — 轻量级后端
- **SQLite + Prisma** — 零配置数据库

## 核心特性

### 粒子背景
使用 Canvas 绘制动态粒子效果，营造出数字空间的氛围。

### CRT 显示器效果
通过 CSS 覆盖层模拟老式 CRT 显示器的扫描线效果。

### 故障文字 (Glitch Effect)
标题采用故障艺术风格，展现数字世界的不稳定性。

\`\`\`javascript
// 示例：粒子动画
function animate() {
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
    });
    requestAnimationFrame(animate);
}
\`\`\`

## 总结

构建一个有个性的博客，不仅是技术练习，更是自我表达的一种方式。`,
            published: true,
            categoryId: techCategory?.id,
            tagSlugs: ['react', 'javascript', 'vibe-coding'],
        },
        {
            title: 'Prisma ORM：现代 Node.js 数据库开发的最佳选择',
            slug: 'prisma-orm-modern-nodejs',
            excerpt: '深入了解 Prisma ORM 如何简化数据库操作，提升开发效率。',
            content: `# Prisma ORM：现代 Node.js 数据库开发的最佳选择

## 什么是 Prisma？

Prisma 是一个开源的下一代 Node.js 和 TypeScript ORM，它使得数据库访问变得简单、安全且类型安全。

## 核心优势

### 1. 类型安全
Prisma 自动生成 TypeScript 类型定义，让你在编译时就能捕获数据库相关的错误。

### 2. 声明式 Schema
\`\`\`prisma
model Post {
    id      Int    @id @default(autoincrement())
    title   String
    content String
    tags    Tag[]
}
\`\`\`

### 3. 强大的查询 API
\`\`\`typescript
const posts = await prisma.post.findMany({
    where: { published: true },
    include: { tags: true },
    orderBy: { createdAt: 'desc' },
});
\`\`\`

## 总结

Prisma 让数据库操作变得像写普通 JavaScript 一样简单。`,
            published: true,
            categoryId: techCategory?.id,
            tagSlugs: ['typescript', 'nodejs'],
        },
        {
            title: 'AI 辅助编程：Vibe Coding 的崛起',
            slug: 'ai-vibe-coding-rise',
            excerpt: '探索 AI 如何改变我们编写代码的方式，以及 Vibe Coding 这种新范式的意义。',
            content: `# AI 辅助编程：Vibe Coding 的崛起

## 什么是 Vibe Coding？

Vibe Coding 是一种利用 AI 辅助工具，通过自然语言描述来生成和迭代代码的编程方式。它不是要取代程序员，而是让编程变得更加直觉化和高效。

## 为什么 Vibe Coding 正在改变一切

1. **降低门槛** — 让更多人能参与软件开发
2. **提升效率** — 将重复性工作交给 AI
3. **激发创造力** — 更多时间用于思考架构和用户体验

## 我的 Vibe Coding 实践

这个博客本身就是 Vibe Coding 的产物。从设计到实现，AI 在每个环节都发挥了重要作用。

> "未来的编程不是人 vs 机器，而是人 + 机器。"

## 展望

AI 辅助编程还在早期阶段，但它的潜力是巨大的。让我们拭目以待。`,
            published: true,
            categoryId: techCategory?.id,
            tagSlugs: ['ai', 'vibe-coding'],
        },
    ];

    for (const postData of samplePosts) {
        const { tagSlugs, ...data } = postData;
        const existing = await prisma.post.findUnique({ where: { slug: data.slug } });
        if (existing) continue;

        const post = await prisma.post.create({
            data: {
                ...data,
                meta: { create: { readTime: Math.ceil(data.content.length / 500) } },
            },
        });

        // Link tags
        for (const slug of tagSlugs) {
            const tag = tags.find(t => t.slug === slug);
            if (tag) {
                await prisma.postTag.create({ data: { postId: post.id, tagId: tag.id } });
            }
        }
    }
    console.log('✅ Sample posts created');

    // 5. Create a sample project
    await prisma.project.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'DSL Blog',
            description: '赛博朋克风格个人博客系统，前后端分离架构',
            techStack: 'React, TypeScript, Express, Prisma, SQLite',
            repoUrl: 'https://github.com/dsl/blog',
            featured: true,
        },
    });
    console.log('✅ Sample project created');

    console.log('\n🎉 Seed complete!');
    console.log('📧 Admin login: admin@dsl.blog / admin123');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
