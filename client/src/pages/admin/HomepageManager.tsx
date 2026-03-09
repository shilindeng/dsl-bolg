import { useEffect, useState } from 'react';
import { fetchAdminHomepage, fetchPosts, fetchProjects, saveAdminHomepage, type HomepageSection, type Post, type Project } from '../../api/client';
import SEO from '../../components/SEO';
import { useToast } from '../../hooks/useToast';

export default function HomepageManagerPage() {
    const { showToast } = useToast();
    const [sections, setSections] = useState<HomepageSection[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([
            fetchAdminHomepage(),
            fetchPosts({ limit: 20 }),
            fetchProjects(),
        ])
            .then(([homepage, postResponse, projectResponse]) => {
                setSections(homepage.sections);
                setPosts(postResponse.data);
                setProjects(projectResponse);
            })
            .catch(() => showToast('首页编排数据加载失败。', 'error'));
    }, [showToast]);

    const updateSection = (type: string, patch: Partial<HomepageSection>) => {
        setSections((current) => current.map((section) => section.type === type ? { ...section, ...patch } : section));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveAdminHomepage(sections);
            showToast('首页编排已保存。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '首页编排保存失败。', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <SEO title="首页编排" description="配置首页模块顺序、文案和内容来源。" />
            <section className="section">
                <div className="container admin-shell">
                    <header className="feature-panel">
                        <div className="section-heading">
                            <div>
                                <div className="eyebrow">Homepage Composer</div>
                                <h1 className="section-title">首页编排面板</h1>
                            </div>
                            <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
                                {saving ? '保存中...' : '保存首页配置'}
                            </button>
                        </div>
                    </header>

                    <div className="dashboard-grid admin-manager-grid">
                        <div className="section-stack">
                            {sections.map((section) => (
                                <article key={section.id} className="feature-panel section-editor-card">
                                    <div className="section-heading">
                                        <div>
                                            <div className="eyebrow">{section.type}</div>
                                            <h2 className="section-title">{section.title || section.type}</h2>
                                        </div>
                                        <label className="chip">
                                            <input type="checkbox" checked={section.enabled} onChange={(event) => updateSection(section.type, { enabled: event.target.checked })} />
                                            启用
                                        </label>
                                    </div>
                                    <div className="two-grid">
                                        <label className="form-field"><span className="form-label">排序</span><input className="form-input" type="number" value={section.sortOrder} onChange={(event) => updateSection(section.type, { sortOrder: Number(event.target.value) || 0 })} /></label>
                                        <label className="form-field"><span className="form-label">数据来源</span><input className="form-input" value={section.sourceType} onChange={(event) => updateSection(section.type, { sourceType: event.target.value })} /></label>
                                    </div>
                                    <label className="form-field"><span className="form-label">Eyebrow</span><input className="form-input" value={section.eyebrow || ''} onChange={(event) => updateSection(section.type, { eyebrow: event.target.value })} /></label>
                                    <label className="form-field"><span className="form-label">标题</span><input className="form-input" value={section.title || ''} onChange={(event) => updateSection(section.type, { title: event.target.value })} /></label>
                                    <label className="form-field"><span className="form-label">描述</span><textarea className="form-textarea" value={section.description || ''} onChange={(event) => updateSection(section.type, { description: event.target.value })} /></label>
                                    <div className="two-grid">
                                        <label className="form-field"><span className="form-label">CTA 文案</span><input className="form-input" value={section.ctaLabel || ''} onChange={(event) => updateSection(section.type, { ctaLabel: event.target.value })} /></label>
                                        <label className="form-field"><span className="form-label">CTA 链接</span><input className="form-input" value={section.ctaHref || ''} onChange={(event) => updateSection(section.type, { ctaHref: event.target.value })} /></label>
                                    </div>
                                    <label className="form-field"><span className="form-label">configJson</span><textarea className="form-textarea mono" value={section.configJson || '{}'} onChange={(event) => updateSection(section.type, { configJson: event.target.value })} /></label>
                                </article>
                            ))}
                        </div>

                        <div className="section-stack">
                            <div className="feature-panel">
                                <div className="section-heading">
                                    <div>
                                        <div className="eyebrow">Post Catalog</div>
                                        <h2 className="section-title">可选文章</h2>
                                    </div>
                                </div>
                                <div className="account-list">
                                    {posts.map((post) => (
                                        <article key={post.id} className="archive-row">
                                            <div>
                                                <h3>{post.title}</h3>
                                                <p>ID {post.id} / {post.slug}</p>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                            <div className="feature-panel">
                                <div className="section-heading">
                                    <div>
                                        <div className="eyebrow">Project Catalog</div>
                                        <h2 className="section-title">可选项目</h2>
                                    </div>
                                </div>
                                <div className="account-list">
                                    {projects.map((project) => (
                                        <article key={project.id} className="archive-row">
                                            <div>
                                                <h3>{project.name}</h3>
                                                <p>ID {project.id} / {project.slug}</p>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
