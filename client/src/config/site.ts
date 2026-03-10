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
    name: 'DSL Blog',
    shortName: 'DSL',
    title: 'DSL Blog | 个人品牌技术博客',
    description: '围绕 AI 产品、前端体验、内容系统与长期项目经营展开的个人作品系统。',
    url: normalizeUrl(
        import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'),
    ),
    defaultOgImage: '/og-default.svg',
    email: 'hello@dsl.blog',
    rssPath: '/rss.xml',
    author: {
        name: 'DSL',
        role: '独立开发者 / AI 产品工程师',
        summary: '把写作、产品和工程整理成一套可以长期经营的公开作品系统。',
        bio: '长期关注 AI 产品、前端体验、内容系统和数字表达，把博客当作公开作品、实验记录和长期资产来经营。',
        location: {
            city: '上海',
            country: '中国',
            latitude: 31.2304,
            longitude: 121.4737,
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
            label: '邮箱',
            href: 'mailto:hello@dsl.blog',
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
            title: '内容不是更新流，而是长期资产',
            description: '首页只保留最值得先看的内容与下一步动作。',
        },
        {
            title: '项目页负责证明方法与交付能力',
            description: '每个案例都说明问题、方案和结果，而不是只堆技术栈。',
        },
        {
            title: '界面风格服务于阅读和信任',
            description: '先做信息秩序，再做记忆点和品牌感。',
        },
    ],
    projectThemes: [
        {
            title: '内容产品',
            description: '长期写作、归档、发布链路与 SEO 资产化。',
            icon: 'pen',
        },
        {
            title: '界面系统',
            description: '克制的视觉、明确的层级和稳定的交互反馈。',
            icon: 'grid',
        },
        {
            title: 'AI 工作流',
            description: '把代理式协作接进真实研发与内容生产流程。',
            icon: 'spark',
        },
    ] as Array<{ title: string; description: string; icon: SiteIconName }>,
    principles: [
        '结构优先于装饰，阅读效率优先于炫技。',
        '博客是公开作品，不是一次性展示页。',
        '风格可以鲜明，但不能牺牲信息密度和专业感。',
    ],
    aboutCapabilities: [
        '把个人站、内容站和作品站整合成一套长期经营的数字资产系统。',
        '在强风格视觉里维持阅读体验、信息秩序和专业感。',
        '把 AI 工作流接入研发、写作、迭代和部署。',
        '从界面到交付都保持可维护、可复用、可持续扩展。',
    ],
    currentFocus: [
        '黑灰极简但不失辨识度的公开作品系统。',
        '面向长期写作的归档页和文章阅读体验。',
        '稳定的发布、备份、部署与内容运营流程。',
    ],
};
