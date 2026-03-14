import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deletePost, fetchPosts, type Post } from '../../api/client';
import SEO from '../../components/SEO';
import SiteIcon from '../../components/SiteIcon';
import { useToast } from '../../hooks/useToast';
import { formatDateTime } from '../../lib/format';

type FilterMode = 'all' | 'published' | 'draft';

export default function PostsManagerPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [query, setQuery] = useState('');
    const [filterMode, setFilterMode] = useState<FilterMode>('all');

    const loadPosts = async () => {
        const response = await fetchPosts({ limit: 100 });
        setPosts(response.data);
    };

    useEffect(() => {
        loadPosts()
            .catch(() => showToast('文章列表读取失败。', 'error'))
            .finally(() => setLoading(false));
    }, [showToast]);

    const filteredPosts = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return posts.filter((post) => {
            if (filterMode === 'published' && !post.published) {
                return false;
            }
            if (filterMode === 'draft' && post.published) {
                return false;
            }
            if (!normalizedQuery) {
                return true;
            }

            return [post.title, post.excerpt, post.category?.name || '', post.series?.title || '', ...post.tags.map((tag) => tag.name)]
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery);
        });
    }, [filterMode, posts, query]);

    const handleDelete = async (id: number) => {
        setDeletingId(id);
        try {
            await deletePost(id);
            await loadPosts();
            showToast('文章已删除。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '文章删除失败。', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <SEO title="文章管理" description="集中管理文章、草稿与编辑入口。" />

            <section className="section">
                <div className="container admin-shell">
                    <header className="feature-panel">
                        <div className="section-heading">
                            <div>
                                <div className="eyebrow">Posts</div>
                                <h1 className="section-title">文章管理</h1>
                                <p className="section-copy">把文章列表、状态筛选和编辑动作从总控台拆出来，减少后台一屏拥挤。</p>
                            </div>
                            <div className="hero-actions">
                                <Link to="/editor" className="btn btn-primary">
                                    <SiteIcon name="pen" size={14} />
                                    <span>新建文章</span>
                                </Link>
                                <button type="button" className="btn btn-secondary" onClick={() => void loadPosts()}>
                                    <SiteIcon name="spark" size={14} />
                                    <span>刷新</span>
                                </button>
                            </div>
                        </div>

                        <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)' }}>
                            <label className="form-field">
                                <span className="form-label">搜索文章</span>
                                <input className="form-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="标题、摘要、分类、专栏、标签" />
                            </label>

                            <div className="form-field">
                                <span className="form-label">状态筛选</span>
                                <div className="tag-list">
                                    <button type="button" className={`filter-chip ${filterMode === 'all' ? 'is-active' : ''}`} onClick={() => setFilterMode('all')}>全部</button>
                                    <button type="button" className={`filter-chip ${filterMode === 'published' ? 'is-active' : ''}`} onClick={() => setFilterMode('published')}>已发布</button>
                                    <button type="button" className={`filter-chip ${filterMode === 'draft' ? 'is-active' : ''}`} onClick={() => setFilterMode('draft')}>草稿</button>
                                </div>
                            </div>
                        </div>
                    </header>

                    <section className="feature-panel">
                        <div className="editor-card-head">
                            <strong>文章列表</strong>
                            <span className="command-hint">{loading ? '加载中...' : `${filteredPosts.length} 篇`}</span>
                        </div>

                        {loading ? (
                            <div className="empty-state">正在读取文章列表...</div>
                        ) : filteredPosts.length ? (
                            <div className="admin-list">
                                {filteredPosts.map((post) => (
                                    <article key={post.id} className="admin-row">
                                        <div className="admin-row-copy">
                                            <strong>{post.title}</strong>
                                            <div className="admin-row-meta">
                                                <span className="chip">{post.published ? '已发布' : '草稿'}</span>
                                                {post.featured ? <span className="chip">精选</span> : null}
                                                {post.category ? <span className="chip">{post.category.name}</span> : null}
                                                {post.series ? <span className="chip">{post.series.title}</span> : null}
                                                <span className="chip">{formatDateTime(post.updatedAt)}</span>
                                            </div>
                                            <p className="muted">{post.deck?.trim() || post.excerpt}</p>
                                        </div>
                                        <div className="admin-row-actions">
                                            <button type="button" className="btn btn-secondary" onClick={() => navigate(`/editor/${post.slug}`)}>编辑</button>
                                            <Link to={`/blog/${post.slug}`} className="btn btn-ghost">预览</Link>
                                            <button type="button" className="btn btn-ghost" disabled={deletingId === post.id} onClick={() => void handleDelete(post.id)}>
                                                {deletingId === post.id ? '删除中...' : '删除'}
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">没有匹配条件的文章。</div>
                        )}
                    </section>
                </div>
            </section>
        </>
    );
}
