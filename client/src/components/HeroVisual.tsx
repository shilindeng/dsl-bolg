import type { Post, Project } from '../api/client';

interface HeroVisualProps {
    featuredPost?: Post;
    featuredProject?: Project;
}

export default function HeroVisual({ featuredPost, featuredProject }: HeroVisualProps) {
    return (
        <div className="hero-visual-stage" aria-hidden="true">
            <div className="hero-visual-orb hero-visual-orb-a" />
            <div className="hero-visual-orb hero-visual-orb-b" />
            <div className="hero-visual-grid" />

            <div className="hero-visual-card hero-visual-card-main">
                <span className="hero-visual-label mono">EDITORIAL SYSTEM</span>
                <strong>{featuredPost?.title || 'Build a blog like a premium digital product.'}</strong>
                <p>{featuredPost?.excerpt || 'Writing, distribution, identity and interface woven into one long-term personal brand system.'}</p>
                <div className="hero-visual-tags">
                    <span className="tag">Brand</span>
                    <span className="tag">Writing</span>
                    <span className="tag">Workflow</span>
                </div>
            </div>

            <div className="hero-visual-card hero-visual-card-float hero-visual-card-top">
                <span className="hero-visual-kicker mono">PROJECT SIGNAL</span>
                <strong>{featuredProject?.name || 'Operator Console'}</strong>
                <p>{featuredProject?.summary || 'Analytics, publishing and assets under one calm operations layer.'}</p>
            </div>

            <div className="hero-visual-card hero-visual-card-float hero-visual-card-bottom">
                <span className="hero-visual-kicker mono">RELEASE MODEL</span>
                <div className="hero-visual-stats">
                    <div>
                        <span className="muted mono">CONTENT</span>
                        <strong>Posts</strong>
                    </div>
                    <div>
                        <span className="muted mono">OPS</span>
                        <strong>Dashboard</strong>
                    </div>
                    <div>
                        <span className="muted mono">API</span>
                        <strong>Open Publish</strong>
                    </div>
                </div>
            </div>

            <div className="hero-visual-beam" />
        </div>
    );
}
