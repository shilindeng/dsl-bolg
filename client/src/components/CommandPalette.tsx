import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPosts, fetchProjects, fetchSeries, type Post, type Project, type Series } from '../api/client';
import { siteConfig } from '../config/site';
import { useAuth } from '../hooks/useAuth';

interface CommandPaletteProps {
    isAdmin: boolean;
}

interface CommandResult {
    id: string;
    label: string;
    description: string;
    onSelect: () => void;
    type: string;
}

const adminWorkbenchEntries = [
    { id: '/admin/dashboard', label: '后台总览', description: '查看趋势、风险与近期活动' },
    { id: '/admin/posts', label: '文章管理', description: '管理文章、草稿和编辑入口' },
    { id: '/admin/projects', label: '项目管理', description: '维护公开项目与草稿状态' },
    { id: '/admin/comments', label: '评论管理', description: '处理评论审核队列' },
    { id: '/admin/homepage', label: '首页编排', description: '调整首页精选与 CTA' },
    { id: '/admin/newsletter', label: 'Newsletter 管理', description: '管理 issue、订阅者与发送队列' },
    { id: '/admin/series', label: '专栏管理', description: '维护专栏和章节顺序' },
    { id: '/admin/taxonomy', label: '分类与标签', description: '清理 taxonomy 与脏标签' },
    { id: '/admin/api-keys', label: 'API Key 管理', description: '维护开放发布凭证' },
    { id: '/editor', label: '新建文章', description: '直接进入内容编辑器' },
];

