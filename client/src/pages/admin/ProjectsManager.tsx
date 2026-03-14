import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    createProject,
    deleteProject,
    fetchAdminProjects,
    updateProject,
    uploadImage,
    type Project,
} from '../../api/client';
import SEO from '../../components/SEO';
import SiteIcon from '../../components/SiteIcon';
import { useToast } from '../../hooks/useToast';
import { validateImageFile } from '../../lib/uploads';

const emptyProject = {
    name: '',
    slug: '',
    headline: '',
    summary: '',
    description: '',
    techStack: '',
    published: false,
    status: '',
    period: '',
    role: '',
    liveUrl: '',
    repoUrl: '',
    coverImage: '',
    featured: false,
    order: 0,
};

export default function ProjectsManagerPage() {
    const { showToast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
    const [projectForm, setProjectForm] = useState(emptyProject);
    const [uploadingCover, setUploadingCover] = useState(false);

    const loadProjects = async () => {
        const response = await fetchAdminProjects();
        setProjects(response);
    };

    useEffect(() => {
        loadProjects()
            .catch(() => showToast('项目数据读取失败。', 'error'))
            .finally(() => setLoading(false));
    }, [showToast]);

    const resetForm = () => {
        setEditingProjectId(null);
        setProjectForm(emptyProject);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);

        const payload = {
            ...projectForm,
            headline: projectForm.headline || null,
            status: projectForm.status || null,
            period: projectForm.period || null,
            role: projectForm.role || null,
            liveUrl: projectForm.liveUrl || null,
            repoUrl: projectForm.repoUrl || null,
            coverImage: projectForm.coverImage || null,
        };

        try {
            if (editingProjectId) {
                await updateProject(editingProjectId, payload);
            } else {
                await createProject(payload);
            }

            await loadProjects();
            resetForm();
            showToast('项目已保存。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '项目保存失败。', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        setDeletingId(id);
        try {
            await deleteProject(id);
            await loadProjects();
            if (editingProjectId === id) {
                resetForm();
            }
            showToast('项目已删除。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '项目删除失败。', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.length) {
            return;
        }

        setUploadingCover(true);
        try {
            const file = event.target.files[0];
            validateImageFile(file);
            const result = await uploadImage(file);
            setProjectForm((current) => ({ ...current, coverImage: result.url }));
            showToast(`项目封面上传成功，已保存到 ${result.storage.toUpperCase()}。`, 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '项目封面上传失败。', 'error');
        } finally {
            setUploadingCover(false);
            event.target.value = '';
        }
    };

    return (
        <>
            <SEO title="项目管理" description="维护公开项目、案例状态与项目卡片素材。" />

            <section className="section">
                <div className="container admin-shell">
                    <header className="feature-panel">
                        <div className="section-heading">
                            <div>
                                <div className="eyebrow">Projects</div>
                                <h1 className="section-title">项目管理</h1>
                                <p className="section-copy">项目改成显式发布控制。草稿不会直接暴露到公开页与首页精选。</p>
                            </div>
                            <div className="hero-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => void loadProjects()}>
                                    <SiteIcon name="spark" size={14} />
                                    <span>刷新</span>
                                </button>
                                <button type="button" className="btn btn-ghost" onClick={resetForm}>重置表单</button>
                            </div>
                        </div>
                    </header>

                    <div className="dashboard-grid admin-workspace-grid-wide">
                        <form className="feature-panel" onSubmit={handleSubmit}>
                            <div className="editor-card-head">
                                <strong>{editingProjectId ? '编辑项目' : '新建项目'}</strong>
                                <span className="command-hint">{editingProjectId ? 'UPDATE' : 'CREATE'}</span>
                            </div>

                            <div className="two-grid">
                                <label className="form-field">
                                    <span className="form-label">项目名称</span>
                                    <input className="form-input" value={projectForm.name} onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))} required />
                                </label>
                                <label className="form-field">
                                    <span className="form-label">项目标识</span>
                                    <input className="form-input mono" value={projectForm.slug} onChange={(event) => setProjectForm((current) => ({ ...current, slug: event.target.value }))} placeholder="可留空自动生成" />
                                </label>
                            </div>

                            <label className="form-field">
                                <span className="form-label">案例标题 / Headline</span>
                                <input className="form-input" value={projectForm.headline} onChange={(event) => setProjectForm((current) => ({ ...current, headline: event.target.value }))} />
                            </label>

                            <label className="form-field">
                                <span className="form-label">一句话摘要</span>
                                <textarea className="form-textarea" value={projectForm.summary} onChange={(event) => setProjectForm((current) => ({ ...current, summary: event.target.value }))} required />
                            </label>

                            <label className="form-field">
                                <span className="form-label">详细描述</span>
                                <textarea className="form-textarea" value={projectForm.description} onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))} required />
                            </label>

                            <label className="form-field">
                                <span className="form-label">技术栈</span>
                                <input className="form-input" value={projectForm.techStack} onChange={(event) => setProjectForm((current) => ({ ...current, techStack: event.target.value }))} placeholder="React, TypeScript, Express" />
                            </label>

                            <div className="two-grid">
                                <label className="form-field">
                                    <span className="form-label">项目状态</span>
                                    <input className="form-input" value={projectForm.status} onChange={(event) => setProjectForm((current) => ({ ...current, status: event.target.value }))} placeholder="Live / Beta / Internal" />
                                </label>
                                <label className="form-field">
                                    <span className="form-label">项目周期</span>
                                    <input className="form-input" value={projectForm.period} onChange={(event) => setProjectForm((current) => ({ ...current, period: event.target.value }))} placeholder="2025 - 2026" />
                                </label>
                            </div>

                            <label className="form-field">
                                <span className="form-label">我在项目中的角色</span>
                                <input className="form-input" value={projectForm.role} onChange={(event) => setProjectForm((current) => ({ ...current, role: event.target.value }))} placeholder="Product / Design / Frontend" />
                            </label>

                            <div className="two-grid">
                                <label className="form-field">
                                    <span className="form-label">线上地址</span>
                                    <input className="form-input" value={projectForm.liveUrl} onChange={(event) => setProjectForm((current) => ({ ...current, liveUrl: event.target.value }))} />
                                </label>
                                <label className="form-field">
                                    <span className="form-label">仓库地址</span>
                                    <input className="form-input" value={projectForm.repoUrl} onChange={(event) => setProjectForm((current) => ({ ...current, repoUrl: event.target.value }))} />
                                </label>
                            </div>

                            <div className="editor-card-head compact-head">
                                <strong>项目封面</strong>
                                <label className="btn btn-secondary" style={{ cursor: uploadingCover ? 'wait' : 'pointer' }}>
                                    {uploadingCover ? '上传封面中...' : '上传封面'}
                                    <input type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} />
                                </label>
                            </div>

                            <label className="form-field">
                                <span className="form-label">封面图片地址</span>
                                <input className="form-input" value={projectForm.coverImage} onChange={(event) => setProjectForm((current) => ({ ...current, coverImage: event.target.value }))} placeholder="https://..." />
                            </label>

                            {projectForm.coverImage ? (
                                <div className="editor-cover-preview compact-cover-preview">
                                    <img src={projectForm.coverImage} alt={projectForm.name || '项目封面'} />
                                </div>
                            ) : null}

                            <div className="editor-toggle-list">
                                <label className="chip">
                                    <input type="checkbox" checked={projectForm.published} onChange={(event) => setProjectForm((current) => ({ ...current, published: event.target.checked }))} />
                                    公开发布
                                </label>
                                <label className="chip">
                                    <input type="checkbox" checked={projectForm.featured} onChange={(event) => setProjectForm((current) => ({ ...current, featured: event.target.checked }))} />
                                    精选项目
                                </label>
                                <label className="chip">
                                    <span>排序</span>
                                    <input type="number" value={projectForm.order} style={{ width: 72, background: 'transparent', border: 0, color: 'inherit' }} onChange={(event) => setProjectForm((current) => ({ ...current, order: Number(event.target.value) || 0 }))} />
                                </label>
                            </div>

                            <div className="hero-actions">
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '保存中...' : editingProjectId ? '更新项目' : '创建项目'}</button>
                                <button type="button" className="btn btn-ghost" onClick={resetForm}>清空</button>
                            </div>
                        </form>

                        <section className="feature-panel">
                            <div className="editor-card-head">
                                <strong>项目列表</strong>
                                <span className="command-hint">{loading ? '加载中...' : `${projects.length} 个项目`}</span>
                            </div>

                            {loading ? (
                                <div className="empty-state">正在读取项目列表...</div>
                            ) : projects.length ? (
                                <div className="admin-list">
                                    {projects.map((project) => (
                                        <article key={project.id} className="admin-row">
                                            <div className="admin-row-copy">
                                                <strong>{project.name}</strong>
                                                <div className="admin-row-meta">
                                                    <span className="chip">{project.published ? '公开' : '草稿'}</span>
                                                    {project.featured ? <span className="chip">精选</span> : null}
                                                    {project.status ? <span className="chip">{project.status}</span> : null}
                                                    <span className="chip">#{project.order.toString().padStart(2, '0')}</span>
                                                </div>
                                                <p className="muted">{project.summary || project.description}</p>
                                            </div>
                                            <div className="admin-row-actions">
                                                {project.published ? <Link to={`/projects/${project.slug}`} className="btn btn-ghost">预览</Link> : null}
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={() => {
                                                        setEditingProjectId(project.id);
                                                        setProjectForm({
                                                            name: project.name,
                                                            slug: project.slug,
                                                            headline: project.headline || '',
                                                            summary: project.summary,
                                                            description: project.description,
                                                            techStack: project.techStack,
                                                            published: project.published,
                                                            status: project.status || '',
                                                            period: project.period || '',
                                                            role: project.role || '',
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
                                                <button type="button" className="btn btn-ghost" disabled={deletingId === project.id} onClick={() => void handleDelete(project.id)}>
                                                    {deletingId === project.id ? '删除中...' : '删除'}
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">还没有项目。</div>
                            )}
                        </section>
                    </div>
                </div>
            </section>
        </>
    );
}
