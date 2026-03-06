import { useEffect, useState } from 'react';
import { fetchProjects, type Project } from '../api/client';
import ProjectCard from '../components/ProjectCard';
import SEO from '../components/SEO';

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
            <SEO title="项目" description="代表项目、方法论和技术方向总览。" />

            <section className="section">
                <div className="container" style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div className="eyebrow">Selected Work</div>
                        <h1 className="section-title">项目与实验</h1>
                        <p className="lead">
                            这里展示的不是项目数量，而是我选择长期打磨、能够代表能力边界和判断力的作品。
                        </p>
                    </div>

                    <div className="panel">
                        <div className="panel-body" style={{ display: 'grid', gap: '1rem' }}>
                            <strong>我更关注什么类型的项目？</strong>
                            <div className="three-grid">
                                <div className="metric-card">
                                    <span className="muted mono">Content Systems</span>
                                    <strong>内容产品、结构化写作与发布工作流</strong>
                                </div>
                                <div className="metric-card">
                                    <span className="muted mono">Interface Craft</span>
                                    <strong>设计系统、前端体验与品牌感表达</strong>
                                </div>
                                <div className="metric-card">
                                    <span className="muted mono">AI Workflow</span>
                                    <strong>用 AI 提升研发与内容生产效率</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="empty-state">正在读取项目列表...</div>
                    ) : (
                        <div className="three-grid">
                            {projects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
