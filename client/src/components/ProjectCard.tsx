import type { Project } from '../api/client';

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
    const techList = project.techStack ? project.techStack.split(',').map(t => t.trim()) : [];

    return (
        <div
            className="glass-card animate-fade-in-up"
            style={{
                padding: 'var(--space-xl)',
                animationDelay: `${index * 0.1}s`,
                opacity: 0,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {project.featured && (
                <div style={{
                    position: 'absolute',
                    top: 'var(--space-md)',
                    right: 'var(--space-md)',
                    background: 'var(--accent-gradient)',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '2px 10px',
                    borderRadius: '999px',
                }}>⭐ 精选</div>
            )}

            <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                marginBottom: 'var(--space-sm)',
                color: 'var(--text-primary)',
            }}>{project.name}</h3>

            <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                marginBottom: 'var(--space-lg)',
            }}>{project.description}</p>

            <div style={{
                display: 'flex',
                gap: 'var(--space-sm)',
                flexWrap: 'wrap',
                marginBottom: 'var(--space-lg)',
            }}>
                {techList.map(tech => (
                    <span key={tech} className="tag">{tech}</span>
                ))}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                {project.liveUrl && (
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary"
                        style={{ fontSize: '0.8rem', padding: '6px 16px' }}>
                        🔗 在线预览
                    </a>
                )}
                {project.repoUrl && (
                    <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"
                        style={{ fontSize: '0.8rem', padding: '6px 16px' }}>
                        📦 源码
                    </a>
                )}
            </div>
        </div>
    );
}