export default function CommandPalette({ isAdmin }: CommandPaletteProps) {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [posts, setPosts] = useState<Post[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [series, setSeries] = useState<Series[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasLoadedData, setHasLoadedData] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const deferredQuery = useDeferredValue(query.trim().toLowerCase());

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setOpen((current) => {
                    const next = !current;
                    if (!next) {
                        setQuery('');
                        setSelectedIndex(0);
                    }
                    return next;
                });
                return;
            }

            if (event.key === 'Escape') {
                setOpen(false);
                setQuery('');
                setSelectedIndex(0);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    useEffect(() => {
        const handleOpen = () => setOpen(true);
        window.addEventListener('open-command-palette', handleOpen);
        return () => window.removeEventListener('open-command-palette', handleOpen);
    }, []);

    useEffect(() => {
        if (!open || hasLoadedData || loading) {
            return;
        }

        setLoading(true);
        Promise.all([fetchPosts({ limit: 20 }), fetchProjects(), fetchSeries()])
            .then(([postResponse, projectResponse, seriesResponse]) => {
                setPosts(postResponse.data);
                setProjects(projectResponse);
                setSeries(seriesResponse);
            })
            .catch(() => {
                setPosts([]);
                setProjects([]);
                setSeries([]);
            })
            .finally(() => {
                setHasLoadedData(true);
                setLoading(false);
            });
    }, [hasLoadedData, loading, open]);

    const matchesQuery = (value: string) => !deferredQuery || value.toLowerCase().includes(deferredQuery);

    const navigationResults = siteConfig.navigation
        .filter((item) => matchesQuery([item.label, item.description || '', item.to].join(' ')))
        .map<CommandResult>((item) => ({
            id: item.to,
            label: item.label,
            description: item.description || item.to,
            onSelect: () => navigate(item.to),
            type: '页面',
        }));

    const memberResults = isAuthenticated
        ? [
            {
                id: '/account',
                label: '会员中心',
                description: '资料、评论、收藏与阅读历史',
                onSelect: () => navigate('/account'),
                type: '账户',
            },
            {
                id: '/account/bookmarks',
                label: '我的收藏',
                description: '回到收藏过的文章',
                onSelect: () => navigate('/account/bookmarks'),
                type: '账户',
            },
        ].filter((item) => matchesQuery([item.label, item.description].join(' ')))
        : [];

    const adminResults = isAdmin
        ? adminWorkbenchEntries
            .filter((item) => matchesQuery([item.label, item.description].join(' ')))
            .map<CommandResult>((item) => ({
                ...item,
                onSelect: () => navigate(item.id),
                type: '后台',
            }))
        : [];

    const postResults = posts
        .filter((post) =>
            matchesQuery([post.title, post.excerpt, post.category?.name || '', ...post.tags.map((tag) => tag.name)].join(' ')),
        )
        .slice(0, 8)
        .map<CommandResult>((post) => ({
            id: `post-${post.slug}`,
            label: post.title,
            description: post.excerpt,
            onSelect: () => navigate(`/blog/${post.slug}`),
            type: '文章',
        }));

    const seriesResults = series
        .filter((item) => matchesQuery([item.title, item.summary || '', item.description || ''].join(' ')))
        .slice(0, 6)
        .map<CommandResult>((item) => ({
            id: `series-${item.slug}`,
            label: item.title,
            description: item.summary || item.description || '按顺序阅读完整专栏路径',
            onSelect: () => navigate(`/series/${item.slug}`),
            type: '专栏',
        }));

    const projectResults = projects
        .filter((project) => matchesQuery([project.name, project.summary, project.headline || '', project.techStack].join(' ')))
        .slice(0, 6)
        .map<CommandResult>((project) => ({
            id: `project-${project.slug}`,
            label: project.name,
            description: project.summary,
            onSelect: () => navigate(`/projects/${project.slug}`),
            type: '项目',
        }));

    const utilityResults = [
        {
            id: '/newsletter',
            label: 'Newsletter',
            description: '订阅长期写作与产品化更新',
            onSelect: () => navigate('/newsletter'),
            type: '入口',
        },
        {
            id: '/login',
            label: isAuthenticated ? '切换账户' : '登录',
            description: '读者验证码登录 / 管理员登录',
            onSelect: () => navigate('/login'),
            type: '入口',
        },
    ].filter((item) => matchesQuery([item.label, item.description].join(' ')));

    const sections = [
        { title: '页面', items: navigationResults },
        { title: '账户', items: memberResults },
        { title: '后台', items: adminResults },
        { title: '文章', items: postResults },
        { title: '专栏', items: seriesResults },
        { title: '项目', items: projectResults },
        { title: '入口', items: utilityResults },
    ].filter((section) => section.items.length > 0);

    const results = sections.flatMap((section) => section.items);

    useEffect(() => {
        setSelectedIndex(0);
    }, [deferredQuery, open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleNavigation = (event: KeyboardEvent) => {
            if (!results.length) {
                return;
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSelectedIndex((current) => (current + 1) % results.length);
            }

            if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSelectedIndex((current) => (current - 1 + results.length) % results.length);
            }

            if (event.key === 'Enter') {
                const active = results[selectedIndex];
                if (!active) {
                    return;
                }

                event.preventDefault();
                active.onSelect();
                setOpen(false);
                setQuery('');
                setSelectedIndex(0);
            }
        };

        window.addEventListener('keydown', handleNavigation);
        return () => window.removeEventListener('keydown', handleNavigation);
    }, [open, results, selectedIndex]);

    const selectedResult = useMemo(() => results[selectedIndex] || null, [results, selectedIndex]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="command-palette-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="快速命令面板"
            data-testid="command-palette"
            onClick={() => setOpen(false)}
        >
            <div className="command-palette" onClick={(event) => event.stopPropagation()}>
                <div className="command-palette-head">
                    <input
                        autoFocus
                        data-testid="command-palette-input"
                        className="form-input"
                        value={query}
                        onChange={(event) => {
                            const nextValue = event.target.value;
                            startTransition(() => setQuery(nextValue));
                        }}
                        placeholder="搜索页面、文章、专栏、项目或后台入口..."
                    />
                </div>

                <div className="command-results">
                    {loading ? (
                        <div className="command-palette-state muted">
                            正在加载快速导航...
                        </div>
                    ) : results.length === 0 ? (
                        <div className="command-palette-state muted">
                            没有匹配结果，试试搜索文章标题、专栏主题或后台页名称。
                        </div>
                    ) : (
                        sections.map((section) => (
                            <div key={section.title} className="command-group">
                                <div className="command-group-label">{section.title}</div>
                                {section.items.map((result) => {
                                    const active = selectedResult?.id === result.id;

                                    return (
                                        <button
                                            key={result.id}
                                            type="button"
                                            className={`command-result ${active ? 'is-active' : ''}`}
                                            data-testid={`command-result-${result.id.replace(/[^\w-]/g, '-')}`}
                                            onMouseEnter={() => {
                                                const nextIndex = results.findIndex((item) => item.id === result.id);
                                                if (nextIndex >= 0) {
                                                    setSelectedIndex(nextIndex);
                                                }
                                            }}
                                            onClick={() => {
                                                result.onSelect();
                                                setOpen(false);
                                                setQuery('');
                                                setSelectedIndex(0);
                                            }}
                                        >
                                            <div style={{ textAlign: 'left', display: 'grid', gap: '0.2rem' }}>
                                                <strong>{result.label}</strong>
                                                <span className="muted" style={{ fontSize: '0.9rem' }}>{result.description}</span>
                                            </div>
                                            <span className="command-hint">{result.type}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
