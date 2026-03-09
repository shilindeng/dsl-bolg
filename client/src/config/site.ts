const normalizeUrl = (value: string) => value.replace(/\/+$/, '');

export const siteConfig = {
    name: 'DSL Blog',
    shortName: 'DSL',
    title: 'DSL Blog | 赛博感个人博客',
    description: '围绕技术写作、产品判断、数字审美与长期项目构建的个人博客。',
    url: normalizeUrl(import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')),
    defaultOgImage: '/og-default.svg',
    email: 'hello@dsl.blog',
    rssPath: '/rss.xml',
    author: {
        name: 'DSL',
        role: '独立开发者 / AI 产品工程师',
        location: {
            city: '上海',
            country: '中国',
            latitude: 31.2304,
            longitude: 121.4737,
            timezone: 'Asia/Shanghai',
        },
        bio: '长期关注 AI 产品、前端体验、内容系统和数字表达，把博客当作公开作品、实验记录和长期资产来经营。',
        summary: '写技术文章，做产品实验，也认真打磨界面的秩序、气味和辨识度。',
    },
    navigation: [
        { label: '首页', to: '/' },
        { label: '博客', to: '/blog' },
        { label: '项目', to: '/projects' },
        { label: '关于', to: '/about' },
    ],
    socialLinks: [
        { label: '邮箱', href: 'mailto:hello@dsl.blog', external: true },
        { label: 'Newsletter', href: '/newsletter', external: false, router: true },
        { label: 'RSS', href: '/rss.xml', external: false, router: false },
        { label: '项目', href: '/projects', external: false, router: true },
    ],
    heroMetrics: [
        { label: '系统角色', value: '博客 / 作品集 / 实验场' },
        { label: '关注方向', value: '前端体验 / AI 工作流 / 内容工程' },
        { label: '更新节奏', value: '持续迭代，长期维护' },
    ],
    principles: [
        '结构优先于装饰，阅读效率优先于炫技。',
        '博客是公开作品，不是一次性展示页。',
        '视觉必须有个性，但不能牺牲信息密度。',
    ],
    homeSignals: [
        {
            id: 'signal-01',
            label: '信号 01',
            title: '写给能长期判断的人',
            description: '内容围绕方法、决策和复盘展开，不追热闹，也不做无意义堆料。',
        },
        {
            id: 'signal-02',
            label: '信号 02',
            title: '前端不是堆组件',
            description: '我更关心界面的情绪、节奏、层级和可读性，而不是把技术标签堆满页面。',
        },
        {
            id: 'signal-03',
            label: '信号 03',
            title: 'AI 要接入真实工作流',
            description: '只有能进入写作、开发、发布和部署链路的 AI，才值得投入时间去打磨。',
        },
    ],
    focusAreas: [
        {
            name: '界面表达',
            title: '界面与品牌表达',
            description: '设计系统、前端体验、信息密度控制，以及有辨识度的视觉语言。',
        },
        {
            name: '内容系统',
            title: '内容系统与发布机制',
            description: '围绕博客、知识库和 SEO 资产构建可持续的内容生产与沉淀流程。',
        },
        {
            name: 'AI 工作流',
            title: 'AI 参与开发与创作',
            description: '把自动化、代理式工作流和编排能力，真正接到生产链路里。',
        },
    ],
    aboutCapabilities: [
        '把个人站、内容站和作品站整合成一套长期运营的数字资产系统。',
        '在强风格视觉里维持阅读体验、信息秩序和专业感。',
        '把 AI 工作流接入研发、写作、迭代和部署。',
        '从界面到交付都保持可维护、可复用、可持续扩展。',
    ],
    currentFocus: [
        '高辨识度但不牺牲可读性的赛博界面系统。',
        '面向长期写作的内容结构和文章体验。',
        '把部署、备份和日常发布流程压成可重复执行的脚本。',
    ],
};
