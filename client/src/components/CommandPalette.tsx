import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPosts, type Post } from '../api/client';
import { siteConfig } from '../config/site';

interface CommandPaletteProps {
    isAdmin: boolean;
}

export default function CommandPalette({ isAdmin }: CommandPaletteProps) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasLoadedPosts, setHasLoadedPosts] = useState(false);
    const deferredQuery = useDeferredValue(query.trim().toLowerCase());

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setOpen((value) => !value);
                return;
            }

            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    useEffect(() => {
        if (!open || hasLoadedPosts || loading) {
            return;
        }

        setLoading(true);
        fetchPosts({ limit: 12 })
            .then((response) => setPosts(response.data))
            .catch(() => setPosts([]))
            .finally(() => {
                setHasLoadedPosts(true);
                setLoading(false);
            });
    }, [hasLoadedPosts, loading, open]);

    if (!open) {
        return null;
    }

    const navigationResults = siteConfig.navigation
        .filter((item) => !deferredQuery || item.label.toLowerCase().includes(deferredQuery))
        .map((item) => ({
            id: item.to,
            label: item.label,
            description: item.to,
            onSelect: () => navigate(item.to),
            type: '页面',
        }));

    const adminResults = isAdmin
        ? [
            {
                id: '/admin/dashboard',
                label: '管理员控制台',
                description: '查看数据与审核评论',
                onSelect: () => navigate('/admin/dashboard'),
                type: '后台',
            },
            {
                id: '/editor',
                label: '新建文章',
                description: '进入编辑器',
                onSelect: () => navigate('/editor'),
                type: '后台',
            },
        ].filter((item) => !deferredQuery || item.label.toLowerCase().includes(deferredQuery))
        : [];

    const postResults = posts
        .filter((post) => {
            if (!deferredQuery) {
                return true;
            }

            return [post.title, post.excerpt, post.category?.name || '', ...post.tags.map((tag) => tag.name)]
                .join(' ')
                .toLowerCase()
                .includes(deferredQuery);
        })
        .slice(0, 8)
        .map((post) => ({
            id: post.slug,
            label: post.title,
            description: post.excerpt,
            onSelect: () => navigate(`/blog/${post.slug}`),
            type: '文章',
        }));

    const results = [...navigationResults, ...adminResults, ...postResults];

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
                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <input
                        autoFocus
                        data-testid="command-palette-input"
                        className="form-input"
                        value={query}
                        onChange={(event) => {
                            const nextValue = event.target.value;
                            startTransition(() => setQuery(nextValue));
                        }}
                        placeholder="搜索页面、文章或后台入口..."
                    />
                </div>

                <div className="command-results">
                    {loading ? (
                        <div style={{ padding: '1rem 1.1rem' }} className="muted">
                            正在加载快速导航...
                        </div>
                    ) : results.length === 0 ? (
                        <div style={{ padding: '1rem 1.1rem' }} className="muted">
                            没有匹配结果，试试搜索文章标题或页面名称。
                        </div>
                    ) : (
                        results.map((result) => (
                            <button
                                key={result.id}
                                type="button"
                                className="command-result"
                                data-testid={`command-result-${result.id.replace(/[^\w-]/g, '-')}`}
                                onClick={() => {
                                    result.onSelect();
                                    setOpen(false);
                                    setQuery('');
                                }}
                            >
                                <div style={{ textAlign: 'left', display: 'grid', gap: '0.2rem' }}>
                                    <strong>{result.label}</strong>
                                    <span className="muted" style={{ fontSize: '0.9rem' }}>{result.description}</span>
                                </div>
                                <span className="command-hint">{result.type}</span>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
