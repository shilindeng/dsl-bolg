import type { Project } from '../api/client';
import { splitTechStack } from '../lib/content';

export default function ProjectCard({ project }: { project: Project }) {
    const techStack = splitTechStack(project.techStack);

    return (
        <article id={project.slug} className="panel" data-testid={`project-card-${project.slug}`}>
            <div className="panel-body" style={{ display: 'grid', gap: '1rem', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'start' }}>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                            {project.featured ? <span className="badge" style={{ color: 'var(--accent-gold)' }}>代表项目</span> : null}
                            <span className="chip mono">#{project.order.toString().padStart(2, '0')}</span>
                        </div>
                        <h3 style={{ fontSize: '1.5rem' }}>{project.name}</h3>
                    </div>
                </div>

                <p className="muted" style={{ margin: 0 }}>{project.summary || project.description}</p>
                <p style={{ margin: 0 }}>{project.description}</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                    {techStack.slice(0, 5).map((tech) => (
                        <span key={tech} className="tag">{tech}</span>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                    {project.liveUrl ? (
                        <a className="btn btn-primary" href={project.liveUrl} target="_blank" rel="noreferrer">
                            查看站点
                        </a>
                    ) : null}
                    {project.repoUrl ? (
                        <a className="btn btn-secondary" href={project.repoUrl} target="_blank" rel="noreferrer">
                            查看代码
                        </a>
                    ) : null}
                </div>
            </div>
        </article>
    );
}
