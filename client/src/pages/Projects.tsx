import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProjects, type Project } from '../api/client';
import ProjectCard from '../components/ProjectCard';
import SEO from '../components/SEO';
import SiteIcon from '../components/SiteIcon';
import { siteConfig } from '../config/site';

export default function Projects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects()
            .then(setProjects)
            .catch(() => setProjects([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <SEO title="项目" description="代表项目、案例、方法论与工程落地能力总览。" />

            <section className="section page-compact-hero">
                <div className="container page-compact-grid">
                    <div>
                        <span className="eyebrow">精选项目</span>
                        <h1 className="section-title">项目与案例</h1>
                        <p className="section-copy">
                            这些项目不是 demo 墙，而是用来证明内容方法、界面表达和工程落地能力的案例切片。
                        </p>
                    </div>

                    <div className="stat-grid">
                        <div className="stat-card">
                            <SiteIcon name="briefcase" size={16} />
                            <strong>{loading ? '--' : projects.length} 个公开项目</strong>
                            <span>先展示完整且可读的案例。</span>
                        </div>
                        {siteConfig.projectThemes.map((item) => (
                            <div key={item.title} className="stat-card">
                                <SiteIcon name={item.icon} size={16} />
                                <strong>{item.title}</strong>
                                <span>{item.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section section-border">
                <div className="container section-stack">
                    {loading ? (
                        <div className="empty-state">正在读取项目列表...</div>
                    ) : projects.length ? (
                        <>
                            <div className="split-feature project-feature-stage">
                                <div className="project-intro-card">
                                    <span className="eyebrow">Case Library</span>
                                    <h2 className="section-title compact-title">案例不是装饰，而是方法与交付能力的证据</h2>
                                    <p className="section-copy">
                                        这里不是简单堆项目卡片，而是把每个案例当作可公开讲清楚的能力样本，补齐背景、角色、过程、结果与可访问链接。
                                    </p>
                                    <div className="list-block">
                                        <div className="list-item">
                                            <SiteIcon name="check" size={14} />
                                            <span>优先展示能被说明白、也能被访问到的真实项目。</span>
                                        </div>
                                        <div className="list-item">
                                            <SiteIcon name="check" size={14} />
                                            <span>每个项目详情页都承担 SEO、传播与案例沉淀的作用。</span>
                                        </div>
                                        <div className="list-item">
                                            <SiteIcon name="check" size={14} />
                                            <span>项目页与文章页共同构成“观点 + 证据”的双层表达。</span>
                                        </div>
                                    </div>
                                </div>

                                {projects[0] ? (
                                    <Link to={`/projects/${projects[0].slug}`} className="feature-panel project-feature-card">
                                        <span className="eyebrow">Featured Case</span>
                                        <h2 className="section-title compact-title">{projects[0].name}</h2>
                                        <p className="section-copy">{projects[0].summary || projects[0].description}</p>
                                        <div className="meta-inline">
                                            {projects[0].status ? (
                                                <span className="meta-pill">
                                                    <SiteIcon name="check" size={13} />
                                                    <span>{projects[0].status}</span>
                                                </span>
                                            ) : null}
                                            {projects[0].role ? (
                                                <span className="meta-pill">
                                                    <SiteIcon name="user" size={13} />
                                                    <span>{projects[0].role}</span>
                                                </span>
                                            ) : null}
                                        </div>
                                        <span className="section-link">
                                            <span>阅读案例详情</span>
                                            <SiteIcon name="arrow-right" size={14} />
                                        </span>
                                    </Link>
                                ) : null}
                            </div>

                            <div className="project-grid">
                                {projects.map((project) => (
                                    <ProjectCard key={project.id} project={project} />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">当前还没有满足公开展示条件的项目。</div>
                    )}
                </div>
            </section>
        </>
    );
}
