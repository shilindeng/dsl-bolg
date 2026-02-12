import type { Project } from '../api/client';
import { useSound } from '../hooks/useSound';

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
    const { play } = useSound();
    const techList = project.techStack ? project.techStack.split(',').map(t => t.trim()) : [];

    return (
        <div
            className="cyber-card animate-fade-in-up"
            onMouseEnter={() => play('hover')}
            style={{
                animationDelay: `${index * 0.1}s`,
                opacity: 0,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
            }}
        >
            {/* Terminal Header */}
            <div className="cyber-header-bar" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <div className="cyber-dot" />
                    <div className="cyber-dot" />
                    <div className="cyber-dot" />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {project.featured ? '⭐ 精选' : '后台任务'}
                </div>
            </div>

            <div style={{ padding: 'var(--space-xl)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{
                    fontSize: '1.25rem',
                    marginBottom: 'var(--space-sm)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-display)',
                }}>
                    {project.name}
                </h3>

                <div style={{
                    marginBottom: 'var(--space-lg)',
                    height: '2px',
                    width: '50px',
                    background: 'var(--accent-purple)'
                }} />

                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    marginBottom: 'var(--space-lg)',
                    flex: 1,
                }}>{project.description}</p>

                <div style={{
                    display: 'flex',
                    gap: 'var(--space-sm)',
                    flexWrap: 'wrap',
                    marginBottom: 'var(--space-xl)',
                }}>
                    {techList.slice(0, 4).map(tech => (
                        <span key={tech} className="tag">{tech}</span>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    {project.liveUrl && (
                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="btn"
                            onClick={() => play('click')}
                            style={{ fontSize: '0.8rem', padding: '8px 16px', flex: 1, textAlign: 'center' }}>
                            启动 &gt;
                        </a>
                    )}
                    {project.repoUrl && (
                        <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"
                            onClick={() => play('click')}
                            style={{ fontSize: '0.8rem', padding: '8px 16px', flex: 1, textAlign: 'center' }}>
                            源代码
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
