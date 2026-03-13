import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchProject, type Project } from '../api/client';
import LazyImage from '../components/LazyImage';
import SEO from '../components/SEO';
import SiteIcon from '../components/SiteIcon';
import { siteConfig } from '../config/site';
import { splitTechStack } from '../lib/content';

function getProjectSummary(project: Project) {
    return project.summary?.trim() || project.description;
}

export default function ProjectDetail() {
    const { slug } = useParams<{ slug: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) {
            return;
        }

        let cancelled = false;
        setLoading(true);

        fetchProject(slug)
            .then((response) => {
                if (!cancelled) {
                    setProject(response);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setProject(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [slug]);

    const techStack = useMemo(() => splitTechStack(project?.techStack || ''), [project?.techStack]);

    if (loading) {
        return (
            <section className="section">
                <div className="container">
                    <div className="empty-state">正在加载项目详情...</div>
                </div>
            </section>
        );
    }

    if (!project) {
        return (
            <section className="section">
                <div className="container">
                    <div className="empty-state">
                        <span className="eyebrow">Project</span>
                        <h1 className="section-title">项目不存在</h1>
                        <p className="section-copy">这个案例可能尚未公开，或当前链接已经失效。</p>
                        <div className="hero-actions">
                            <Link to="/projects" className="btn btn-primary">
                                <SiteIcon name="briefcase" size={14} />
                                <span>返回项目页</span>
                            </Link>
                            <Link to="/" className="btn btn-secondary">
                                <SiteIcon name="home" size={14} />
                                <span>回到首页</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    const projectUrl = `${siteConfig.url}/projects/${project.slug}`;
    const projectSummary = getProjectSummary(project);

    return (
        <>
            <SEO
                title={project.name}
                description={projectSummary}
                image={project.coverImage ?? undefined}
                url={projectUrl}
                jsonLd={{
                    '@context': 'https://schema.org',
                    '@type': 'CreativeWork',
                    name: project.name,
                    description: projectSummary,
                    url: projectUrl,
                    image: project.coverImage ? `${siteConfig.url}${project.coverImage}` : `${siteConfig.url}${siteConfig.defaultOgImage}`,
                    author: {
                        '@type': 'Person',
                        name: siteConfig.author.name,
                    },
                }}
            />

            <section className="section page-compact-hero project-detail-hero">
                <div className="container page-compact-grid project-detail-grid">
                    <div className="project-detail-copy">
                        <Link to="/projects" className="section-link back-link">
                            <SiteIcon name="chevron-right" size={14} style={{ transform: 'rotate(180deg)' }} />
                            <span>返回项目列表</span>
                        </Link>
                        <span className="eyebrow">Case Study</span>
                        <h1 className="section-title">{project.name}</h1>
                        {project.headline ? <p className="project-detail-headline">{project.headline}</p> : null}
                        <p className="section-copy project-detail-lead">{projectSummary}</p>

                        <div className="meta-inline">
                            {project.status ? (
                                <span className="meta-pill">
                                    <SiteIcon name="check" size={13} />
                                    <span>{project.status}</span>
                                </span>
                            ) : null}
                            {project.period ? (
                                <span className="meta-pill">
                                    <SiteIcon name="calendar" size={13} />
                                    <span>{project.period}</span>
                                </span>
                            ) : null}
                            {project.role ? (
                                <span className="meta-pill">
                                    <SiteIcon name="user" size={13} />
                                    <span>{project.role}</span>
                                </span>
                            ) : null}
                        </div>

                        <div className="hero-actions">
                            {project.liveUrl ? (
                                <a href={project.liveUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                                    <SiteIcon name="external" size={14} />
                                    <span>访问项目</span>
                                </a>
                            ) : null}
                            {project.repoUrl ? (
                                <a href={project.repoUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
                                    <SiteIcon name="github" size={14} />
                                    <span>查看代码</span>
                                </a>
                            ) : null}
                        </div>
                    </div>

                    <div className="project-detail-side">
                        <div className="project-detail-cover">
                            {project.coverImage ? (
                                <LazyImage src={project.coverImage} alt={project.name} />
                            ) : (
                                <div className="visual-placeholder">
                                    <span className="visual-badge">
                                        <SiteIcon name="briefcase" size={14} />
                                        <span>case study</span>
                                    </span>
                                    <strong>{project.headline || project.name}</strong>
                                </div>
                            )}
                        </div>

                        <div className="feature-panel project-detail-facts">
                            <div className="section-heading compact-head">
                                <div>
                                    <span className="eyebrow">Project Facts</span>
                                    <h2 className="section-title compact-title">项目概览</h2>
                                </div>
                            </div>

                            <div className="project-fact-grid">
                                <div className="metric-card">
                                    <span className="muted mono">角色</span>
                                    <strong>{project.role || '独立完成'}</strong>
                                </div>
                                <div className="metric-card">
                                    <span className="muted mono">状态</span>
                                    <strong>{project.status || '持续迭代中'}</strong>
                                </div>
                                <div className="metric-card">
                                    <span className="muted mono">周期</span>
                                    <strong>{project.period || '长期维护'}</strong>
                                </div>
                                <div className="metric-card">
                                    <span className="muted mono">内容位置</span>
                                    <strong>作品集 / 方法证明</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section section-tight">
                <div className="container article-layout project-detail-layout">
                    <article className="article-main">
                        <div className="feature-panel project-story-panel">
                            <div className="section-heading compact-head">
                                <div>
                                    <span className="eyebrow">Context</span>
                                    <h2 className="section-title compact-title">项目背景</h2>
                                </div>
                            </div>
                            <p className="section-copy">
                                这个项目承担的不只是一个页面或 demo，而是用来证明我在内容系统、界面表达和工程落地之间的整合能力。
                            </p>
                        </div>

                        <div className="feature-panel project-story-panel">
                            <div className="section-heading compact-head">
                                <div>
                                    <span className="eyebrow">Execution</span>
                                    <h2 className="section-title compact-title">过程与实现</h2>
                                </div>
                            </div>
                            <p className="section-copy">{project.description}</p>
                        </div>

                        <div className="feature-panel project-story-panel">
                            <div className="section-heading compact-head">
                                <div>
                                    <span className="eyebrow">Outcome</span>
                                    <h2 className="section-title compact-title">结果与价值</h2>
                                </div>
                            </div>
                            <div className="list-block">
                                <div className="list-item">
                                    <SiteIcon name="check" size={14} />
                                    <span>把抽象方法论落实成公开可访问的产品界面与内容结构。</span>
                                </div>
                                <div className="list-item">
                                    <SiteIcon name="check" size={14} />
                                    <span>让项目本身成为能力证明，而不是停留在“我会做什么”的描述层。</span>
                                </div>
                                <div className="list-item">
                                    <SiteIcon name="check" size={14} />
                                    <span>为后续文章、专栏与外部传播提供稳定的案例锚点。</span>
                                </div>
                            </div>
                        </div>
                    </article>

                    <aside className="article-sidebar">
                        <div className="article-side-card">
                            <strong>技术栈</strong>
                            <div className="tag-list">
                                {techStack.length ? (
                                    techStack.map((item) => (
                                        <span key={item} className="tag">
                                            <SiteIcon name="code" size={12} />
                                            <span>{item}</span>
                                        </span>
                                    ))
                                ) : (
                                    <span className="muted">当前没有单独配置技术栈。</span>
                                )}
                            </div>
                        </div>

                        <div className="article-side-card">
                            <strong>下一步阅读</strong>
                            <div className="stack-grid">
                                <Link to="/blog" className="side-link">
                                    <SiteIcon name="book-open" size={14} />
                                    <span>进入博客归档</span>
                                </Link>
                                <Link to="/series" className="side-link">
                                    <SiteIcon name="link" size={14} />
                                    <span>查看持续专栏</span>
                                </Link>
                                <Link to="/about" className="side-link">
                                    <SiteIcon name="user" size={14} />
                                    <span>了解作者与方法</span>
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </>
    );
}
