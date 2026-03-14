import prisma from './prisma.js';
import { formatPost, includePostRelations } from './posts.js';
import { formatPublicProject, isPublicPostReady, isPublicProjectReady } from './publicPresentation.js';

export interface HomepageSectionConfig {
    postIds?: number[];
    projectIds?: number[];
    limit?: number;
    autoFill?: boolean;
    hidden?: boolean;
}

const defaultSections = [
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
        configJson: JSON.stringify({}),
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
        configJson: JSON.stringify({ autoFill: true, limit: 4 }),
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
        configJson: JSON.stringify({}),
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
        configJson: JSON.stringify({ autoFill: true, limit: 3 }),
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
        configJson: JSON.stringify({}),
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
        configJson: JSON.stringify({}),
    },
    {
        type: 'utility_weather',
        enabled: true,
        sortOrder: 70,
        sourceType: 'manual',
        eyebrow: '在线天气信号',
        title: '把实时天气降级为辅助信息，而不是首页主叙事',
        description: '可保留现场感，但不再抢占主内容层级。',
        ctaLabel: null,
        ctaHref: null,
        configJson: JSON.stringify({}),
    },
];

function safeParseConfig(value: string | null): HomepageSectionConfig {
    if (!value) return {};
    try {
        return JSON.parse(value) as HomepageSectionConfig;
    } catch {
        return {};
    }
}

export async function ensureHomepageSections() {
    const count = await prisma.homepageSection.count();
    if (count > 0) return;

    await prisma.homepageSection.createMany({
        data: defaultSections,
    });
}

async function loadSelectedPosts(config: HomepageSectionConfig) {
    const limit = Math.max(1, Math.min(8, config.limit || 4));

    if (config.postIds?.length) {
        const selectedIds = [...new Set(config.postIds)];
        const selectedPosts = await prisma.post.findMany({
            where: { id: { in: selectedIds }, published: true },
            include: includePostRelations,
        });

        const orderedSelected = selectedIds
            .map((id) => selectedPosts.find((post) => post.id === id))
            .filter(Boolean)
            .map((post) => formatPost(post!))
            .filter((post) => isPublicPostReady(post));

        if (!config.autoFill || orderedSelected.length >= limit) {
            return orderedSelected.slice(0, limit);
        }

        const needed = Math.max(0, limit - orderedSelected.length);
        const fallback = await prisma.post.findMany({
            where: { published: true, id: { notIn: selectedIds } },
            include: includePostRelations,
            orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
            take: Math.min(12, needed * 3),
        });

        const topups = fallback
            .map((post) => formatPost(post))
            .filter((post) => isPublicPostReady(post))
            .slice(0, needed);

        return [...orderedSelected, ...topups].slice(0, limit);
    }

    const posts = await prisma.post.findMany({
        where: { published: true, ...(config.autoFill ? {} : { featured: true }) },
        include: includePostRelations,
        orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: limit,
    });

    return posts.map((post) => formatPost(post)).filter((post) => isPublicPostReady(post));
}

async function loadSelectedProjects(config: HomepageSectionConfig) {
    const limit = Math.max(1, Math.min(6, config.limit || 3));

    if (config.projectIds?.length) {
        const selectedIds = [...new Set(config.projectIds)];
        const selectedProjects = await prisma.project.findMany({
            where: { id: { in: selectedIds }, published: true },
        });

        const orderedSelected = selectedIds
            .map((id) => selectedProjects.find((project) => project.id === id))
            .filter(Boolean)
            .map((project) => formatPublicProject(project!))
            .filter((project) => isPublicProjectReady(project));

        if (!config.autoFill || orderedSelected.length >= limit) {
            return orderedSelected.slice(0, limit);
        }

        const needed = Math.max(0, limit - orderedSelected.length);
        const fallback = await prisma.project.findMany({
            where: { id: { notIn: selectedIds }, published: true },
            orderBy: [{ featured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
            take: Math.min(12, needed * 3),
        });

        const topups = fallback
            .map((project) => formatPublicProject(project))
            .filter((project) => isPublicProjectReady(project))
            .slice(0, needed);

        return [...orderedSelected, ...topups].slice(0, limit);
    }

    const projects = await prisma.project.findMany({
        where: { published: true },
        orderBy: [{ featured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
        take: limit,
    });

    return projects.map((project) => formatPublicProject(project)).filter((project) => isPublicProjectReady(project));
}

export async function getPublicHomepage() {
    await ensureHomepageSections();

    const sections = await prisma.homepageSection.findMany({
        where: { enabled: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const resolved = await Promise.all(
        sections.map(async (section) => {
            const config = safeParseConfig(section.configJson);
            let items: unknown[] = [];

            if (section.type === 'featured_posts') {
                items = await loadSelectedPosts(config);
            }

            if (section.type === 'featured_projects') {
                items = await loadSelectedProjects(config);
            }

            return {
                ...section,
                config,
                items,
            };
        }),
    );

    return resolved;
}

export async function getHomepageAdminState() {
    await ensureHomepageSections();
    return prisma.homepageSection.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
}

export async function replaceHomepageSections(
    sections: Array<{
        type: string;
        enabled: boolean;
        sortOrder: number;
        sourceType: string;
        eyebrow?: string | null;
        title?: string | null;
        description?: string | null;
        ctaLabel?: string | null;
        ctaHref?: string | null;
        configJson?: string | null;
    }>,
) {
    await prisma.$transaction(async (tx) => {
        const existing = await tx.homepageSection.findMany();
        const incomingTypes = new Set(sections.map((section) => section.type));

        for (const row of existing) {
            if (!incomingTypes.has(row.type)) {
                await tx.homepageSection.delete({ where: { id: row.id } });
            }
        }

        for (const section of sections) {
            await tx.homepageSection.upsert({
                where: { type: section.type },
                update: section,
                create: section,
            });
        }
    });

    return getHomepageAdminState();
}
