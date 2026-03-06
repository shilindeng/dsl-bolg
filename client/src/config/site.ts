const normalizeUrl = (value: string) => value.replace(/\/+$/, '');

export const siteConfig = {
    name: 'DSL Blog',
    shortName: 'DSL',
    title: 'DSL Blog | 个人品牌技术博客',
    description: '围绕技术写作、产品判断、数字审美与项目实践构建的个人品牌博客。',
    url: normalizeUrl(import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')),
    defaultOgImage: '/og-default.svg',
    email: 'hello@dsl.blog',
    rssPath: '/rss.xml',
    author: {
        name: 'DSL',
        role: '独立开发者 / AI Product Builder',
        location: {
            city: 'Shanghai',
            country: 'China',
            latitude: 31.2304,
            longitude: 121.4737,
            timezone: 'Asia/Shanghai',
        },
        bio: '长期关注 AI 产品、前端体验、内容系统和数字表达，把博客当作公开作品与长期资产来经营。',
        summary:
            '写技术文章，做产品试验，也认真打磨界面质感。目标不是做一个“会发光的网站”，而是做一个值得长期访问的个人站。',
    },
    socialLinks: [
        { label: 'Email', href: 'mailto:hello@dsl.blog', external: true },
        { label: 'RSS', href: '/rss.xml', external: false, router: false },
        { label: 'Projects', href: '/projects', external: false, router: true },
    ],
    navigation: [
        { label: '首页', to: '/' },
        { label: '博客', to: '/blog' },
        { label: '项目', to: '/projects' },
        { label: '关于', to: '/about' },
    ],
    heroMetrics: [
        { label: '内容方向', value: '技术 / 产品 / 审美' },
        { label: '输出方式', value: '长文 / 项目 / 公开复盘' },
        { label: '更新节奏', value: '持续迭代' },
    ],
    principles: [
        '结构优先于装饰，阅读优先于炫技。',
        '把博客当作公开作品，而不是临时展示页。',
        '视觉要有辨识度，但不能牺牲信息效率。',
    ],
};
