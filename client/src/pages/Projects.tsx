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

    const featuredProject = projects[0];
    const remainingProjects = projects.slice(1);

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
                            <span>优先展示能被访问、能被说明白的真实案例。</span>
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
                                        项目页和文章页承担不同职责。文章讲结论与判断，项目页讲证据、过程与真实落地。
                                    </p>
                                    <div className="list-block">
                                        <div className="list-item">
                                            <SiteIcon name="check" size={14} />
                                            <span>精选卡负责解释“为什么值得看”。</span>
                                        </div>
                                        <div className="list-item">
                                            <SiteIcon name="check" size={14} />
                                            <span>列表卡负责快速比较，不再堆叠过长说明。</span>
                                        </div>
                                        <div className="list-item">
                                            <SiteIcon name="check" size={14} />
                                            <span>详情页承担 SEO、传播与案例沉淀的作用。</span>
                                        </div>
                                    </div>
                                </div>

                                {featuredProject ? (
                                    <Link to={`/projects/${featuredProject.slug}`} className="feature-panel project-feature-card">
                                        <span className="eyebrow">Featured Case</span>
                                        <h2 className="section-title compact-title">{featuredProject.name}</h2>
                                        <p className="section-copy">{featuredProject.summary || featuredProject.description}</p>
                                        <div className="meta-inline">
                                            {featuredProject.status ? (
                                                <span className="meta-pill">
                                                    <SiteIcon name="check" size={13} />
                                                    <span>{featuredProject.status}</span>
                                                </span>
                                            ) : null}
                                            {featuredProject.role ? (
                                                <span className="meta-pill">
                                                    <SiteIcon name="user" size={13} />
                                                    <span>{featuredProject.role}</span>
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="list-block">
                                            <div className="list-item">
                                                <SiteIcon name="grid" size={14} />
                                                <span>作为代表案例承担方法论与交付能力的第一层说明。</span>
                                            </div>
                                            <div className="list-item">
                                                <SiteIcon name="spark" size={14} />
                                                <span>详情页会展开背景、角色、过程、结果与访问链接。</span>
                                            </div>
                                        </div>
                                        <span className="section-link">
                                            <span>阅读案例详情</span>
                                            <SiteIcon name="arrow-right" size={14} />
                                        </span>
                                    </Link>
                                ) : null}
                            </div>

                            {remainingProjects.length ? (
                                <div className="project-grid">
                                    {remainingProjects.map((project) => (
                                        <ProjectCard key={project.id} project={project} />
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">当前只有一个公开项目，后续案例会继续补充进来。</div>
                            )}
                        </>
                    ) : (
                        <div className="empty-state">当前还没有满足公开展示条件的项目。</div>
                    )}
                </div>
            </section>
        </>
    );
}
