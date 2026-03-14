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

export interface HomepageHealth {
    featuredPostReady: boolean;
    featuredProjectReady: boolean;
    featuredPostFallbackUsed: boolean;
    featuredProjectFallbackUsed: boolean;
    warnings: string[];
}

const defaultSections = [
    {
        type: 'hero',
        enabled: true,
        sortOrder: 10,
        sourceType: 'manual',
        eyebrow: 'Long-form personal publishing system',
        title: 'Turn the blog into a durable content operating system.',
        description: 'The homepage should not become a hollow hero shell. It needs stable representative content, clear archive entry points, and visible author intent.',
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
        title: '先看到最能代表判断力与方法论的内容',
        description: '首页首屏必须有一篇能代表站点价值的文章，不能依赖人工每次手动维护。',
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
        description: '把博客当作可检索的研究库，而不是时间线。',
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
        title: '项目承担方法论之外的落地证明',
        description: '首屏项目位必须始终有内容，避免 Hero 右侧出现空壳卡片。',
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
        title: '如果你也在做长期主义内容系统、独立项目或 AI 工作流，可以聊聊。',
        description: '合作入口要稳定存在，但不应抢占首屏代表内容的位置。',
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
        description: '新长文、项目复盘与工作流迭代从这里发出。',
        ctaLabel: '前往订阅',
        ctaHref: '/newsletter',
        configJson: JSON.stringify({}),
    },
    {
        type: 'utility_weather',
        enabled: true,
        sortOrder: 70,
        sourceType: 'manual',
        eyebrow: 'Atmosphere',
        title: 'Weather remains auxiliary, not a hero section replacement.',
        description: '现场感可以保留，但不能影响首页主叙事稳定性。',
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

async function fetchFallbackPosts(limit: number, excludedIds: number[] = []) {
    const fallback = await prisma.post.findMany({
        where: {
            published: true,
            ...(excludedIds.length ? { id: { notIn: excludedIds } } : {}),
        },
        include: includePostRelations,
        orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: Math.min(12, limit * 3),
    });

    return fallback
        .map((post) => formatPost(post))
        .filter((post) => isPublicPostReady(post))
        .slice(0, limit);
}

async function fetchFallbackProjects(limit: number, excludedIds: number[] = []) {
    const fallback = await prisma.project.findMany({
        where: excludedIds.length ? { id: { notIn: excludedIds } } : undefined,
        orderBy: [{ featured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
        take: Math.min(12, limit * 3),
    });

    return fallback
        .map((project) => formatPublicProject(project))
        .filter((project) => isPublicProjectReady(project))
        .slice(0, limit);
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
    const selectedIds = config.postIds?.length ? [...new Set(config.postIds)] : [];
    let items: Array<ReturnType<typeof formatPost> & { id: number }> = [];
    let fallbackUsed = false;

    if (selectedIds.length) {
        const selectedPosts = await prisma.post.findMany({
            where: { id: { in: selectedIds }, published: true },
            include: includePostRelations,
        });

        items = selectedIds
            .map((id) => selectedPosts.find((post) => post.id === id))
            .filter(Boolean)
            .map((post) => formatPost(post!))
            .filter((post) => isPublicPostReady(post));
    } else if (!config.autoFill) {
        const featuredOnly = await prisma.post.findMany({
            where: { published: true, featured: true },
            include: includePostRelations,
            orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
            take: limit,
        });

        items = featuredOnly
            .map((post) => formatPost(post))
            .filter((post) => isPublicPostReady(post));
    }

    if ((config.autoFill || !items.length) && items.length < limit) {
        const topups = await fetchFallbackPosts(limit - items.length, items.map((item) => item.id));
        if (topups.length) {
            fallbackUsed = true;
            items = [...items, ...topups];
        }
    }

    return {
        items: items.slice(0, limit),
        fallbackUsed,
    };
}

async function loadSelectedProjects(config: HomepageSectionConfig) {
    const limit = Math.max(1, Math.min(6, config.limit || 3));
    const selectedIds = config.projectIds?.length ? [...new Set(config.projectIds)] : [];
    let items: Array<ReturnType<typeof formatPublicProject> & { id: number }> = [];
    let fallbackUsed = false;

    if (selectedIds.length) {
        const selectedProjects = await prisma.project.findMany({
            where: { id: { in: selectedIds } },
        });

        items = selectedIds
            .map((id) => selectedProjects.find((project) => project.id === id))
            .filter(Boolean)
            .map((project) => formatPublicProject(project!))
            .filter((project) => isPublicProjectReady(project));
    }

    if ((config.autoFill || !items.length) && items.length < limit) {
        const topups = await fetchFallbackProjects(limit - items.length, items.map((item) => item.id));
        if (topups.length) {
            fallbackUsed = true;
            items = [...items, ...topups];
        }
    }

    return {
        items: items.slice(0, limit),
        fallbackUsed,
    };
}

function buildHomepageHealth(resolvedSections: Array<{ type: string; enabled: boolean; items?: unknown[] }>, flags: {
    featuredPostFallbackUsed: boolean;
    featuredProjectFallbackUsed: boolean;
}): HomepageHealth {
    const featuredPosts = resolvedSections.find((section) => section.type === 'featured_posts');
    const featuredProjects = resolvedSections.find((section) => section.type === 'featured_projects');
    const warnings: string[] = [];

    const featuredPostReady = Boolean(featuredPosts?.enabled && featuredPosts.items?.length);
    const featuredProjectReady = Boolean(featuredProjects?.enabled && featuredProjects.items?.length);

    if (!featuredPostReady) {
        warnings.push('featured_posts_missing');
    }

    if (!featuredProjectReady) {
        warnings.push('featured_projects_missing');
    }

    if (flags.featuredPostFallbackUsed) {
        warnings.push('featured_posts_using_fallback');
    }

    if (flags.featuredProjectFallbackUsed) {
        warnings.push('featured_projects_using_fallback');
    }

    const missingCoreSections = ['hero', 'archive_entry', 'newsletter_cta']
        .filter((type) => !resolvedSections.find((section) => section.type === type && section.enabled))
        .map((type) => `core_section_disabled:${type}`);

    return {
        featuredPostReady,
        featuredProjectReady,
        featuredPostFallbackUsed: flags.featuredPostFallbackUsed,
        featuredProjectFallbackUsed: flags.featuredProjectFallbackUsed,
        warnings: [...warnings, ...missingCoreSections],
    };
}

export async function getPublicHomepage() {
    await ensureHomepageSections();

    const sections = await prisma.homepageSection.findMany({
        where: { enabled: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    let featuredPostFallbackUsed = false;
    let featuredProjectFallbackUsed = false;

    const resolved = await Promise.all(
        sections.map(async (section) => {
            const config = safeParseConfig(section.configJson);
            let items: unknown[] = [];

            if (section.type === 'featured_posts') {
                const result = await loadSelectedPosts(config);
                items = result.items;
                featuredPostFallbackUsed = featuredPostFallbackUsed || result.fallbackUsed;
            }

            if (section.type === 'featured_projects') {
                const result = await loadSelectedProjects(config);
                items = result.items;
                featuredProjectFallbackUsed = featuredProjectFallbackUsed || result.fallbackUsed;
            }

            return {
                ...section,
                config,
                items,
            };
        }),
    );

    return {
        sections: resolved,
        health: buildHomepageHealth(resolved, {
            featuredPostFallbackUsed,
            featuredProjectFallbackUsed,
        }),
    };
}

export async function getHomepageAdminState() {
    await ensureHomepageSections();
    const sections = await prisma.homepageSection.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    const preview = await getPublicHomepage();

    return {
        sections,
        health: preview.health,
    };
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
