import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHomepage, type HomepageSection, type Post, type Project } from '../api/client';
import PostCard from '../components/PostCard';
import ProjectCard from '../components/ProjectCard';
import SEO from '../components/SEO';
import SiteIcon from '../components/SiteIcon';
import { formatShortDate } from '../lib/format';
import { siteConfig } from '../config/site';

function getPosts(section?: HomepageSection) {
    return ((section?.items || []) as Array<Post | Project>).filter((item): item is Post => 'content' in item);
}

function getProjects(section?: HomepageSection) {
    return ((section?.items || []) as Array<Post | Project>).filter((item): item is Project => 'techStack' in item);
}

export default function Home() {
    const [sections, setSections] = useState<HomepageSection[]>([]);

    useEffect(() => {
        fetchHomepage()
            .then((response) => setSections(response.sections))
            .catch(() => setSections([]));
    }, []);

    const sectionMap = useMemo(
        () => new Map(sections.map((section) => [section.type, section])),
        [sections],
    );

    const hero = sectionMap.get('hero');
    const featuredPostsSection = sectionMap.get('featured_posts');
    const projectsSection = sectionMap.get('featured_projects');
    const authorSection = sectionMap.get('author_cta');

    const featuredPosts = getPosts(featuredPostsSection);
    const featuredProjects = getProjects(projectsSection);
    const leadPost = featuredPosts[0];
    const supportingPosts = featuredPosts.slice(1, 4);
    const homepageProjects = featuredProjects.slice(0, 2);

    return (
        <>
            <SEO
                title="首页"
                description={siteConfig.description}
                jsonLd={{
                    '@context': 'https://schema.org',
                    '@type': 'Person',
                    name: siteConfig.author.name,
                    description: siteConfig.author.summary,
                    url: siteConfig.url,
                }}
            />

            <section className="section home-hero">
                <div className="container home-hero-grid" data-testid="home-hero">
                    <div className="home-hero-copy">
                        <span className="eyebrow">{hero?.eyebrow || '长期主义的个人品牌主场'}</span>
                        <h1 className="display-title home-display-title">
                            {hero?.title || '把博客做成真正能持续经营的作品系统。'}
                        </h1>
                        <p className="lead home-hero-lead">{hero?.description || siteConfig.author.bio}</p>

                        <div className="hero-actions">
                            <Link to={hero?.ctaHref || '/blog'} className="btn btn-primary">
                                <SiteIcon name="book-open" size={15} />
                                <span>{hero?.ctaLabel || '进入文章归档'}</span>
                            </Link>
                            <Link to="/projects" className="btn btn-secondary">
                                <SiteIcon name="briefcase" size={15} />
                                <span>查看代表项目</span>
                            </Link>
                        </div>

                        <div className="hero-fact-rail">
                            {siteConfig.homeHighlights.map((item) => (
                                <article key={item.title} className="hero-fact-item">
                                    <strong>{item.title}</strong>
                                    <p>{item.description}</p>
                                </article>
                            ))}
                        </div>
                    </div>

                    <div className="home-hero-media">
                        <div className="hero-media-frame">
                            <img src="/hero-landing.png" alt="黑灰极简的品牌视觉封面" className="hero-media-image" />
                        </div>

                        <div className="hero-caption-strip">
                            <span className="meta-pill">
                                <SiteIcon name="grid" size={13} />
                                <span>Landing Visual</span>
                            </span>
                            <p>更克制的黑灰视觉，只负责建立语气和质感，不再抢走正文注意力。</p>
                        </div>
                    </div>
                </div>
            </section>

            {featuredPosts.length ? (
                <section className="section home-editorial-section">
                    <div className="container section-stack">
                        <div className="section-head editorial-head">
                            <div>
                                <span className="eyebrow">{featuredPostsSection?.eyebrow || '精选文章'}</span>
                                <h2 className="section-title">先看到最能代表方法与判断力的内容</h2>
                            </div>
                            <Link to="/blog" className="section-link">
                                <span>查看全部文章</span>
                                <SiteIcon name="arrow-right" size={14} />
                            </Link>
                        </div>

                        <div className="home-featured-grid">
                            {leadPost ? <PostCard post={leadPost} featured /> : null}

                            <div className="supporting-post-list">
                                {supportingPosts.map((post) => (
                                    <Link key={post.id} to={`/blog/${post.slug}`} className="supporting-post-item">
                                        <div className="supporting-post-meta">
                                            <span className="meta-pill">
                                                <SiteIcon name="calendar" size={13} />
                                                <span>{formatShortDate(post.publishedAt || post.createdAt)}</span>
                                            </span>
                                            {post.category ? (
                                                <span className="meta-pill">
                                                    <SiteIcon name="folder" size={13} />
                                                    <span>{post.category.name}</span>
                                                </span>
                                            ) : null}
                                        </div>
                                        <h3>{post.title}</h3>
                                        <p>{post.deck?.trim() || post.excerpt}</p>
                                        <span className="section-link">
                                            <span>继续阅读</span>
                                            <SiteIcon name="arrow-right" size={14} />
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            ) : null}

            {featuredProjects.length ? (
                <section className="section section-border home-projects-section">
                    <div className="container home-project-shell">
                        <div className="project-intro-card">
                            <span className="eyebrow">{projectsSection?.eyebrow || '代表项目'}</span>
                            <h2 className="section-title">项目页承担方法论与落地能力的第二层证明</h2>
                            <p className="section-copy">
                                文章负责建立判断力，项目负责证明交付能力。这一段不再堆很多卡，只保留最完整的案例。
                            </p>

                            <div className="stack-grid">
                                {siteConfig.projectThemes.map((item) => (
                                    <article key={item.title} className="mini-feature">
                                        <span className="mini-feature-icon">
                                            <SiteIcon name={item.icon} size={15} />
                                        </span>
                                        <div>
                                            <strong>{item.title}</strong>
                                            <p>{item.description}</p>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <Link to="/projects" className="btn btn-secondary">
                                <SiteIcon name="briefcase" size={15} />
                                <span>进入项目页</span>
                            </Link>
                        </div>

                        <div className="project-grid homepage-project-grid">
                            {homepageProjects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    </div>
                </section>
            ) : null}

            <section className="section">
                <div className="container compact-cta home-cta-band">
                    <div>
                        <span className="eyebrow">{authorSection?.eyebrow || '作者与合作'}</span>
                        <h2 className="section-title compact-title">
                            {authorSection?.title || '如果你也在做长期主义内容系统、独立项目或 AI 工作流，我们可以聊聊。'}
                        </h2>
                        <p className="section-copy">{authorSection?.description || siteConfig.author.summary}</p>
                    </div>

                    <div className="hero-actions">
                        <a href={authorSection?.ctaHref || `mailto:${siteConfig.email}`} className="btn btn-primary">
                            <SiteIcon name="mail" size={15} />
                            <span>{authorSection?.ctaLabel || '发送邮件'}</span>
                        </a>
                        <Link to="/about" className="btn btn-ghost">
                            <SiteIcon name="user" size={15} />
                            <span>了解作者</span>
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
