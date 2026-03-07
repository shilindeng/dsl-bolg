import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { EChartsOption } from 'echarts';
import EChart from '../../components/EChart';
import {
    createApiKey,
    createProject,
    deletePost,
    deleteProject,
    fetchAdminComments,
    fetchAnalyticsDashboard,
    fetchApiKeys,
    fetchPosts,
    fetchProjects,
    revokeApiKey,
    updateCommentStatus,
    updateProject,
    uploadImage,
    type AnalyticsDashboard,
    type ApiKeyRecord,
    type Comment,
    type Post,
    type Project,
} from '../../api/client';
import { useToast } from '../../hooks/useToast';
import { formatDateTime } from '../../lib/format';
import { validateImageFile } from '../../lib/uploads';

const emptyProject = {
    name: '',
    slug: '',
    summary: '',
    description: '',
    techStack: '',
    liveUrl: '',
    repoUrl: '',
    coverImage: '',
    featured: false,
    order: 0,
};

const emptyDashboard: AnalyticsDashboard = {
    summary: { totalPosts: 0, totalViews: 0, totalLikes: 0, totalComments: 0, pendingComments: 0 },
    trend: [],
    topPosts: [],
    commentStatus: { pending: 0, approved: 0, rejected: 0 },
    recentActivity: [],
    startedAt: new Date().toISOString(),
};

type WorkspaceTab = 'content' | 'distribution';

