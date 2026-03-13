import { useEffect, useMemo, useState } from 'react';
import { fetchAdminHomepage, fetchPosts, fetchProjects, saveAdminHomepage, type HomepageSection, type Post, type Project } from '../../api/client';
import SEO from '../../components/SEO';
import SiteIcon from '../../components/SiteIcon';
import { useToast } from '../../hooks/useToast';

type HomepageConfig = NonNullable<HomepageSection['config']>;

function parseConfig(section: HomepageSection): HomepageConfig {
    if (section.config) {
        return section.config;
    }

    if (!section.configJson) {
        return {};
    }

    try {
        return JSON.parse(section.configJson) as HomepageConfig;
    } catch {
        return {};
    }
}

function serializeConfig(config: HomepageConfig) {
    return JSON.stringify(config);
}

function toggleId(list: number[] | undefined, id: number) {
    const source = list || [];
    return source.includes(id) ? source.filter((item) => item !== id) : [...source, id];
}

function isContentSection(type: string) {
    return type === 'featured_posts' || type === 'featured_projects';
}

export default function HomepageManagerPage() {
    const { showToast } = useToast();
    const [sections, setSections] = useState<HomepageSection[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([
            fetchAdminHomepage(),
            fetchPosts({ limit: 40 }),
            fetchProjects(),
        ])
            .then(([homepage, postResponse, projectResponse]) => {
                setSections(
                    homepage.sections.map((section) => ({
                        ...section,
                        config: parseConfig(section),
                    })),
                );
                setPosts(postResponse.data);
                setProjects(projectResponse);
            })
            .catch(() => showToast('首页编排数据加载失败。', 'error'));
    }, [showToast]);

    const sectionMap = useMemo(
        () => new Map(sections.map((section) => [section.type, section])),
        [sections],
    );

    const updateSection = (type: string, patch: Partial<HomepageSection>) => {
        setSections((current) =>
            current.map((section) => (section.type === type ? { ...section, ...patch } : section)),
        );
    };

    const updateSectionConfig = (type: string, patch: Partial<HomepageConfig>) => {
        setSections((current) =>
            current.map((section) => {
                if (section.type !== type) {
                    return section;
                }

                const nextConfig = { ...parseConfig(section), ...patch };
                return {
                    ...section,
                    config: nextConfig,
                    configJson: serializeConfig(nextConfig),
                };
            }),
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveAdminHomepage(
                sections.map((section) => ({
                    ...section,
                    configJson: serializeConfig(parseConfig(section)),
                })),
            );
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
                                <p className="section-copy">把精选内容、归档入口和作者 CTA 变成可维护的运营配置，而不是继续手改 JSON。</p>
                            </div>
                            <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
                                {saving ? '保存中...' : '保存首页配置'}
                            </button>
                        </div>
                    </header>

                    <div className="dashboard-grid admin-manager-grid">
                        <div className="section-stack">
                            {sections.map((section) => {
                                const config = parseConfig(section);
                                const selectedPosts = (config.postIds || []).map((id) => posts.find((post) => post.id === id)).filter(Boolean) as Post[];
                                const selectedProjects = (config.projectIds || []).map((id) => projects.find((project) => project.id === id)).filter(Boolean) as Project[];

                                return (
                                    <article key={section.id} className="feature-panel section-editor-card">
                                        <div className="section-heading">
                                            <div>
                                                <div className="eyebrow">{section.type}</div>
                                                <h2 className="section-title">{section.title || section.type}</h2>
                                            </div>
                                            <label className="chip">
                                                <input
                                                    type="checkbox"
                                                    checked={section.enabled}
                                                    onChange={(event) => updateSection(section.type, { enabled: event.target.checked })}
                                                />
                                                启用
                                            </label>
                                        </div>

                                        <div className="two-grid">
                                            <label className="form-field">
                                                <span className="form-label">排序</span>
                                                <input
                                                    className="form-input"
                                                    type="number"
                                                    value={section.sortOrder}
                                                    onChange={(event) => updateSection(section.type, { sortOrder: Number(event.target.value) || 0 })}
                                                />
                                            </label>
                                            <label className="form-field">
                                                <span className="form-label">数据来源</span>
                                                <input
                                                    className="form-input"
                                                    value={section.sourceType}
                                                    onChange={(event) => updateSection(section.type, { sourceType: event.target.value })}
                                                />
                                            </label>
                                        </div>

                                        <label className="form-field">
                                            <span className="form-label">Eyebrow</span>
                                            <input className="form-input" value={section.eyebrow || ''} onChange={(event) => updateSection(section.type, { eyebrow: event.target.value })} />
                                        </label>
                                        <label className="form-field">
                                            <span className="form-label">标题</span>
                                            <input className="form-input" value={section.title || ''} onChange={(event) => updateSection(section.type, { title: event.target.value })} />
                                        </label>
                                        <label className="form-field">
                                            <span className="form-label">描述</span>
                                            <textarea className="form-textarea" value={section.description || ''} onChange={(event) => updateSection(section.type, { description: event.target.value })} />
                                        </label>

                                        <div className="two-grid">
                                            <label className="form-field">
                                                <span className="form-label">CTA 文案</span>
                                                <input className="form-input" value={section.ctaLabel || ''} onChange={(event) => updateSection(section.type, { ctaLabel: event.target.value })} />
                                            </label>
                                            <label className="form-field">
                                                <span className="form-label">CTA 链接</span>
                                                <input className="form-input" value={section.ctaHref || ''} onChange={(event) => updateSection(section.type, { ctaHref: event.target.value })} />
                                            </label>
                                        </div>

                                        {isContentSection(section.type) ? (
                                            <div className="feature-panel nested-panel">
                                                <div className="section-heading">
                                                    <div>
                                                        <div className="eyebrow">Structured Config</div>
                                                        <h3 className="section-title compact-title">精选规则</h3>
                                                    </div>
                                                </div>

                                                <div className="hero-actions">
                                                    <label className="chip">
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(config.autoFill)}
                                                            onChange={(event) => updateSectionConfig(section.type, { autoFill: event.target.checked })}
                                                        />
                                                        自动填充
                                                    </label>
                                                    <label className="chip">
                                                        <span>数量</span>
                                                        <input
                                                            type="number"
                                                            value={config.limit || 4}
                                                            onChange={(event) => updateSectionConfig(section.type, { limit: Number(event.target.value) || 4 })}
                                                            style={{ width: 64, background: 'transparent', border: 0, color: 'inherit' }}
                                                        />
                                                    </label>
                                                </div>

                                                <div className="form-field">
                                                    <span className="form-label">{section.type === 'featured_posts' ? '手动指定文章' : '手动指定项目'}</span>
                                                    <div className="tag-list">
                                                        {(section.type === 'featured_posts' ? posts : projects).map((item) => {
                                                            const selected = section.type === 'featured_posts'
                                                                ? (config.postIds || []).includes(item.id)
                                                                : (config.projectIds || []).includes(item.id);

                                                            return (
                                                                <button
                                                                    key={item.id}
                                                                    type="button"
                                                                    className={`filter-chip ${selected ? 'is-active' : ''}`}
                                                                    onClick={() =>
                                                                        updateSectionConfig(
                                                                            section.type,
                                                                            section.type === 'featured_posts'
                                                                                ? { postIds: toggleId(config.postIds, item.id) }
                                                                                : { projectIds: toggleId(config.projectIds, item.id) },
                                                                        )
                                                                    }
                                                                >
                                                                    {'title' in item ? item.title : item.name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="list-block">
                                                    {(section.type === 'featured_posts' ? selectedPosts : selectedProjects).map((item) => (
                                                        <div key={item.id} className="list-item">
                                                            <SiteIcon name={section.type === 'featured_posts' ? 'book-open' : 'briefcase'} size={14} />
                                                            <span>{'title' in item ? item.title : item.name}</span>
                                                        </div>
                                                    ))}
                                                    {(section.type === 'featured_posts' ? selectedPosts : selectedProjects).length === 0 ? (
                                                        <span className="muted">当前未手动指定内容；启用自动填充时会按公开内容自动取数。</span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="form-field">
                                                <span className="form-label">configJson</span>
                                                <textarea className="form-textarea mono" value={section.configJson || '{}'} onChange={(event) => updateSection(section.type, { configJson: event.target.value })} />
                                            </label>
                                        )}
                                    </article>
                                );
                            })}
                        </div>

                        <div className="section-stack">
                            <div className="feature-panel">
                                <div className="section-heading">
                                    <div>
                                        <div className="eyebrow">Homepage Rules</div>
                                        <h2 className="section-title">运营建议</h2>
                                    </div>
                                </div>
                                <div className="list-block">
                                    <div className="list-item">
                                        <SiteIcon name="check" size={14} />
                                        <span>首屏至少保证 1 篇代表文章和 1 个代表项目，不让 Issue 区落空。</span>
                                    </div>
                                    <div className="list-item">
                                        <SiteIcon name="check" size={14} />
                                        <span>精选文章优先挑“能建立判断力”的长文，而不是仅看发布时间。</span>
                                    </div>
                                    <div className="list-item">
                                        <SiteIcon name="check" size={14} />
                                        <span>项目位优先放案例完整、角色明确、可访问的项目详情页。</span>
                                    </div>
                                </div>
                            </div>

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

                            {sectionMap.get('featured_posts') ? (
                                <div className="feature-panel">
                                    <div className="section-heading">
                                        <div>
                                            <div className="eyebrow">Current Output</div>
                                            <h2 className="section-title">当前精选配置摘要</h2>
                                        </div>
                                    </div>
                                    <div className="list-block">
                                        <div className="list-item">
                                            <SiteIcon name="book-open" size={14} />
                                            <span>{sectionMap.get('featured_posts')?.configJson || '{}'}</span>
                                        </div>
                                        <div className="list-item">
                                            <SiteIcon name="briefcase" size={14} />
                                            <span>{sectionMap.get('featured_projects')?.configJson || '{}'}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
