import { useState, useEffect } from 'react';
import { fetchProjects, type Project } from '../api/client';
import ProjectCard from '../components/ProjectCard';

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
            <div className="animate-fade-in-up" style={{ opacity: 0, marginBottom: 'var(--space-2xl)' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>
                    <span className="gradient-text">🛠️ 项目</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>我的 Vibe Coding 作品集</p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem' }} className="animate-float">⏳</div>
                    <p>加载中...</p>
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
