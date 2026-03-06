import { useEffect, useState } from 'react';
import {
    createProject,
    deleteProject,
    fetchAdminComments,
    fetchAnalyticsSummary,
    fetchProjects,
    fetchTopPosts,
    updateCommentStatus,
    updateProject,
    type Comment,
    type Project,
} from '../../api/client';
import { formatDateTime } from '../../lib/format';
import { useToast } from '../../hooks/useToast';

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

export default function Dashboard() {
    const { showToast } = useToast();
    const [summary, setSummary] = useState({
        totalPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        pendingComments: 0,
    });
    const [topPosts, setTopPosts] = useState<Array<{ id: number; slug: string; title: string; views: number; likes: number }>>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectForm, setProjectForm] = useState(emptyProject);
    const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const reload = async () => {
        const [summaryResponse, topPostsResponse, commentsResponse, projectResponse] = await Promise.all([
            fetchAnalyticsSummary(),
            fetchTopPosts(),
            fetchAdminComments('pending'),
            fetchProjects(),
        ]);

        setSummary(summaryResponse);
        setTopPosts(topPostsResponse);
        setComments(commentsResponse);
        setProjects(projectResponse);
    };

    useEffect(() => {
        reload()
            .catch(() => showToast('后台数据读取失败。', 'error'))
            .finally(() => setLoading(false));
    }, [showToast]);

    const handleCommentAction = async (id: number, status: 'approved' | 'rejected') => {
        try {
            await updateCommentStatus(id, status);
            await reload();
            showToast(status === 'approved' ? '评论已通过审核。' : '评论已拒绝。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '评论审核失败。', 'error');
        }
    };

    const resetProjectForm = () => {
        setProjectForm(emptyProject);
        setEditingProjectId(null);
    };

    const handleProjectSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

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
            <div className="container" style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                    <div className="eyebrow">Admin Dashboard</div>
                    <h1 className="section-title" style={{ marginTop: '1rem' }}>内容控制台</h1>
                </div>

                <div className="three-grid">
                    <div className="panel">
                        <div className="panel-body">
                            <span className="muted mono">文章总数</span>
                            <h2>{summary.totalPosts}</h2>
                        </div>
                    </div>
                    <div className="panel">
                        <div className="panel-body">
                            <span className="muted mono">总浏览</span>
                            <h2>{summary.totalViews}</h2>
                        </div>
                    </div>
                    <div className="panel">
                        <div className="panel-body">
                            <span className="muted mono">待审核评论</span>
                            <h2>{summary.pendingComments}</h2>
                        </div>
                    </div>
                </div>

                <div className="split-grid">
                    <div className="panel">
                        <div className="panel-body" style={{ display: 'grid', gap: '1rem' }}>
                            <strong>高浏览文章</strong>
                            {topPosts.map((post) => (
                                <div key={post.id} className="metric-card">
                                    <strong>{post.title}</strong>
                                    <div className="muted">浏览 {post.views} / 点赞 {post.likes}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-body" style={{ display: 'grid', gap: '1rem' }} data-testid="pending-comments-panel">
                            <strong>待审核评论</strong>
                            {comments.length === 0 ? (
                                <div className="empty-state">当前没有待审核评论。</div>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className="metric-card" data-testid={`pending-comment-${comment.id}`} style={{ display: 'grid', gap: '0.65rem' }}>
                                        <div>
                                            <strong>{comment.author}</strong>
                                            <div className="muted" style={{ fontSize: '0.88rem' }}>
                                                {comment.post?.title} · {formatDateTime(comment.createdAt)}
                                            </div>
                                        </div>
                                        <p style={{ margin: 0 }}>{comment.content}</p>
                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                data-testid={`approve-comment-${comment.id}`}
                                                onClick={() => handleCommentAction(comment.id, 'approved')}
                                            >
                                                通过
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-ghost"
                                                data-testid={`reject-comment-${comment.id}`}
                                                onClick={() => handleCommentAction(comment.id, 'rejected')}
                                            >
                                                拒绝
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="split-grid">
                    <form className="panel" onSubmit={handleProjectSubmit} data-testid="project-form">
                        <div className="panel-body" style={{ display: 'grid', gap: '1rem' }}>
                            <strong>{editingProjectId ? '编辑项目' : '新增项目'}</strong>
                            <div className="two-grid">
                                <label className="form-field">
                                    <span className="form-label">项目名称</span>
                                    <input
                                        className="form-input"
                                        data-testid="project-name-input"
                                        value={projectForm.name}
                                        onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))}
                                    />
                                </label>
                                <label className="form-field">
                                    <span className="form-label">Slug</span>
                                    <input
                                        className="form-input"
                                        data-testid="project-slug-input"
                                        value={projectForm.slug}
                                        onChange={(event) => setProjectForm((current) => ({ ...current, slug: event.target.value }))}
                                    />
                                </label>
                            </div>

                            <label className="form-field">
                                <span className="form-label">Summary</span>
                                <input
                                    className="form-input"
                                    data-testid="project-summary-input"
                                    value={projectForm.summary}
                                    onChange={(event) => setProjectForm((current) => ({ ...current, summary: event.target.value }))}
                                />
                            </label>

                            <label className="form-field">
                                <span className="form-label">Description</span>
                                <textarea
                                    className="form-textarea"
                                    data-testid="project-description-input"
                                    value={projectForm.description}
                                    onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))}
                                />
                            </label>

                            <label className="form-field">
                                <span className="form-label">Tech Stack</span>
                                <input
                                    className="form-input"
                                    data-testid="project-techstack-input"
                                    value={projectForm.techStack}
                                    onChange={(event) => setProjectForm((current) => ({ ...current, techStack: event.target.value }))}
                                />
                            </label>

                            <div className="two-grid">
                                <label className="form-field">
                                    <span className="form-label">Live URL</span>
                                    <input
                                        className="form-input"
                                        data-testid="project-live-url-input"
                                        value={projectForm.liveUrl}
                                        onChange={(event) => setProjectForm((current) => ({ ...current, liveUrl: event.target.value }))}
                                    />
                                </label>
                                <label className="form-field">
                                    <span className="form-label">Repo URL</span>
                                    <input
                                        className="form-input"
                                        data-testid="project-repo-url-input"
                                        value={projectForm.repoUrl}
                                        onChange={(event) => setProjectForm((current) => ({ ...current, repoUrl: event.target.value }))}
                                    />
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                                <label className="chip">
                                    <input
                                        data-testid="project-featured-input"
                                        type="checkbox"
                                        checked={projectForm.featured}
                                        onChange={(event) => setProjectForm((current) => ({ ...current, featured: event.target.checked }))}
                                    />
                                    精选项目
                                </label>
                                <label className="chip">
                                    <span>排序</span>
                                    <input
                                        type="number"
                                        data-testid="project-order-input"
                                        style={{ width: 72, background: 'transparent', border: 0, color: 'inherit' }}
                                        value={projectForm.order}
                                        onChange={(event) => setProjectForm((current) => ({ ...current, order: Number(event.target.value) || 0 }))}
                                    />
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <button type="submit" className="btn btn-primary" data-testid="project-submit-button">
                                    {editingProjectId ? '更新项目' : '创建项目'}
                                </button>
                                <button type="button" className="btn btn-ghost" onClick={resetProjectForm}>重置</button>
                            </div>
                        </div>
                    </form>

                    <div className="panel">
                        <div className="panel-body" style={{ display: 'grid', gap: '1rem' }}>
                            <strong>项目列表</strong>
                            {projects.map((project) => (
                                <div key={project.id} className="metric-card" data-testid={`project-row-${project.slug}`} style={{ display: 'grid', gap: '0.65rem' }}>
                                    <div>
                                        <strong>{project.name}</strong>
                                        <div className="muted">{project.summary}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            data-testid={`edit-project-${project.slug}`}
                                            onClick={() => {
                                                setEditingProjectId(project.id);
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
                                        >
                                            编辑
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost"
                                            data-testid={`delete-project-${project.slug}`}
                                            onClick={() => handleDeleteProject(project.id)}
                                        >
                                            删除
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
