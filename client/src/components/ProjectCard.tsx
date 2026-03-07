import type { Project } from '../api/client';
import LazyImage from './LazyImage';
import { splitTechStack } from '../lib/content';

export default function ProjectCard({ project }: { project: Project }) {
    const techStack = splitTechStack(project.techStack);

    return (
        <article id={project.slug} className="project-card" data-testid={`project-card-${project.slug}`}>
            <div className="project-card-cover">
                <LazyImage src={project.coverImage} alt={project.name} fallbackLabel={project.name} fallbackKicker="PROJECT" />
            </div>

            <div className="project-card-head">
                <div className="project-card-meta">
                    {project.featured ? <span className="badge badge-gold">精选</span> : null}
                    <span className="chip mono">#{project.order.toString().padStart(2, '0')}</span>
                </div>
                <span className="project-card-label mono">项目</span>
            </div>

            <div className="project-card-copy">
                <span className="project-card-kicker mono">项目档案</span>
                <h3>{project.name}</h3>
                <p className="project-card-summary">{project.summary || project.description}</p>
                <p>{project.description}</p>
            </div>

            <div className="tag-list">
                {techStack.slice(0, 6).map((tech) => (
                    <span key={tech} className="tag">{tech}</span>
                ))}
            </div>

            <div className="project-card-actions">
                {project.liveUrl ? (
                    <a className="btn btn-primary" href={project.liveUrl} target="_blank" rel="noreferrer">
                        打开站点
                    </a>
                ) : null}
                {project.repoUrl ? (
                    <a className="btn btn-secondary" href={project.repoUrl} target="_blank" rel="noreferrer">
                        查看代码
                    </a>
                ) : null}
            </div>
        </article>
    );
}
