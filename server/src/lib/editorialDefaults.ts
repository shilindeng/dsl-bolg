export interface EditorialSeriesBlueprint {
    title: string;
    slug: string;
    summary: string;
    description: string;
    coverImage?: string | null;
    status: 'active' | 'complete' | 'paused';
    order: number;
}

export interface EditorialSeriesAssignment {
    postSlug: string;
    seriesSlug: string;
    seriesOrder: number;
}

export interface EditorialHomepageSectionBlueprint {
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
}

export interface EditorialProjectPatch {
    name: string;
    slug: string;
    headline?: string | null;
    summary: string;
    description: string;
    techStack: string;
    status?: string | null;
    period?: string | null;
    role?: string | null;
    liveUrl?: string | null;
    repoUrl?: string | null;
    featured?: boolean;
    order?: number;
}

export const editorialSeriesBlueprints: EditorialSeriesBlueprint[] = [
    {
        title: '把博客做成长期经营的作品系统',
        slug: 'blog-as-public-system',
        summary: '从结构、视觉到发布链路，把个人写作与项目沉淀做成可复利的公开资产。',
        description: '这个专栏聚焦“把博客当作作品系统”这件事：信息架构、视觉语言、内容关系、运营节奏，以及能长期跑起来的工程实践。',
        status: 'active',
        order: 1,
    },
];

export const editorialSeriesAssignments: EditorialSeriesAssignment[] = [
    {
        postSlug: 'build-a-professional-personal-blog',
        seriesSlug: 'blog-as-public-system',
        seriesOrder: 1,
    },
    {
        postSlug: 'premium-cyber-editorial-ui',
        seriesSlug: 'blog-as-public-system',
        seriesOrder: 2,
    },
    {
        postSlug: 'cloudflare-pages-and-api-server',
        seriesSlug: 'blog-as-public-system',
        seriesOrder: 3,
    },
];

export const editorialHomepageSections: EditorialHomepageSectionBlueprint[] = [
    {
        type: 'hero',
        enabled: true,
        sortOrder: 10,
        sourceType: 'manual',
        eyebrow: 'AI 信息差研究与实验笔记',
        title: '把信息差变成可复用的结论库。',
        description: '不追热点刺激，专注把资讯、观点和现象拆解成可验证的判断与工作流，并沉淀为可检索的长期资产。',
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
        title: '先看代表性结论与方法',
        description: '每一篇都尽量可复用、可验证、可执行：结构化写作，直接对着问题产出。',
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
        title: '按主题、标签与关键词进入研究档案',
        description: '把阅读当作检索：先定位问题，再决定投入时间。',
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
        description: '文章给结论，项目给证据：把方法跑在真实系统里。',
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
        title: '如果你也在做 AI 工作流、信息结构或长期写作系统，我们可以交流。',
        description: '适合交流的方向包括：AI 研究型写作、知识归档与检索、设计系统、自动化发布，以及把创作链路真正上线的工程实践。',
        ctaLabel: '发送邮件',
        ctaHref: 'mailto:dsl741743548@gmail.com',
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
        eyebrow: '工作室天气',
        title: '把实时天气降级为辅助信息，而不是首页主叙事',
        description: '保留现场感，但明确它表达的是作者工作环境，而不是访客画像。',
        ctaLabel: null,
        ctaHref: null,
        configJson: '{}',
    },
];

export const editorialProjectPatches: EditorialProjectPatch[] = [
    {
        name: 'DSL Blog',
        slug: 'dsl-blog',
        headline: '内容系统 / 设计系统 / 发布链路',
        summary: '个人品牌博客系统，面向长期写作与项目沉淀。',
        description: '一个围绕技术写作、项目复盘与数字表达打造的专业博客。前端聚焦研究型 editorial 体验，后端保持稳定的内容管理、数据维护与正式部署能力。',
        techStack: 'React, TypeScript, Express, Prisma, Cloudflare',
        status: 'Live',
        period: '2025 - now',
        role: 'Product / Design / Frontend / Backend',
        liveUrl: 'https://dsl.blog',
        repoUrl: 'https://github.com/dsl/blog',
        featured: true,
        order: 1,
    },
    {
        name: 'Signal Archive',
        slug: 'signal-archive',
        headline: '信息结构 / 检索体验',
        summary: '面向内容创作者的轻量知识归档实验。',
        description: '一个把长文、卡片笔记和主题索引串联在一起的内容实验项目，重点探索信息结构、检索体验和长期内容沉淀的组织方式。',
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
        description: '为个人内容站设计的后台控制台，提供内容发布、评论审核、状态追踪和部署检查能力，重点验证内容系统的运营闭环。',
        techStack: 'TypeScript, Node.js, Prisma',
        status: 'Internal',
        period: '2026',
        role: 'Product / Backend / Dashboard',
        featured: false,
        order: 3,
    },
];
