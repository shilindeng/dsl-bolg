import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 开始播种数据...');

    // 1. 创建分类
    const catTech = await prisma.category.upsert({ where: { slug: 'tech' }, update: {}, create: { name: '技术', slug: 'tech' } });
    const catLife = await prisma.category.upsert({ where: { slug: 'life' }, update: {}, create: { name: '生活', slug: 'life' } });
    const catAI = await prisma.category.upsert({ where: { slug: 'ai-research' }, update: {}, create: { name: 'AI 研究', slug: 'ai-research' } });

    // 2. 创建标签
    const tagJS = await prisma.tag.upsert({ where: { slug: 'javascript' }, update: {}, create: { name: 'JavaScript', slug: 'javascript' } });
    const tagTS = await prisma.tag.upsert({ where: { slug: 'typescript' }, update: {}, create: { name: 'TypeScript', slug: 'typescript' } });
    const tagReact = await prisma.tag.upsert({ where: { slug: 'react' }, update: {}, create: { name: 'React', slug: 'react' } });
    const tagAI = await prisma.tag.upsert({ where: { slug: 'ai' }, update: {}, create: { name: 'AI', slug: 'ai' } });
    const tagVibe = await prisma.tag.upsert({ where: { slug: 'vibe-coding' }, update: {}, create: { name: 'Vibe Coding', slug: 'vibe-coding' } });

    // 3. 创建文章
    const post1 = await prisma.post.upsert({
        where: { slug: 'hello-world' },
        update: {},
        create: {
            title: '你好，世界！欢迎来到我的博客',
            slug: 'hello-world',
            excerpt: '这是我的第一篇博客文章，聊聊为什么决定搭建这个博客，以及我对技术写作的一些想法。',
            content: `# 你好，世界！\n\n欢迎来到我的个人博客！🎉\n\n## 为什么要写博客？\n\n作为一个热爱技术的开发者，我一直想有一个属于自己的空间来分享：\n\n- 📝 **技术笔记** — 记录开发中的踩坑和解决方案\n- 🛠️ **项目分享** — 展示我的 Vibe Coding 作品\n- 💡 **思考** — 对技术趋势的观察和思考\n\n## 技术栈\n\n这个博客本身就是一个 Vibe Coding 项目，使用了：\n\n\`\`\`\n前端: React + TypeScript + Vite\n后端: Express.js + PostgreSQL + Prisma\n设计: 毛玻璃效果 + Bento Grid + 粒子动画\n\`\`\`\n\n## 接下来\n\n我会持续更新这个博客，分享更多有趣的内容。敬请期待！`,
            published: true,
            categoryId: catLife.id,
            tags: { connect: [{ id: tagJS.id }, { id: tagVibe.id }] },
        },
    });

    const post2 = await prisma.post.upsert({
        where: { slug: 'react-hooks-deep-dive' },
        update: {},
        create: {
            title: 'React Hooks 深入浅出',
            slug: 'react-hooks-deep-dive',
            excerpt: '深入理解 React Hooks 的工作原理，从 useState 到自定义 Hooks，带你掌握函数式组件的精髓。',
            content: `# React Hooks 深入浅出\n\nReact Hooks 是现代 React 开发的基础。让我们从底层原理开始理解它们。\n\n## useState 的秘密\n\n\`\`\`typescript\nconst [count, setCount] = useState(0);\n\`\`\`\n\n看起来简单，但背后隐藏着很多细节：\n\n1. **闭包陷阱** — 过期的 state 引用\n2. **批量更新** — React 18 的自动批处理\n3. **惰性初始化** — 使用函数作为初始值`,
            published: true,
            categoryId: catTech.id,
            tags: { connect: [{ id: tagReact.id }, { id: tagTS.id }] },
        },
    });

    const post3 = await prisma.post.upsert({
        where: { slug: 'ai-coding-future' },
        update: {},
        create: {
            title: 'AI 辅助编程的未来：Vibe Coding 的实践与思考',
            slug: 'ai-coding-future',
            excerpt: 'AI 正在改变我们编程的方式。分享我在 Vibe Coding 过程中的实践经验和对未来的展望。',
            content: `# AI 辅助编程的未来\n\n## 什么是 Vibe Coding？\n\nVibe Coding 是一种全新的编程范式——你描述你想要什么，AI 帮你实现。\n\n## 我的实践\n\n在过去几个月里，我用 AI 辅助完成了多个项目：\n\n| 项目 | 描述 | AI 参与度 |\n|------|------|-----------|\n| 个人博客 | 全栈 Web 应用 | 80% |\n| 数据可视化工具 | D3.js 仪表板 | 60% |\n| CLI 工具 | Node.js 命令行 | 70% |`,
            published: true,
            categoryId: catAI.id,
            tags: { connect: [{ id: tagAI.id }, { id: tagVibe.id }] },
        },
    });

    // 4. 初始化 PostMeta (浏览量/点赞)
    for (const post of [post1, post2, post3]) {
        await prisma.postMeta.upsert({
            where: { postId: post.id },
            update: {},
            create: {
                postId: post.id,
                views: Math.floor(Math.random() * 1000) + 100,
                likes: Math.floor(Math.random() * 50) + 10,
                readTime: Math.ceil(post.content.length / 500),
            },
        });
    }

    // 5. 创建一些评论
    await prisma.comment.create({
        data: {
            content: '这篇文章写得真好！期待更多更新。',
            author: 'Alice',
            postId: post1.id,
            approved: true,
        },
    });

    await prisma.comment.create({
        data: {
            content: 'React Hooks 确实改变了前端开发的范式。',
            author: 'Bob',
            postId: post2.id,
            approved: true,
            replies: {
                create: {
                    content: '完全同意！特别是自定义 Hooks 极大地提高了代码复用性。',
                    author: 'Charlie',
                    postId: post2.id,
                    approved: true,
                },
            },
        },
    });

    // 6. 创建项目
    await prisma.project.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'DSL Blog',
            description: '高级个人博客系统，采用前后端分离架构，拥有惊艳的 UI 设计和流畅的交互体验。',
            techStack: 'React, TypeScript, Vite, Express.js, PostgreSQL, Supabase',
            liveUrl: 'https://blog.example.com',
            repoUrl: 'https://github.com/dsl/blog',
            featured: true,
        },
    });

    await prisma.project.upsert({
        where: { id: 2 },
        update: {},
        create: {
            name: 'AI 内容生成器',
            description: '基于 AI 的社交媒体内容自动生成工具，支持图文并茂的帖子创作。',
            techStack: 'Next.js, OpenAI API, TailwindCSS',
            repoUrl: 'https://github.com/dsl/ai-content',
            featured: true,
        },
    });

    console.log('✅ 种子数据已成功写入！');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
