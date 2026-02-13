
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('🌱 开始播种数据...');

    // Helper for upserting by slug
    async function upsert(table, matchCol, matchVal, data) {
        // Try select
        const { data: existing } = await supabaseAdmin.from(table).select('id').eq(matchCol, matchVal).single();
        if (existing) {
            const { data: updated, error } = await supabaseAdmin.from(table).update(data).eq('id', existing.id).select().single();
            if (error) {
                console.error(`Error updating ${table}:`, error);
                throw error;
            }
            return updated;
        } else {
            const { data: created, error } = await supabaseAdmin.from(table).insert(data).select().single();
            if (error) {
                console.error(`Error inserting ${table}:`, error);
                throw error;
            }
            return created;
        }
    }

    try {
        // 1. 创建分类
        console.log('Creating Categories...');
        const catTech = await upsert('Category', 'slug', 'tech', { name: '技术', slug: 'tech' });
        const catLife = await upsert('Category', 'slug', 'life', { name: '生活', slug: 'life' });
        const catAI = await upsert('Category', 'slug', 'ai-research', { name: 'AI 研究', slug: 'ai-research' });

        // 2. 创建标签
        console.log('Creating Tags...');
        const tagsMap = {};
        const tagNames = ['javascript', 'typescript', 'react', 'ai', 'vibe-coding'];
        const tagRealNames = ['JavaScript', 'TypeScript', 'React', 'AI', 'Vibe Coding'];

        for (let i = 0; i < tagNames.length; i++) {
            const slug = tagNames[i];
            const name = tagRealNames[i];
            tagsMap[slug] = await upsert('Tag', 'slug', slug, { name, slug });
        }

        // 3. 创建文章
        console.log('Creating Posts...');
        const postsData = [
            {
                title: '你好，世界！欢迎来到我的博客',
                slug: 'hello-world',
                excerpt: '这是我的第一篇博客文章，聊聊为什么决定搭建这个博客，以及我对技术写作的一些想法。',
                content: `# 你好，世界！\n\n欢迎来到我的个人博客！🎉\n\n## 为什么要写博客？\n\n作为一个热爱技术的开发者，我一直想有一个属于自己的空间来分享：\n\n- 📝 **技术笔记** — 记录开发中的踩坑和解决方案\n- 🛠️ **项目分享** — 展示我的 Vibe Coding 作品\n- 💡 **思考** — 对技术趋势的观察和思考\n\n## 技术栈\n\n这个博客本身就是一个 Vibe Coding 项目，使用了：\n\n\`\`\`\n前端: React + TypeScript + Vite\n后端: Express.js + PostgreSQL + Supabase\n设计: 毛玻璃效果 + Bento Grid + 粒子动画\n\`\`\`\n\n## 接下来\n\n我会持续更新这个博客，分享更多有趣的内容。敬请期待！`,
                published: true,
                categoryId: catLife.id,
                tags: ['javascript', 'vibe-coding']
            },
            {
                title: 'React Hooks 深入浅出',
                slug: 'react-hooks-deep-dive',
                excerpt: '深入理解 React Hooks 的工作原理，从 useState 到自定义 Hooks，带你掌握函数式组件的精髓。',
                content: `# React Hooks 深入浅出\n\nReact Hooks 是现代 React 开发的基础。让我们从底层原理开始理解它们。\n\n## useState 的秘密\n\n\`\`\`typescript\nconst [count, setCount] = useState(0);\n\`\`\`\n\n看起来简单，但背后隐藏着很多细节：\n\n1. **闭包陷阱** — 过期的 state 引用\n2. **批量更新** — React 18 的自动批处理\n3. **惰性初始化** — 使用函数作为初始值`,
                published: true,
                categoryId: catTech.id,
                tags: ['react', 'typescript']
            },
            {
                title: 'AI 辅助编程的未来：Vibe Coding 的实践与思考',
                slug: 'ai-coding-future',
                excerpt: 'AI 正在改变我们编程的方式。分享我在 Vibe Coding 过程中的实践经验和对未来的展望。',
                content: `# AI 辅助编程的未来\n\n## 什么是 Vibe Coding？\n\nVibe Coding 是一种全新的编程范式——你描述你想要什么，AI 帮你实现。\n\n## 我的实践\n\n在过去几个月里，我用 AI 辅助完成了多个项目：\n\n| 项目 | 描述 | AI 参与度 |\n|------|------|-----------|\n| 个人博客 | 全栈 Web 应用 | 80% |\n| 数据可视化工具 | D3.js 仪表板 | 60% |\n| CLI 工具 | Node.js 命令行 | 70% |`,
                published: true,
                categoryId: catAI.id,
                tags: ['ai', 'vibe-coding']
            }
        ];

        for (const p of postsData) {
            const { tags, ...postData } = p;

            // Add timestamps
            const now = new Date().toISOString();
            const dataToInsert = {
                ...postData,
                updatedAt: now,
            };

            const post = await upsert('Post', 'slug', postData.slug, dataToInsert);

            // PostMeta
            await upsert('PostMeta', 'postId', post.id, {
                postId: post.id,
                views: Math.floor(Math.random() * 1000) + 100,
                likes: Math.floor(Math.random() * 50) + 10,
                readTime: Math.ceil(postData.content.length / 500)
            });

            // Tags Link
            // Remove old links
            await supabaseAdmin.from('PostTags').delete().eq('postId', post.id);
            // Add new links
            for (const tSlug of tags) {
                const tagId = tagsMap[tSlug]?.id;
                if (tagId) {
                    await supabaseAdmin.from('PostTags').insert({ postId: post.id, tagId });
                    console.log(`Linked tag ${tSlug} to post ${post.title}`);
                }
            }

            console.log(`Created Post: ${post.title}`);
        }

        // 6. 创建项目
        console.log('Creating Projects...');

        async function upsertProject(data) {
            const { data: existing } = await supabaseAdmin.from('Project').select('id').eq('name', data.name).single();
            if (existing) {
                await supabaseAdmin.from('Project').update(data).eq('id', existing.id);
            } else {
                await supabaseAdmin.from('Project').insert(data);
            }
        }

        await upsertProject({
            name: 'DSL Blog',
            description: '高级个人博客系统，采用前后端分离架构，拥有惊艳的 UI 设计和流畅的交互体验。',
            techStack: 'React, TypeScript, Vite, Express.js, PostgreSQL, Supabase',
            liveUrl: 'https://blog.example.com',
            repoUrl: 'https://github.com/dsl/blog',
            featured: true,
        });

        await upsertProject({
            name: 'AI 内容生成器',
            description: '基于 AI 的社交媒体内容自动生成工具，支持图文并茂的帖子创作。',
            techStack: 'Next.js, OpenAI API, TailwindCSS',
            repoUrl: 'https://github.com/dsl/ai-content',
            featured: true,
        });

        console.log('✅ 种子数据已成功写入！');

    } catch (e) {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    }
}

main();
