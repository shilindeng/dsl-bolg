import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHomepage, type HomepageSection, type Post, type Project } from '../api/client';
import NewsletterSignup from '../components/NewsletterSignup';
import PageScene from '../components/PageScene';
import ParticleBackground from '../components/ParticleBackground';
import PostCard from '../components/PostCard';
import ProjectCard from '../components/ProjectCard';
import RouteSkeleton from '../components/RouteSkeleton';
import SEO from '../components/SEO';
import SiteIcon from '../components/SiteIcon';
import Surface from '../components/Surface';
import WeatherCard from '../components/WeatherCard';
import { siteConfig } from '../config/site';
import { resolveHomepageHeroVisual } from '../lib/homepageHero';

function getPosts(section?: HomepageSection) {
    return ((section?.items || []) as Array<Post | Project>).filter((item): item is Post => 'content' in item);
}

function getProjects(section?: HomepageSection) {
    return ((section?.items || []) as Array<Post | Project>).filter((item): item is Project => 'techStack' in item);
}

export default function Home() {
    const [sections, setSections] = useState<HomepageSection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHomepage()
            .then((response) => {
                setSections(response.sections);
            })
            .catch(() => {
                setSections([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const sectionMap = useMemo(
        () => new Map(sections.map((section) => [section.type, section])),
        [sections],
    );

    const hero = sectionMap.get('hero');
    const featuredPostsSection = sectionMap.get('featured_posts');
    const archiveEntrySection = sectionMap.get('archive_entry');
    const projectsSection = sectionMap.get('featured_projects');
    const authorSection = sectionMap.get('author_cta');
    const newsletterSection = sectionMap.get('newsletter_cta');
    const weatherSection = sectionMap.get('utility_weather');

    const featuredPosts = getPosts(featuredPostsSection);
    const featuredProjects = getProjects(projectsSection);
    const heroVisual = resolveHomepageHeroVisual(featuredPosts);
    const heroPost = heroVisual.featuredPost;
    const primaryProject = featuredProjects[0] || null;
    const supportingPosts = featuredPosts.slice(heroPost ? 1 : 0, heroPost ? 4 : 3);
    const remainingProjects = featuredProjects.slice(primaryProject ? 1 : 0, primaryProject ? 4 : 3);

    const heroStyle: CSSProperties | undefined = heroVisual.heroImage
        ? {
            backgroundImage: `url(${heroVisual.heroImage})`,
        }
        : undefined;

    if (loading) {
        return (
            <PageScene tone="editorial">
                <section className="section">
                    <RouteSkeleton variant="hero" />
                </section>
            </PageScene>
        );
    }

    return (
        <>
            <SEO
                title="首页"
                description={siteConfig.description}
                jsonLd={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Person',
                        name: siteConfig.author.name,
                        description: siteConfig.author.summary,
                        url: siteConfig.url,
                    },
                    {
                        '@context': 'https://schema.org',
                        '@type': 'ProfessionalService',
                        name: `${siteConfig.author.name} Studio`,
                        description: siteConfig.author.manifesto,
                        areaServed: 'CN',
                        url: siteConfig.url,
                    },
                ]}
            />

            <PageScene tone="editorial">
                <section className="section home-hero home-hero-stage">
                    <div className="container">
                        <Surface
                            tone="hero"
                            className={`home-hero-banner ${heroVisual.heroImage ? 'has-cover' : 'is-generated'}`}
                            style={heroStyle}
                        >
                            {!heroVisual.heroImage ? <ParticleBackground variant="hero" /> : null}
                            <div className="home-hero-scrim" />

                            <div className="home-hero-grid">
                                <div className="home-hero-copy">
                                    <span className="eyebrow">{hero?.eyebrow || 'AI 信息差研究与实验笔记'}</span>
                                    <h1 className="display-title home-display-title">
                                        {hero?.title || '把信息差变成可复用的结论库。'}
                                    </h1>
                                    <p className="lead home-hero-lead">
                                        {hero?.description || siteConfig.author.bio}
                                    </p>

                                    <div className="home-positioning-band">
                                        <span className="meta-pill emphasis">
                                            <SiteIcon name="user" size={13} />
                                            <span>{siteConfig.author.positioning}</span>
                                        </span>
                                        <span className="muted">{siteConfig.author.manifesto}</span>
                                    </div>

                                    <div className="hero-actions">
                                        <Link to={hero?.ctaHref || '/blog'} className="btn btn-primary btn-glow">
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

                                <aside className="home-hero-side" aria-label="Hero Signals">
                                    {heroPost ? (
                                        <Surface tone="floating" className="home-hero-feature-card">
                                            <span className="eyebrow">Featured Essay</span>
                                            <div className="home-hero-feature-meta">
                                                {heroPost.category ? (
                                                    <span className="chip">
                                                        <SiteIcon name="folder" size={13} />
                                                        <span>{heroPost.category.name}</span>
                                                    </span>
                                                ) : null}
                                                <span className="meta-pill">
                                                    <SiteIcon name="clock" size={13} />
                                                    <span>{heroPost.meta?.readTime || 1} 分钟</span>
                                                </span>
                                            </div>
                                            <strong>{heroPost.title}</strong>
                                            <p>{heroPost.deck?.trim() || heroPost.excerpt}</p>
                                            <Link to={`/blog/${heroPost.slug}`} className="section-link">
                                                <span>进入首篇精选</span>
                                                <SiteIcon name="arrow-right" size={14} />
                                            </Link>
                                        </Surface>
                                    ) : null}

                                    {primaryProject ? (
                                        <Surface tone="floating" className="home-hero-feature-card">
                                            <span className="eyebrow">Project Signal</span>
                                            <div className="home-hero-feature-meta">
                                                {primaryProject.status ? (
                                                    <span className="meta-pill">
                                                        <SiteIcon name="check" size={13} />
                                                        <span>{primaryProject.status}</span>
                                                    </span>
                                                ) : null}
                                                {primaryProject.role ? (
                                                    <span className="chip">
                                                        <SiteIcon name="briefcase" size={13} />
                                                        <span>{primaryProject.role}</span>
                                                    </span>
                                                ) : null}
                                            </div>
                                            <strong>{primaryProject.name}</strong>
                                            <p>{primaryProject.summary}</p>
                                            <Link to={`/projects/${primaryProject.slug}`} className="section-link">
                                                <span>查看项目案例</span>
                                                <SiteIcon name="arrow-right" size={14} />
                                            </Link>
                                        </Surface>
                                    ) : null}
                                </aside>
                            </div>
                        </Surface>
                    </div>
                </section>

                <section className="section section-tight home-proof-section">
                    <div className="container home-proof-grid">
                        {siteConfig.brandProofs.map((item) => (
                            <Surface key={item.label} tone="glass" className="home-proof-card">
                                <span className="meta-pill emphasis">
                                    <SiteIcon name={item.icon} size={13} />
                                    <span>{item.value}</span>
                                </span>
                                <strong>{item.label}</strong>
                                <p>{item.note}</p>
                            </Surface>
                        ))}
                    </div>
                </section>

                <section className="section section-tight">
                    <div className="container home-utility-rail">
                        <Surface tone="glass" className="home-archive-entry-card">
                            <div className="section-head compact-head">
                                <div>
                                    <span className="eyebrow">{archiveEntrySection?.eyebrow || '归档入口'}</span>
                                    <h2 className="section-title compact-title">
                                        {archiveEntrySection?.title || '按主题、标签与关键词进入研究档案'}
                                    </h2>
                                </div>
                            </div>

                            <p className="section-copy">
                                {archiveEntrySection?.description || '先定位问题，再决定投入阅读时间。'}
                            </p>

                            <div className="list-block">
                                <div className="list-item">
                                    <SiteIcon name="search" size={14} />
                                    <span>支持按关键词、分类与标签进入内容。</span>
                                </div>
                                <div className="list-item">
                                    <SiteIcon name="folder" size={14} />
                                    <span>把博客当作可检索的研究库，而不是时间流。</span>
                                </div>
                                <div className="list-item">
                                    <SiteIcon name="tag" size={14} />
                                    <span>沿着主题线索持续追踪方法、工具和判断。</span>
                                </div>
                            </div>

                            <Link to={archiveEntrySection?.ctaHref || '/blog'} className="btn btn-secondary">
                                <SiteIcon name="arrow-right" size={15} />
                                <span>{archiveEntrySection?.ctaLabel || '浏览内容归档'}</span>
                            </Link>
                        </Surface>

                        <div className="home-weather-stack">
                            {weatherSection?.enabled !== false ? <WeatherCard /> : null}

                            <Surface tone="glass">
                                <div className="section-head compact-head">
                                    <div>
                                        <span className="eyebrow">{newsletterSection?.eyebrow || 'Newsletter'}</span>
                                        <h2 className="section-title compact-title">
                                            {newsletterSection?.title || '订阅长期写作与产品化更新'}
                                        </h2>
                                    </div>
                                </div>

                                <p className="section-copy">
                                    {newsletterSection?.description || '新的长文、项目复盘与工作流迭代会优先从这里发出。'}
                                </p>

                                <NewsletterSignup source="home_utility" compact />

                                <Link to={newsletterSection?.ctaHref || '/newsletter'} className="section-link">
                                    <span>{newsletterSection?.ctaLabel || '前往订阅页'}</span>
                                    <SiteIcon name="arrow-right" size={14} />
                                </Link>
                            </Surface>
                        </div>
                    </div>
                </section>

                {supportingPosts.length ? (
                    <section className="section home-editorial-section">
                        <div className="container section-stack">
                            <div className="section-head editorial-head">
                                <div>
                                    <span className="eyebrow">{featuredPostsSection?.eyebrow || '精选文章'}</span>
                                    <h2 className="section-title">{featuredPostsSection?.title || '继续阅读这些代表性文章'}</h2>
                                </div>
                                <Link to="/blog" className="section-link">
                                    <span>查看全部文章</span>
                                    <SiteIcon name="arrow-right" size={14} />
                                </Link>
                            </div>

                            <div className="post-grid post-grid-triad">
                                {supportingPosts.map((post) => (
                                    <PostCard key={post.id} post={post} layout="grid" />
                                ))}
                            </div>
                        </div>
                    </section>
                ) : null}

                {remainingProjects.length ? (
                    <section className="section section-border home-projects-section">
                        <div className="container home-project-shell">
                            <Surface tone="glass" className="project-intro-card">
                                <span className="eyebrow">{projectsSection?.eyebrow || '代表项目'}</span>
                                <h2 className="section-title">{projectsSection?.title || '用项目证明方法可以落地'}</h2>
                                <p className="section-copy">
                                    {projectsSection?.description || '文章给判断，项目给证据，把方法真正跑进系统里。'}
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
                            </Surface>

                            <div className="project-grid homepage-project-grid">
                                {remainingProjects.map((project) => (
                                    <ProjectCard key={project.id} project={project} />
                                ))}
                            </div>
                        </div>
                    </section>
                ) : null}

                <section className="section">
                    <div className="container split-feature">
                        <Surface tone="glass" className="compact-cta home-collaboration-band">
                            <div>
                                <span className="eyebrow">{authorSection?.eyebrow || '作者与合作'}</span>
                                <h2 className="section-title compact-title">
                                    {authorSection?.title || '如果你也在做 AI 工作流、内容系统或独立项目，我们可以聊聊。'}
                                </h2>
                                <p className="section-copy">{authorSection?.description || siteConfig.author.summary}</p>
                            </div>

                            <div className="home-collaboration-list">
                                {siteConfig.collaborationTracks.map((item, index) => (
                                    <article key={item.title} className="home-collaboration-item">
                                        <span className="badge">0{index + 1}</span>
                                        <div>
                                            <strong>{item.title}</strong>
                                            <p>{item.description}</p>
                                        </div>
                                    </article>
                                ))}
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
                        </Surface>

                        <Surface tone="glass" className="home-focus-panel">
                            <span className="eyebrow">当前重心</span>
                            <div className="list-block">
                                {siteConfig.currentFocus.map((item, index) => (
                                    <div key={item} className="list-item">
                                        <span className="badge">0{index + 1}</span>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="list-block home-no-fit-list">
                                {siteConfig.collaborationNotFit.slice(0, 2).map((item) => (
                                    <div key={item} className="list-item">
                                        <SiteIcon name="warning" size={14} />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </Surface>
                    </div>
                </section>
            </PageScene>
        </>
    );
}
