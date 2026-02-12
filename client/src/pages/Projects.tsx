import { useState, useEffect } from 'react';
import { fetchProjects, type Project } from '../api/client';
import ProjectCard from '../components/ProjectCard';
import TypewriterText from '../components/TypewriterText';
import ScrollReveal from '../components/ScrollReveal';

export default function Projects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects()
            .then(setProjects)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="container" style={{ paddingTop: 'var(--space-3xl)', paddingBottom: 'var(--space-3xl)' }}>
            <ScrollReveal className="animate-fade-in-up" style={{ marginBottom: 'var(--space-2xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                    <span style={{ color: 'var(--accent-cyan)', fontSize: '2rem' }}>$</span>
                    <h1 style={{ fontSize: '2.5rem', margin: 0 }}>
                        ls <span style={{ color: 'var(--accent-purple)' }}>~/projects</span>
                    </h1>
                </div>
                <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', paddingLeft: '32px' }}>
                    // 列出目录中... 发现 {projects.length} 个可执行文件。
                    // 正在列出目录... 发现 {projects.length} 个项目。
                </p>
            </ScrollReveal>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
                    <div style={{ marginBottom: '1rem', fontSize: '2rem' }} className="animate-pulse">⌛</div>
                    <TypewriterText text="编译资源中..." speed={50} />
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: 'var(--space-lg)',
                }}>
                    {projects.map((project, i) => (
                        <ProjectCard key={project.id} project={project} index={i} />
                    ))}
                </div>
            )}
        </div>
    );
}
