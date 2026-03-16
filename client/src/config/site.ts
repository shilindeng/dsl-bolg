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

export interface BrandProofItem {
    value: string;
    label: string;
    note: string;
    icon: SiteIconName;
}

export interface CapabilityCard {
    title: string;
    description: string;
    icon: SiteIconName;
}

export interface CollaborationTrack {
    title: string;
    description: string;
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
        positioning: '个人品牌站、内容系统与 AI 工作流的设计者',
        summary: '用研究的方式拆解 AI 时代的信息差，把结论沉淀成可复用的方法、工具与实验笔记。',
        bio: '我在常州做独立开发与产品实验，长期关注 AI 工作流、前端体验、信息结构与内容资产化。这里记录我如何把碎片信息变成可检索的结论库，把信息差转成能被复用的判断、流程和代码。',
        manifesto: '我不把博客当作展示墙，而把它当成一套长期经营的内容操作系统：前台负责建立信任，后台负责积累结构，文章与项目共同证明判断力与交付能力。',
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
            label: '归档',
            to: '/archive',
            icon: 'calendar',
            description: '按年份与月份浏览公开文章索引',
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
            title: '作者定位先于页面风格',
            description: '先讲清你是谁、服务什么问题，再谈视觉、排版和氛围。',
        },
        {
            title: '内容与系统一起构成专业感',
            description: '文章建立判断力，项目证明落地能力，页面把两者组织成可信入口。',
        },
        {
            title: '合作入口必须明确',
            description: '读者看完首页后，应立即知道是否适合联系，以及为什么找你。',
        },
    ],
    brandProofs: [
        {
            value: '长期写作',
            label: '研究与判断持续公开',
            note: '不靠一次性包装，而靠持续可回查的公开输出建立信任。',
            icon: 'book-open',
        },
        {
            value: '前后端落地',
            label: '从定位到交付一条线闭环',
            note: '既做内容结构，也做界面、系统实现和上线运维。',
            icon: 'grid',
        },
        {
            value: 'AI 工作流',
            label: '把自动化接进真实流程',
            note: '不是只写概念，而是把采集、整理、生成、发布真正跑通。',
            icon: 'spark',
        },
    ] satisfies BrandProofItem[],
    homeCapabilityCards: [
        {
            title: '个人品牌与内容系统',
            description: '把博客、专栏、项目页与 About 页组织成一套能建立专业信任的公开入口。',
            icon: 'user',
        },
        {
            title: '前端体验与信息架构',
            description: '用编辑部式排版、归档与检索结构，提升阅读效率与站点气质。',
            icon: 'pen',
        },
        {
            title: 'AI 工作流产品化',
            description: '把 Agent、自动化、内容发布与知识沉淀连接成可持续的工作流。',
            icon: 'code',
        },
    ] satisfies CapabilityCard[],
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
    collaborationTracks: [
        {
            title: '品牌站与公开形象升级',
            description: '适合已经有内容和项目，但首页、About、博客结构还不能支撑专业信任的个人品牌站。',
        },
        {
            title: '内容系统与信息架构梳理',
            description: '适合文章越来越多，但缺少归档结构、分类方法、索引入口与长期维护机制的站点。',
        },
        {
            title: 'AI 工作流与自动化接入',
            description: '适合想把采集、整理、生成、发布接成闭环，而不是停留在零散工具尝试的团队或个体。',
        },
    ] satisfies CollaborationTrack[],
    collaborationFit: [
        '已经有方向、内容或项目资产，正在准备做系统升级。',
        '希望把个人博客从“展示页”升级成“可信的专业入口”。',
        '愿意围绕长期主义、结构化内容与真实交付建立品牌。',
    ],
    collaborationNotFit: [
        '只想做一个短期流量页，不关心内容质量与长期沉淀。',
        '没有明确目标，只希望靠视觉包装直接解决定位问题。',
        '需要的是大团队式全案外包，而不是清晰聚焦的结构升级。',
    ],
};
