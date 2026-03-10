import { useEffect, useState } from 'react';
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
                        <div className="project-grid">
                            {projects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">当前还没有满足公开展示条件的项目。</div>
                    )}
                </div>
            </section>
        </>
    );
}