const palette = {
    cyan: '#71f6ff',
    blue: '#6d88ff',
    pink: '#ff5ba9',
    gold: '#ffd36b',
    grid: 'rgba(255,255,255,0.08)',
    text: 'rgba(230,240,255,0.86)',
    muted: 'rgba(185,200,228,0.58)',
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [dashboard, setDashboard] = useState<AnalyticsDashboard>(emptyDashboard);
    const [comments, setComments] = useState<Comment[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
    const [projectForm, setProjectForm] = useState(emptyProject);
    const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingProject, setSavingProject] = useState(false);
    const [uploadingProjectCover, setUploadingProjectCover] = useState(false);
    const [creatingApiKey, setCreatingApiKey] = useState(false);
    const [apiKeyName, setApiKeyName] = useState('Automation Publisher');
    const [latestApiKey, setLatestApiKey] = useState('');
    const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('content');

    const reload = async () => {
        const [dashboardResponse, commentsResponse, postResponse, projectResponse, apiKeysResponse] = await Promise.all([
            fetchAnalyticsDashboard(),
            fetchAdminComments('pending'),
            fetchPosts({ limit: 20 }),
            fetchProjects(),
            fetchApiKeys(),
        ]);

        setDashboard(dashboardResponse);
        setComments(commentsResponse);
        setPosts(postResponse.data);
        setProjects(projectResponse);
        setApiKeys(apiKeysResponse);
    };

    useEffect(() => {
        reload()
            .catch(() => showToast('后台数据读取失败。', 'error'))
            .finally(() => setLoading(false));
    }, [showToast]);

    const trendOption = useMemo<EChartsOption>(() => ({
        backgroundColor: 'transparent',
        animationDuration: 700,
        grid: { left: 18, right: 18, top: 26, bottom: 18, containLabel: true },
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(8,12,28,0.94)',
            borderColor: 'rgba(113,246,255,0.18)',
            textStyle: { color: '#eef4ff' },
        },
        legend: {
            top: 0,
            right: 0,
            textStyle: { color: palette.muted },
            itemWidth: 10,
            itemHeight: 10,
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: dashboard.trend.map((item) => item.date.slice(5)),
            axisLine: { lineStyle: { color: palette.grid } },
            axisTick: { show: false },
            axisLabel: { color: palette.muted },
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: palette.grid } },
            axisLabel: { color: palette.muted },
        },
        series: [
            { name: '浏览', type: 'line', smooth: true, symbol: 'none', lineStyle: { color: palette.cyan, width: 3 }, areaStyle: { opacity: 0.16, color: palette.cyan }, data: dashboard.trend.map((item) => item.views) },
            { name: '点赞', type: 'line', smooth: true, symbol: 'none', lineStyle: { color: palette.blue, width: 2 }, data: dashboard.trend.map((item) => item.likes) },
            { name: '评论', type: 'line', smooth: true, symbol: 'none', lineStyle: { color: palette.pink, width: 2 }, data: dashboard.trend.map((item) => item.comments) },
        ],
    }), [dashboard.trend]);

    const topPostsOption = useMemo<EChartsOption>(() => ({
        backgroundColor: 'transparent',
        animationDuration: 700,
        grid: { left: 10, right: 10, top: 10, bottom: 10, containLabel: true },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(8,12,28,0.94)',
            borderColor: 'rgba(109,136,255,0.18)',
            textStyle: { color: '#eef4ff' },
        },
        xAxis: {
            type: 'value',
            axisLabel: { color: palette.muted },
            splitLine: { lineStyle: { color: palette.grid } },
        },
        yAxis: {
            type: 'category',
            axisTick: { show: false },
            axisLine: { show: false },
            axisLabel: { color: palette.text },
            data: dashboard.topPosts.map((item) => item.title.length > 16 ? `${item.title.slice(0, 16)}…` : item.title),
        },
        series: [
            { type: 'bar', barWidth: 14, data: dashboard.topPosts.map((item) => item.views), itemStyle: { color: palette.cyan, borderRadius: [0, 10, 10, 0] } },
        ],
    }), [dashboard.topPosts]);

    const commentHealthOption = useMemo<EChartsOption>(() => ({
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(8,12,28,0.94)',
            borderColor: 'rgba(255,91,169,0.18)',
            textStyle: { color: '#eef4ff' },
        },
        legend: {
            bottom: 0,
            textStyle: { color: palette.muted },
            itemWidth: 10,
            itemHeight: 10,
        },
        series: [
            {
                type: 'pie',
                radius: ['58%', '80%'],
                center: ['50%', '44%'],
                itemStyle: { borderColor: 'rgba(6,9,22,1)', borderWidth: 4 },
                label: { color: palette.text, formatter: '{d}%' },
                data: [
                    { value: dashboard.commentStatus.pending, name: '待审核', itemStyle: { color: palette.pink } },
                    { value: dashboard.commentStatus.approved, name: '已通过', itemStyle: { color: palette.cyan } },
                    { value: dashboard.commentStatus.rejected, name: '已拒绝', itemStyle: { color: palette.gold } },
                ].filter((item) => item.value > 0),
            },
        ],
    }), [dashboard.commentStatus]);
    const handleCommentAction = async (id: number, status: 'approved' | 'rejected') => {
        try {
            await updateCommentStatus(id, status);
            await reload();
            showToast(status === 'approved' ? '评论已通过审核。' : '评论已拒绝。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '评论审核失败。', 'error');
        }
    };

    const handleDeletePost = async (id: number) => {
        try {
            await deletePost(id);
            await reload();
            showToast('文章已删除。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '文章删除失败。', 'error');
        }
    };

    const resetProjectForm = () => {
        setProjectForm(emptyProject);
        setEditingProjectId(null);
    };

    const handleProjectSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSavingProject(true);
        try {
            const payload = {
                ...projectForm,
                liveUrl: projectForm.liveUrl || null,
                repoUrl: projectForm.repoUrl || null,
                coverImage: projectForm.coverImage || null,
            };
            if (editingProjectId) {
                await updateProject(editingProjectId, payload);
            } else {
                await createProject(payload);
            }
            resetProjectForm();
            await reload();
            showToast('项目已保存。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '项目保存失败。', 'error');
        } finally {
            setSavingProject(false);
        }
    };

    const handleDeleteProject = async (id: number) => {
        try {
            await deleteProject(id);
            await reload();
            showToast('项目已删除。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '项目删除失败。', 'error');
        }
    };

    const handleProjectCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.length) return;
        setUploadingProjectCover(true);
        try {
            const file = event.target.files[0];
            validateImageFile(file);
            const result = await uploadImage(file);
            setProjectForm((current) => ({ ...current, coverImage: result.url }));
            showToast(`项目封面上传成功，已保存到 ${result.storage.toUpperCase()}。`, 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '项目封面上传失败。', 'error');
        } finally {
            setUploadingProjectCover(false);
            event.target.value = '';
        }
    };

    const handleCreateApiKey = async (event: React.FormEvent) => {
        event.preventDefault();
        setCreatingApiKey(true);
        try {
            const created = await createApiKey({
                name: apiKeyName.trim() || 'Automation Publisher',
                scopes: ['posts:write', 'media:write'],
            });
            setLatestApiKey(created.key);
            await reload();
            showToast('开放 API Key 已创建。明文只会显示这一次。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '创建 API Key 失败。', 'error');
        } finally {
            setCreatingApiKey(false);
        }
    };

    const handleRevokeApiKey = async (id: number) => {
        try {
            await revokeApiKey(id);
            await reload();
            showToast('API Key 已吊销。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '吊销 API Key 失败。', 'error');
        }
    };

    const copyLatestApiKey = async () => {
        if (!latestApiKey) return;
        await navigator.clipboard.writeText(latestApiKey);
        showToast('已复制最新 API Key。', 'success');
    };

    if (loading) {
        return (
            <section className="section">
                <div className="container">
                    <div className="empty-state">正在加载后台数据...</div>
                </div>
            </section>
        );
    }

    return (
        <section className="section">
            <div className="container admin-shell admin-dashboard-shell admin-dashboard-v2">
                <header className="feature-panel admin-overview-panel">
                    <div className="admin-overview-copy">
                        <div className="eyebrow">运营控制室</div>
                        <h1 className="section-title admin-page-title">内容运营与分发总控台</h1>
                        <p className="lead admin-page-lead">
                            用更清晰的运营界面查看增长、审核、项目资产和开放 API，把原来拥挤的一屏拆成真正可用的工作台。
                        </p>
                    </div>
                    <div className="admin-overview-actions">
                        <Link to="/editor" className="btn btn-primary">新建文章</Link>
                        <Link to="/" className="btn btn-ghost">查看首页</Link>
                    </div>
                    <div className="admin-summary-strip">
                        <div className="metric-card stat-panel"><span className="muted mono">ARTICLES</span><h2>{dashboard.summary.totalPosts}</h2><p>累计内容资产</p></div>
                        <div className="metric-card stat-panel"><span className="muted mono">VIEWS</span><h2>{dashboard.summary.totalViews}</h2><p>总浏览量</p></div>
                        <div className="metric-card stat-panel"><span className="muted mono">COMMENTS</span><h2>{dashboard.summary.totalComments}</h2><p>总评论与互动</p></div>
                        <div className="metric-card stat-panel"><span className="muted mono">QUEUE</span><h2>{dashboard.summary.pendingComments}</h2><p>待审核消息</p></div>
                    </div>
                </header>

                <section className="admin-analytics-stage">
                    <div className="feature-panel chart-panel chart-panel-wide" data-testid="dashboard-trend-chart">
                        <div className="editor-card-head">
                            <strong>内容热度趋势</strong>
                            <span className="command-hint">统计起始：{formatDateTime(dashboard.startedAt)}</span>
                        </div>
                        {dashboard.trend.length ? <EChart option={trendOption} className="echart-canvas" height={360} /> : <div className="empty-state">趋势统计会从这次升级后开始沉淀。</div>}
                    </div>

                    <div className="admin-side-stack">
                        <div className="feature-panel chart-panel" data-testid="dashboard-top-posts-chart">
                            <div className="editor-card-head"><strong>文章表现排行</strong><span className="command-hint">重点内容</span></div>
                            {dashboard.topPosts.length ? <EChart option={topPostsOption} className="echart-canvas" height={260} /> : <div className="empty-state">还没有足够的内容表现数据。</div>}
                        </div>
                        <div className="feature-panel chart-panel" data-testid="dashboard-comment-chart">
                            <div className="editor-card-head"><strong>评论健康度</strong><span className="command-hint">审核队列</span></div>
                            {(dashboard.commentStatus.pending || dashboard.commentStatus.approved || dashboard.commentStatus.rejected)
                                ? <EChart option={commentHealthOption} className="echart-canvas" height={260} />
                                : <div className="empty-state">当前还没有评论审核数据。</div>}
                        </div>
                    </div>
                </section>
                <section className="feature-panel">
                    <div className="editor-card-head"><strong>最近活动</strong><span className="command-hint">近时段动态</span></div>
                    <div className="activity-list activity-grid-list">
                        {dashboard.recentActivity.length ? dashboard.recentActivity.map((item) => (
                            <article key={`${item.type}-${item.createdAt}-${item.title}`} className="activity-tile">
                                <span className="chip mono">{item.type.replace('_', ' ')}</span>
                                <strong>{item.title}</strong>
                                <p className="muted">{item.description}</p>
                                <span className="command-hint">{formatDateTime(item.createdAt)}</span>
                            </article>
                        )) : <div className="empty-state">还没有可展示的活动记录。</div>}
                    </div>
                </section>

                <section className="feature-panel admin-workspace-panel">
                    <div className="editor-card-head admin-workspace-head">
                        <div>
                            <strong>工作台</strong>
                            <div className="muted">把内容操作和分发工具拆开，减少一屏拥挤感。</div>
                        </div>
                        <div className="workspace-switcher" role="tablist" aria-label="后台工作台切换">
                            <button type="button" className={`chip workspace-chip ${workspaceTab === 'content' ? 'is-active' : ''}`} onClick={() => setWorkspaceTab('content')}>内容管理</button>
                            <button type="button" className={`chip workspace-chip ${workspaceTab === 'distribution' ? 'is-active' : ''}`} onClick={() => setWorkspaceTab('distribution')}>分发与项目</button>
                        </div>
                    </div>

                    {workspaceTab === 'content' ? (
                        <div className="dashboard-grid admin-workspace-grid">
                            <div className="feature-panel nested-panel">
                                <div className="editor-card-head"><strong>文章管理</strong><span className="command-hint">{posts.length} 篇</span></div>
                                <div className="admin-list">
                                    {posts.length ? posts.map((post) => (
                                        <div key={post.id} className="admin-row" data-testid={`post-row-${post.slug}`}>
                                            <div className="admin-row-copy">
                                                <strong>{post.title}</strong>
                                                <div className="admin-row-meta">
                                                    <span className="chip">{post.published ? '已发布' : '草稿'}</span>
                                                    {post.featured ? <span className="chip">精选</span> : null}
                                                    {post.category ? <span className="chip">{post.category.name}</span> : null}
                                                </div>
                                            </div>
                                            <div className="admin-row-actions">
                                                <button type="button" className="btn btn-secondary" onClick={() => navigate(`/editor/${post.slug}`)}>编辑</button>
                                                <button type="button" className="btn btn-ghost" onClick={() => handleDeletePost(post.id)}>删除</button>
                                            </div>
                                        </div>
                                    )) : <div className="empty-state">当前还没有文章，建议先创建一篇代表内容。</div>}
                                </div>
                            </div>

                            <div className="feature-panel nested-panel" data-testid="pending-comments-panel">
                                <div className="editor-card-head"><strong>待审核评论</strong><span className="command-hint">{comments.length} 条</span></div>
                                <div className="admin-list">
                                    {comments.length ? comments.map((comment) => (
                                        <div key={comment.id} className="admin-row" data-testid={`pending-comment-${comment.id}`}>
                                            <div className="admin-row-copy">
                                                <strong>{comment.author}</strong>
                                                <div className="muted">{comment.content}</div>
                                                <div className="admin-row-meta">
                                                    {comment.post ? <span className="chip">{comment.post.title}</span> : null}
                                                    <span className="chip">{formatDateTime(comment.createdAt)}</span>
                                                </div>
                                            </div>
                                            <div className="admin-row-actions">
                                                <button type="button" className="btn btn-primary" data-testid={`approve-comment-${comment.id}`} onClick={() => handleCommentAction(comment.id, 'approved')}>通过</button>
                                                <button type="button" className="btn btn-ghost" onClick={() => handleCommentAction(comment.id, 'rejected')}>拒绝</button>
                                            </div>
                                        </div>
                                    )) : <div className="empty-state">评论队列已经清空。</div>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="dashboard-grid admin-workspace-grid admin-workspace-grid-wide">
                            <form className="feature-panel nested-panel" onSubmit={handleProjectSubmit} data-testid="project-form">
                                <div className="editor-card-head"><strong>{editingProjectId ? '编辑项目' : '新建项目'}</strong><span className="command-hint">PROJECT CMS</span></div>
                                <div className="two-grid">
                                    <label className="form-field"><span className="form-label">项目名称</span><input className="form-input" data-testid="project-name-input" value={projectForm.name} onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))} required /></label>
                                    <label className="form-field"><span className="form-label">项目标识</span><input className="form-input mono" data-testid="project-slug-input" value={projectForm.slug} onChange={(event) => setProjectForm((current) => ({ ...current, slug: event.target.value }))} /></label>
                                </div>
                                <label className="form-field"><span className="form-label">一句话摘要</span><input className="form-input" data-testid="project-summary-input" value={projectForm.summary} onChange={(event) => setProjectForm((current) => ({ ...current, summary: event.target.value }))} required /></label>
                                <label className="form-field"><span className="form-label">详细描述</span><textarea className="form-textarea" data-testid="project-description-input" value={projectForm.description} onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))} required /></label>
                                <label className="form-field"><span className="form-label">技术栈</span><input className="form-input" data-testid="project-techstack-input" value={projectForm.techStack} onChange={(event) => setProjectForm((current) => ({ ...current, techStack: event.target.value }))} /></label>
                                <div className="editor-card-head compact-head">
                                    <strong>项目封面</strong>
                                    <label className="btn btn-secondary" style={{ cursor: uploadingProjectCover ? 'wait' : 'pointer' }}>{uploadingProjectCover ? '上传封面中...' : '上传封面'}<input type="file" accept="image/*" onChange={handleProjectCoverUpload} style={{ display: 'none' }} /></label>
                                </div>
                                <label className="form-field"><span className="form-label">封面图片地址</span><input className="form-input" value={projectForm.coverImage} onChange={(event) => setProjectForm((current) => ({ ...current, coverImage: event.target.value }))} placeholder="https://..." /></label>
                                {projectForm.coverImage ? <div className="editor-cover-preview compact-cover-preview"><img src={projectForm.coverImage} alt={projectForm.name || '项目封面'} /></div> : null}
                                <div className="two-grid">
                                    <label className="form-field"><span className="form-label">线上地址</span><input className="form-input" data-testid="project-live-url-input" value={projectForm.liveUrl} onChange={(event) => setProjectForm((current) => ({ ...current, liveUrl: event.target.value }))} /></label>
                                    <label className="form-field"><span className="form-label">仓库地址</span><input className="form-input" data-testid="project-repo-url-input" value={projectForm.repoUrl} onChange={(event) => setProjectForm((current) => ({ ...current, repoUrl: event.target.value }))} /></label>
                                </div>
                                <div className="editor-toggle-list">
                                    <label className="chip"><input data-testid="project-featured-input" type="checkbox" checked={projectForm.featured} onChange={(event) => setProjectForm((current) => ({ ...current, featured: event.target.checked }))} />精选项目</label>
                                    <label className="chip"><span>排序</span><input type="number" data-testid="project-order-input" style={{ width: 72, background: 'transparent', border: 0, color: 'inherit' }} value={projectForm.order} onChange={(event) => setProjectForm((current) => ({ ...current, order: Number(event.target.value) || 0 }))} /></label>
                                </div>
                                <div className="admin-header-actions">
                                    <button type="submit" className="btn btn-primary" data-testid="project-submit-button" disabled={savingProject}>{savingProject ? '保存中...' : editingProjectId ? '更新项目' : '创建项目'}</button>
                                    <button type="button" className="btn btn-ghost" onClick={resetProjectForm}>重置</button>
                                </div>
                            </form>
                            <div className="feature-panel nested-panel api-key-panel">
                                <div className="editor-card-head"><strong>开放 API</strong><span className="command-hint">POSTS + MEDIA</span></div>
                                <form className="api-key-form" onSubmit={handleCreateApiKey}>
                                    <label className="form-field"><span className="form-label">Key 名称</span><input className="form-input" value={apiKeyName} onChange={(event) => setApiKeyName(event.target.value)} placeholder="Automation Publisher" /></label>
                                    <div className="metric-card api-scope-card"><span className="muted mono">权限范围</span><strong>posts:write / media:write</strong></div>
                                    <button type="submit" className="btn btn-primary" disabled={creatingApiKey}>{creatingApiKey ? '创建中...' : '创建 API Key'}</button>
                                </form>
                                {latestApiKey ? <div className="metric-card latest-key-card"><span className="muted mono">最新密钥</span><strong className="mono api-key-value">{latestApiKey}</strong><button type="button" className="btn btn-ghost" onClick={copyLatestApiKey}>复制</button></div> : null}
                                <div className="admin-list compact-admin-list">
                                    {apiKeys.length ? apiKeys.map((key) => (
                                        <div key={key.id} className="admin-row compact-admin-row">
                                            <div className="admin-row-copy">
                                                <strong>{key.name}</strong>
                                                <div className="admin-row-meta"><span className="chip mono">{key.keyPrefix}</span><span className="chip">{key.scopes.join(' / ')}</span>{key.revokedAt ? <span className="chip">已吊销</span> : <span className="chip">有效</span>}</div>
                                            </div>
                                            <div className="admin-row-actions"><span className="command-hint">{key.lastUsedAt ? `最近使用 ${formatDateTime(key.lastUsedAt)}` : '尚未使用'}</span>{!key.revokedAt ? <button type="button" className="btn btn-ghost" onClick={() => handleRevokeApiKey(key.id)}>吊销</button> : null}</div>
                                        </div>
                                    )) : <div className="empty-state">还没有开放 API Key，创建后可用于外部自动发文。</div>}
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                <section className="feature-panel">
                    <div className="editor-card-head"><strong>项目列表</strong><span className="command-hint">{projects.length} 个项目</span></div>
                    <div className="admin-list">
                        {projects.length ? projects.map((project) => (
                            <div key={project.id} className="admin-row" data-testid={`project-row-${project.slug}`}>
                                <div className="admin-row-copy">
                                    <strong>{project.name}</strong>
                                    <div className="muted">{project.summary}</div>
                                </div>
                                <div className="admin-row-actions">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        data-testid={`edit-project-${project.slug}`}
                                        onClick={() => {
                                            setEditingProjectId(project.id);
                                            setWorkspaceTab('distribution');
                                            setProjectForm({
                                                name: project.name,
                                                slug: project.slug,
                                                summary: project.summary,
                                                description: project.description,
                                                techStack: project.techStack,
                                                liveUrl: project.liveUrl || '',
                                                repoUrl: project.repoUrl || '',
                                                coverImage: project.coverImage || '',
                                                featured: project.featured,
                                                order: project.order,
                                            });
                                        }}
                                    >编辑</button>
                                    <button type="button" className="btn btn-ghost" data-testid={`delete-project-${project.slug}`} onClick={() => handleDeleteProject(project.id)}>删除</button>
                                </div>
                            </div>
                        )) : <div className="empty-state">还没有项目，建议补齐代表项目提升落地页完成度。</div>}
                    </div>
                </section>
            </div>
        </section>
    );
}
