import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 创建标签
    const tagJS = await prisma.tag.upsert({ where: { slug: 'javascript' }, update: {}, create: { name: 'JavaScript', slug: 'javascript' } });
    const tagTS = await prisma.tag.upsert({ where: { slug: 'typescript' }, update: {}, create: { name: 'TypeScript', slug: 'typescript' } });
    const tagReact = await prisma.tag.upsert({ where: { slug: 'react' }, update: {}, create: { name: 'React', slug: 'react' } });
    const tagAI = await prisma.tag.upsert({ where: { slug: 'ai' }, update: {}, create: { name: 'AI', slug: 'ai' } });
    const tagVibe = await prisma.tag.upsert({ where: { slug: 'vibe-coding' }, update: {}, create: { name: 'Vibe Coding', slug: 'vibe-coding' } });

    // 创建博客文章
    await prisma.post.upsert({
        where: { slug: 'hello-world' },
        update: {},
        create: {
            title: '你好，世界！欢迎来到我的博客',
            slug: 'hello-world',
            excerpt: '这是我的第一篇博客文章，聊聊为什么决定搭建这个博客，以及我对技术写作的一些想法。',
            content: `# 你好，世界！

欢迎来到我的个人博客！🎉

## 为什么要写博客？

作为一个热爱技术的开发者，我一直想有一个属于自己的空间来分享：

- 📝 **技术笔记** — 记录开发中的踩坑和解决方案
- 🛠️ **项目分享** — 展示我的 Vibe Coding 作品
- 💡 **思考** — 对技术趋势的观察和思考

## 技术栈

这个博客本身就是一个 Vibe Coding 项目，使用了：

\`\`\`
前端: React + TypeScript + Vite
后端: Express.js + SQLite + Prisma
设计: 毛玻璃效果 + Bento Grid + 粒子动画
\`\`\`

## 接下来

我会持续更新这个博客，分享更多有趣的内容。敬请期待！`,
            published: true,
            tags: { connect: [{ id: tagJS.id }, { id: tagVibe.id }] },
        },
    });

    await prisma.post.upsert({
        where: { slug: 'react-hooks-deep-dive' },
        update: {},
        create: {
            title: 'React Hooks 深入浅出',
            slug: 'react-hooks-deep-dive',
            excerpt: '深入理解 React Hooks 的工作原理，从 useState 到自定义 Hooks，带你掌握函数式组件的精髓。',
            content: `# React Hooks 深入浅出

React Hooks 是现代 React 开发的基础。让我们从底层原理开始理解它们。

## useState 的秘密

\`\`\`typescript
const [count, setCount] = useState(0);
\`\`\`

看起来简单，但背后隐藏着很多细节：

1. **闭包陷阱** — 过期的 state 引用
2. **批量更新** — React 18 的自动批处理
3. **惰性初始化** — 使用函数作为初始值

## useEffect 的正确用法

\`\`\`typescript
useEffect(() => {
  const controller = new AbortController();
  
  fetchData(controller.signal);
  
  return () => controller.abort();
}, [dependency]);
\`\`\`

> ⚠️ 永远记得清理副作用！

## 自定义 Hooks

自定义 Hooks 是最强大的抽象工具之一：

\`\`\`typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}
\`\`\`

掌握这些概念，你就能写出更优雅的 React 代码！`,
            published: true,
            tags: { connect: [{ id: tagReact.id }, { id: tagTS.id }] },
        },
    });

    await prisma.post.upsert({
        where: { slug: 'ai-coding-future' },
        update: {},
        create: {
            title: 'AI 辅助编程的未来：Vibe Coding 的实践与思考',
            slug: 'ai-coding-future',
            excerpt: 'AI 正在改变我们编程的方式。分享我在 Vibe Coding 过程中的实践经验和对未来的展望。',
            content: `# AI 辅助编程的未来

## 什么是 Vibe Coding？

Vibe Coding 是一种全新的编程范式——你描述你想要什么，AI 帮你实现。

## 我的实践

在过去几个月里，我用 AI 辅助完成了多个项目：

| 项目 | 描述 | AI 参与度 |
|------|------|-----------|
| 个人博客 | 全栈 Web 应用 | 80% |
| 数据可视化工具 | D3.js 仪表板 | 60% |
| CLI 工具 | Node.js 命令行 | 70% |

## 关键感悟

1. **AI 是放大器** — 它放大你现有的能力
2. **理解比生成更重要** — 你需要理解 AI 生成的代码
3. **迭代是关键** — 好的提示需要反复打磨

## 展望

AI 不会替代程序员，但会替代那些不愿使用 AI 的程序员。`,
            published: true,
            tags: { connect: [{ id: tagAI.id }, { id: tagVibe.id }] },
        },
    });

    // 创建项目
    await prisma.project.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'DSL Blog',
            description: '高级个人博客系统，采用前后端分离架构，拥有惊艳的 UI 设计和流畅的交互体验。',
            techStack: 'React, TypeScript, Vite, Express.js, SQLite, Prisma',
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

    await prisma.project.upsert({
        where: { id: 3 },
        update: {},
        create: {
            name: '数据仪表板',
            description: '实时数据可视化仪表板，支持多种图表类型和自定义布局。',
            techStack: 'React, D3.js, WebSocket, Node.js',
            featured: false,
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
