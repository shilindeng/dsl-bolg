import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    createSeries,
    deleteSeries,
    fetchAdminSeries,
    fetchPosts,
    updatePost,
    updateSeries,
    type Post,
    type Series,
} from '../../api/client';
import SEO from '../../components/SEO';
import SiteIcon from '../../components/SiteIcon';
import { useToast } from '../../hooks/useToast';

const emptyCreateForm = {
    title: '',
    slug: '',
    order: 0,
};

const emptyEditForm = {
    title: '',
    slug: '',
    summary: '',
    description: '',
    coverImage: '',
    status: 'active',
    order: 0,
};

export default function SeriesManagerPage() {
    const { showToast } = useToast();
    const [series, setSeries] = useState<Series[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [createForm, setCreateForm] = useState(emptyCreateForm);
    const [editForm, setEditForm] = useState(emptyEditForm);
    const [saving, setSaving] = useState(false);
    const [creating, setCreating] = useState(false);
    const [chapterOrders, setChapterOrders] = useState<Record<number, string>>({});
    const [attachPostId, setAttachPostId] = useState('');
    const [attachOrder, setAttachOrder] = useState('');

    const reload = async () => {
        const [seriesResponse, postsResponse] = await Promise.all([
            fetchAdminSeries(),
            fetchPosts({ limit: 80 }),
        ]);

        setSeries(seriesResponse);
        setPosts(postsResponse.data);
    };

    useEffect(() => {
        reload()
            .catch(() => showToast('专栏管理数据读取失败。', 'error'))
            .finally(() => setLoading(false));
    }, [showToast]);

    const selectedSeries = useMemo(() => series.find((item) => item.id === selectedId) || null, [selectedId, series]);

    useEffect(() => {
        if (!selectedSeries) return;
        setEditForm({
            title: selectedSeries.title || '',
            slug: selectedSeries.slug || '',
            summary: selectedSeries.summary || '',
            description: selectedSeries.description || '',
            coverImage: selectedSeries.coverImage || '',
            status: selectedSeries.status || 'active',
            order: selectedSeries.order || 0,
        });
    }, [selectedSeries]);

    const postsInSeries = useMemo(() => {
        if (!selectedSeries) return [];
        return posts
            .filter((post) => post.series?.id === selectedSeries.id)
            .slice()
            .sort((a, b) => (a.seriesOrder ?? 9999) - (b.seriesOrder ?? 9999));
    }, [posts, selectedSeries]);

    useEffect(() => {
        const map: Record<number, string> = {};
        for (const post of postsInSeries) {
            map[post.id] = post.seriesOrder ? String(post.seriesOrder) : '';
        }
        setChapterOrders(map);
        setAttachPostId('');
        setAttachOrder('');
    }, [postsInSeries]);

    const unassignedPosts = useMemo(() => posts.filter((post) => !post.series), [posts]);

    const handleCreateSeries = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!createForm.title.trim()) {
            showToast('专栏标题不能为空。', 'error');
            return;
        }

        setCreating(true);
        try {
            const record = await createSeries({
                title: createForm.title.trim(),
                slug: createForm.slug.trim() || undefined,
                order: createForm.order,
            });
            setCreateForm(emptyCreateForm);
            await reload();
            setSelectedId(record.id);
            showToast('专栏已创建。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '专栏创建失败。', 'error');
        } finally {
            setCreating(false);
        }
    };

    const handleSaveSeries = async () => {
        if (!selectedSeries) return;
        setSaving(true);

        try {
            await updateSeries(selectedSeries.id, {
                title: editForm.title.trim(),
                slug: editForm.slug.trim(),
                summary: editForm.summary.trim() || null,
                description: editForm.description.trim() || null,
                coverImage: editForm.coverImage.trim() || null,
                status: editForm.status,
                order: editForm.order,
            });
            await reload();
            showToast('专栏信息已保存。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '专栏保存失败。', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSeries = async () => {
        if (!selectedSeries) return;

        const ok = window.confirm(`确定删除专栏「${selectedSeries.title}」？删除后该专栏下文章会自动移除专栏归属。`);
        if (!ok) return;

        setSaving(true);
        try {
            await deleteSeries(selectedSeries.id);
            await reload();
            setSelectedId(null);
            showToast('专栏已删除。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '专栏删除失败。', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateChapterOrder = async (post: Post) => {
        if (!selectedSeries) return;

        try {
            const value = chapterOrders[post.id] || '';
            await updatePost(post.id, {
                seriesId: selectedSeries.id,
                seriesOrder: value ? Number(value) : null,
            });
            await reload();
            showToast('章节序号已更新。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '章节序号更新失败。', 'error');
        }
    };

    const handleDetachPost = async (post: Post) => {
        try {
            await updatePost(post.id, { seriesId: null, seriesOrder: null });
            await reload();
            showToast('已从专栏移除该文章。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '移除失败。', 'error');
        }
    };

    const handleAttachPost = async () => {
        if (!selectedSeries) return;
        const postId = Number(attachPostId);
        if (!postId) return;

        try {
            await updatePost(postId, {
                seriesId: selectedSeries.id,
                seriesOrder: attachOrder ? Number(attachOrder) : null,
            });
            await reload();
            setAttachPostId('');
            setAttachOrder('');
            showToast('文章已加入专栏。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '加入专栏失败。', 'error');
        }
    };

    return (
        <>
            <SEO title="专栏管理" description="管理专栏信息与章节排序。" />

            <section className="section">
                <div className="container manager-shell">
                    <header className="feature-panel manager-header">
                        <div>
                            <span className="eyebrow">Series Manager</span>
                            <h1 className="section-title">专栏管理</h1>
                            <p className="section-copy">维护专栏信息，并为文章建立顺序阅读路径。</p>
                        </div>
                        <button type="button" className="btn btn-secondary" onClick={() => void reload()} disabled={loading || saving || creating}>
                            <SiteIcon name="spark" size={14} />
                            <span>刷新数据</span>
                        </button>
                    </header>

                    <div className="two-column-grid manager-grid">
                        <section className="feature-panel manager-panel">
                            <div className="section-head compact-head">
                                <div>
                                    <span className="eyebrow">Catalog</span>
                                    <h2 className="section-title compact-title">专栏列表</h2>
                                </div>
                            </div>

                            {loading ? (
                                <div className="empty-state">正在读取专栏...</div>
                            ) : (
                                <div className="manager-list">
                                    {series.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className={`manager-item ${selectedId === item.id ? 'is-active' : ''}`}
                                            onClick={() => setSelectedId(item.id)}
                                        >
                                            <div style={{ textAlign: 'left' }}>
                                                <strong>{item.title}</strong>
                                                <div className="meta-inline" style={{ marginTop: '0.45rem' }}>
                                                    <span className="meta-pill">
                                                        <SiteIcon name="book-open" size={13} />
                                                        <span>{item.stats?.totalPosts ?? 0} / {item.stats?.publishedPosts ?? 0}</span>
                                                    </span>
                                                    <span className="meta-pill">
                                                        <SiteIcon name="spark" size={13} />
                                                        <span>{item.status}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <SiteIcon name="chevron-right" size={16} />
                                        </button>
                                    ))}
                                    {series.length === 0 ? <div className="empty-state">还没有专栏。</div> : null}
                                </div>
                            )}

                            <div className="manager-divider" />

                            <form onSubmit={handleCreateSeries} className="manager-form">
                                <span className="eyebrow">Create</span>
                                <label className="form-field">
                                    <span className="form-label">标题</span>
                                    <input className="form-input" value={createForm.title} onChange={(e) => setCreateForm((c) => ({ ...c, title: e.target.value }))} />
                                </label>
                                <div className="two-grid">
                                    <label className="form-field">
                                        <span className="form-label">Slug（可选）</span>
                                        <input className="form-input mono" value={createForm.slug} onChange={(e) => setCreateForm((c) => ({ ...c, slug: e.target.value }))} placeholder="留空自动生成" />
                                    </label>
                                    <label className="form-field">
                                        <span className="form-label">排序</span>
                                        <input className="form-input mono" type="number" value={createForm.order} onChange={(e) => setCreateForm((c) => ({ ...c, order: Number(e.target.value) || 0 }))} />
                                    </label>
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    <SiteIcon name="pen" size={14} />
                                    <span>{creating ? '创建中...' : '创建专栏'}</span>
                                </button>
                            </form>
                        </section>

                        <section className="feature-panel manager-panel">
                            <div className="section-head compact-head">
                                <div>
                                    <span className="eyebrow">Editor</span>
                                    <h2 className="section-title compact-title">{selectedSeries ? selectedSeries.title : '选择一个专栏'}</h2>
                                </div>
                                {selectedSeries ? (
                                    <div className="meta-inline">
                                        <button type="button" className="btn btn-secondary" onClick={() => void handleSaveSeries()} disabled={saving}>
                                            <SiteIcon name="check" size={14} />
                                            <span>{saving ? '保存中...' : '保存'}</span>
                                        </button>
                                        <button type="button" className="btn btn-ghost" onClick={() => void handleDeleteSeries()} disabled={saving}>
                                            <SiteIcon name="close" size={14} />
                                            <span>删除</span>
                                        </button>
                                    </div>
                                ) : null}
                            </div>

                            {!selectedSeries ? (
                                <div className="empty-state">先从左侧选择一个专栏，再维护信息与章节。</div>
                            ) : (
                                <>
                                    <div className="manager-form">
                                        <div className="two-grid">
                                            <label className="form-field">
                                                <span className="form-label">标题</span>
                                                <input className="form-input" value={editForm.title} onChange={(e) => setEditForm((c) => ({ ...c, title: e.target.value }))} />
                                            </label>
                                            <label className="form-field">
                                                <span className="form-label">Slug</span>
                                                <input className="form-input mono" value={editForm.slug} onChange={(e) => setEditForm((c) => ({ ...c, slug: e.target.value }))} />
                                            </label>
                                        </div>

                                        <label className="form-field">
                                            <span className="form-label">Summary</span>
                                            <textarea className="form-textarea" value={editForm.summary} onChange={(e) => setEditForm((c) => ({ ...c, summary: e.target.value }))} />
                                        </label>

                                        <label className="form-field">
                                            <span className="form-label">Description</span>
                                            <textarea className="form-textarea" value={editForm.description} onChange={(e) => setEditForm((c) => ({ ...c, description: e.target.value }))} />
                                        </label>

                                        <div className="two-grid">
                                            <label className="form-field">
                                                <span className="form-label">封面图</span>
                                                <input className="form-input" value={editForm.coverImage} onChange={(e) => setEditForm((c) => ({ ...c, coverImage: e.target.value }))} placeholder="可留空" />
                                            </label>
                                            <label className="form-field">
                                                <span className="form-label">状态</span>
                                                <select className="form-select" value={editForm.status} onChange={(e) => setEditForm((c) => ({ ...c, status: e.target.value }))}>
                                                    <option value="active">active</option>
                                                    <option value="complete">complete</option>
                                                    <option value="paused">paused</option>
                                                </select>
                                            </label>
                                        </div>

                                        <label className="form-field">
                                            <span className="form-label">排序</span>
                                            <input className="form-input mono" type="number" value={editForm.order} onChange={(e) => setEditForm((c) => ({ ...c, order: Number(e.target.value) || 0 }))} />
                                        </label>
                                    </div>

                                    <div className="manager-divider" />

                                    <div className="section-head compact-head">
                                        <div>
                                            <span className="eyebrow">Chapters</span>
                                            <h3 style={{ margin: 0 }}>章节排序</h3>
                                        </div>
                                    </div>

                                    {postsInSeries.length ? (
                                        <div className="manager-list">
                                            {postsInSeries.map((post) => (
                                                <div key={post.id} className="manager-chapter">
                                                    <div style={{ minWidth: 0 }}>
                                                        <strong style={{ display: 'block' }}>{post.title}</strong>
                                                        <div className="meta-inline" style={{ marginTop: '0.4rem' }}>
                                                            <span className="meta-pill">
                                                                <SiteIcon name="spark" size={13} />
                                                                <span>{post.published ? 'published' : 'draft'}</span>
                                                            </span>
                                                            <span className="meta-pill">
                                                                <SiteIcon name="link" size={13} />
                                                                <span>#{post.seriesOrder ?? '--'}</span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="manager-chapter-actions">
                                                        <input
                                                            className="form-input mono"
                                                            style={{ width: 96 }}
                                                            type="number"
                                                            value={chapterOrders[post.id] ?? ''}
                                                            onChange={(e) => setChapterOrders((c) => ({ ...c, [post.id]: e.target.value }))}
                                                            placeholder="序号"
                                                        />
                                                        <button type="button" className="btn btn-secondary" onClick={() => void handleUpdateChapterOrder(post)}>
                                                            更新
                                                        </button>
                                                        <button type="button" className="btn btn-ghost" onClick={() => void handleDetachPost(post)}>
                                                            移除
                                                        </button>
                                                        <Link to={`/editor/${post.slug}`} className="btn btn-primary">
                                                            编辑
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-state">这个专栏还没有章节。</div>
                                    )}

                                    <div className="manager-divider" />

                                    <div className="section-head compact-head">
                                        <div>
                                            <span className="eyebrow">Attach</span>
                                            <h3 style={{ margin: 0 }}>加入文章</h3>
                                        </div>
                                    </div>

                                    <div className="two-grid">
                                        <label className="form-field">
                                            <span className="form-label">未归属专栏的文章</span>
                                            <select className="form-select" value={attachPostId} onChange={(e) => setAttachPostId(e.target.value)}>
                                                <option value="">选择文章</option>
                                                {unassignedPosts.map((post) => (
                                                    <option key={post.id} value={post.id}>
                                                        {post.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="form-field">
                                            <span className="form-label">序号（可选）</span>
                                            <input className="form-input mono" type="number" value={attachOrder} onChange={(e) => setAttachOrder(e.target.value)} placeholder="留空自动排在最后" />
                                        </label>
                                    </div>

                                    <button type="button" className="btn btn-primary" onClick={() => void handleAttachPost()} disabled={!attachPostId}>
                                        <SiteIcon name="arrow-right" size={14} />
                                        <span>加入专栏</span>
                                    </button>
                                </>
                            )}
                        </section>
                    </div>
                </div>
            </section>
        </>
    );
}

