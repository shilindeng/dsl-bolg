import type { SiteIconName } from '../components/SiteIcon';

const normalizeUrl = (value: string) => value.replace(/\/+$/, '');

export interface SiteLinkItem {
    label: string;
    to: string;
    icon: SiteIconName;
    description?: string;
}

export interface ExternalLinkItem {
    label: string;
    href: string;
    icon: SiteIconName;
    description?: string;
    external?: boolean;
    router?: boolean;
}

export const siteConfig = {
    name: 'AI信息差研究院',
    shortName: 'AI',
    title: 'AI信息差研究院 | 反者道之动，弱者道之用',
    description: '反者道之动，弱者道之用~',
    url: normalizeUrl(
        import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'),
    ),
    defaultOgImage: '/og-default.svg',
    email: 'dsl741743548@gmail.com',
    rssPath: '/rss.xml',
    author: {
        name: 'DSL',
        role: '独立开发者 / Vibe Coding',
        summary: '用研究的方式拆解 AI 时代的信息差，把结论沉淀成可复用的方法、工具与实验笔记。',
        bio: '我在常州做独立开发与产品实验，长期关注 AI 工作流、前端体验、信息结构与内容资产化。这里记录我如何把碎片信息变成可检索的结论库，把信息差转成能被复用的判断、流程和代码。',
        location: {
            city: '常州',
            country: '中国',
            latitude: 31.8107,
            longitude: 119.9737,
            timezone: 'Asia/Shanghai',
        },
    },
    navigation: [
        {
            label: '首页',
            to: '/',
            icon: 'home',
            description: '品牌定位、代表内容与行动入口',
        },
        {
            label: '博客',
            to: '/blog',
            icon: 'book-open',
            description: '方法、判断与长期写作归档',
        },
        {
            label: '专栏',
            to: '/series',
            icon: 'link',
            description: '按主题连续更新的写作系列',
        },
        {
            label: '项目',
            to: '/projects',
            icon: 'briefcase',
            description: '案例、系统与落地能力证明',
        },
        {
            label: '关于',
            to: '/about',
            icon: 'user',
            description: '作者、方法与合作方向',
        },
    ] satisfies SiteLinkItem[],
    socialLinks: [
        {
            label: 'X',
            href: 'https://x.com/shilin9527',
            icon: 'x',
            description: '关注与短更新',
            external: true,
        },
        {
            label: 'GitHub',
            href: 'https://github.com/shilindeng',
            icon: 'github',
            description: '代码与开源项目',
            external: true,
        },
        {
            label: '邮箱',
            href: 'mailto:dsl741743548@gmail.com',
            icon: 'mail',
            description: '直接发邮件联系',
            external: true,
        },
        {
            label: 'Newsletter',
            href: '/newsletter',
            icon: 'inbox',
            description: '订阅写作与产品更新',
            router: true,
        },
        {
            label: 'RSS',
            href: '/rss.xml',
            icon: 'rss',
            description: '通过 RSS 订阅',
            router: false,
        },
        {
            label: '站点地图',
            href: '/sitemap.xml',
            icon: 'grid',
            description: '查看公开页面索引',
            router: false,
        },
    ] satisfies ExternalLinkItem[],
    homeHighlights: [
        {
            title: '信息差不是焦虑，而是可研究的结构',
            description: '把资讯、观点和现象拆到可验证的层面，再写结论。',
        },
        {
            title: '结论要能复用，最好还能跑起来',
            description: '输出可执行的工作流、工具与代码，而不是只停留在观点。',
        },
        {
            title: '写作是研究的外显形式',
            description: '用结构、引用与案例，让读者快速建立信任与上下文。',
        },
    ],
    projectThemes: [
        {
            title: '研究与写作',
            description: '把主题做成系列，把结论做成索引，把经验做成可检索。',
            icon: 'pen',
        },
        {
            title: '界面与体验',
            description: '编辑部式排版与信息秩序，让阅读更像研究而不是刷流。',
            icon: 'grid',
        },
        {
            title: 'AI 工作流',
            description: '把 Agent 接进真实流程：采集，整理，生成，发布与复盘。',
            icon: 'spark',
        },
    ] as Array<{ title: string; description: string; icon: SiteIconName }>,
    principles: [
        '先做信息结构，再做视觉表达。',
        '每篇文章都要能回答一个具体问题，或提供一个可执行的方法。',
        '不追热点强刺激，只追长期可复用的结论与路径。',
    ],
    aboutCapabilities: [
        '用研究框架把碎片资讯拆成问题，假设，证据与结论。',
        '把 AI 工作流接入真实研发，写作与内容发布链路。',
        '把站点做成可持续维护的前端系统，而不是一次性页面。',
        '用清晰的界面与排版提高信息密度，同时保持阅读舒适。',
    ],
    currentFocus: [
        'AI 信息差主题的长期研究与系列化写作。',
        '面向检索与复用的归档结构与阅读体验。',
        '把工作流产品化：从采集到发布的自动化与可追踪。',
    ],
};
