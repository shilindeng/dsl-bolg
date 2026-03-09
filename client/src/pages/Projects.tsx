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

            <section className="section page-hero">
                <div className="container page-hero-layout">
                    <div className="section-stack">
                        <div>
                            <div className="eyebrow">精选项目</div>
                            <h1 className="page-title">项目与案例</h1>
                            <p className="lead">
                                这些项目不是 demo 墙，而是用于证明内容方法、界面表达和工程落地能力的案例切片。
                            </p>
                        </div>

                        <div className="hero-metrics">
                            <div className="metric-card">
                                <span className="muted mono">PROJECTS</span>
                                <strong>{loading ? '--' : projects.length} 个公开项目</strong>
                            </div>
                            <div className="metric-card">
                                <span className="muted mono">FOCUS</span>
                                <strong>产品 / 系统 / 体验</strong>
                            </div>
                        </div>
                    </div>
                    <div className="editorial-panel">
                        <strong>Case Studies</strong>
                        <p className="muted">按案例叙事组织项目，而不是单纯罗列技术栈。</p>
                    </div>
                </div>
            </section>

            <section className="section section-tight">
                <div className="container">
                    <div className="focus-grid">
                        <article className="focus-card">
                            <span className="signal-label mono">内容系统</span>
                            <h3>内容产品与发布链路</h3>
                            <p>内容结构化、写作系统、发布流程，以及可长期积累的站点资产。</p>
                        </article>
                        <article className="focus-card">
                            <span className="signal-label mono">界面表达</span>
                            <h3>界面体验与设计语言</h3>
                            <p>前端体验、品牌感表达、组件秩序和信息层级控制。</p>
                        </article>
                        <article className="focus-card">
                            <span className="signal-label mono">AI 工作流</span>
                            <h3>AI 驱动的生产效率</h3>
                            <p>让代理式工作流真正参与开发、写作和部署，而不是只停留在演示层。</p>
                        </article>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
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
