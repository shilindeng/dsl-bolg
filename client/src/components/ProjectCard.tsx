import type { Project } from '../api/client';
import { splitTechStack } from '../lib/content';
import LazyImage from './LazyImage';
import SiteIcon from './SiteIcon';

export default function ProjectCard({ project }: { project: Project }) {
    const techStack = splitTechStack(project.techStack);

    return (
        <article id={project.slug} className="project-card" data-testid={`project-card-${project.slug}`}>
            <div className="project-card-media">
                {project.coverImage ? (
                    <LazyImage src={project.coverImage} alt={project.name} />
                ) : (
                    <div className="visual-placeholder">
                        <span className="visual-badge">
                            <SiteIcon name="briefcase" size={14} />
                            <span>case study</span>
                        </span>
                        <strong>{project.headline || '项目案例'}</strong>
                    </div>
                )}
            </div>

            <div className="project-card-content">
                <div className="project-card-topline">
                    <div className="meta-inline">
                        {project.featured ? <span className="badge">代表项目</span> : null}
                        <span className="chip">
                            <SiteIcon name="grid" size={13} />
                            <span>#{project.order.toString().padStart(2, '0')}</span>
                        </span>
                    </div>

                    {project.status ? (
                        <span className="meta-pill">
                            <SiteIcon name="check" size={13} />
                            <span>{project.status}</span>
                        </span>
                    ) : null}
                </div>

                <div className="project-card-body">
                    {project.headline ? <span className="project-card-headline">{project.headline}</span> : null}
                    <h3>{project.name}</h3>
                    <p className="project-card-summary">{project.summary || project.description}</p>
                    <p>{project.description}</p>
                </div>

                {(project.role || project.period) ? (
                    <div className="project-card-facts">
                        {project.role ? (
                            <span className="meta-pill">
                                <SiteIcon name="user" size={13} />
                                <span>{project.role}</span>
                            </span>
                        ) : null}
                        {project.period ? (
                            <span className="meta-pill">
                                <SiteIcon name="calendar" size={13} />
                                <span>{project.period}</span>
                            </span>
                        ) : null}
                    </div>
                ) : null}

                <div className="tag-list">
                    {techStack.slice(0, 6).map((tech) => (
                        <span key={tech} className="tag">
                            <SiteIcon name="code" size={12} />
                            <span>{tech}</span>
                        </span>
                    ))}
                </div>

                <div className="project-card-actions">
                    {project.liveUrl ? (
                        <a className="btn btn-primary" href={project.liveUrl} target="_blank" rel="noreferrer">
                            <SiteIcon name="external" size={14} />
                            <span>打开站点</span>
                        </a>
                    ) : null}
                    {project.repoUrl ? (
                        <a className="btn btn-secondary" href={project.repoUrl} target="_blank" rel="noreferrer">
                            <SiteIcon name="github" size={14} />
                            <span>查看代码</span>
                        </a>
                    ) : null}
                </div>
            </div>
        </article>
    );
}
