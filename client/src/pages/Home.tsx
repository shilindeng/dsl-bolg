import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHomepage, type HomepageSection, type Post, type Project } from '../api/client';
import NewsletterSignup from '../components/NewsletterSignup';
import PostCard from '../components/PostCard';
import ProjectCard from '../components/ProjectCard';
import SEO from '../components/SEO';
import WeatherCard from '../components/WeatherCard';
import { siteConfig } from '../config/site';

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
            .then((response) => setSections(response.sections))
            .catch(() => setSections([]))
            .finally(() => setLoading(false));
    }, []);

    const sectionMap = useMemo(
        () => new Map(sections.map((section) => [section.type, section])),
        [sections],
    );

    const hero = sectionMap.get('hero');
    const featuredPostsSection = sectionMap.get('featured_posts');
    const archiveSection = sectionMap.get('archive_entry');
    const projectsSection = sectionMap.get('featured_projects');
    const authorSection = sectionMap.get('author_cta');
    const newsletterSection = sectionMap.get('newsletter_cta');
    const weatherSection = sectionMap.get('utility_weather');

    const featuredPosts = getPosts(featuredPostsSection);
    const leadPost = featuredPosts[0];
    const restPosts = featuredPosts.slice(1);
    const featuredProjects = getProjects(projectsSection);

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

            <section className="section home-editorial-hero">
                <div className="container home-hero-grid">
                    <div className="home-hero-copy editorial-panel">
                        <div className="eyebrow">{hero?.eyebrow || '长期主义的个人品牌主场'}</div>
                        <h1 className="display-title">{hero?.title || '把博客做成真正能持续经营的作品系统。'}</h1>
                        <p className="lead">{hero?.description || siteConfig.author.bio}</p>
                        <div className="hero-actions">
                            <Link to={hero?.ctaHref || '/blog'} className="btn btn-primary">{hero?.ctaLabel || '进入文章归档'}</Link>
                            <Link to="/projects" className="btn btn-secondary">查看代表项目</Link>
                            <Link to="/newsletter" className="btn btn-ghost">订阅更新</Link>
                        </div>
                        <div className="editorial-meta-strip">
                            <div className="metric-card"><span className="muted mono">ROLE</span><strong>内容 / 产品 / 工程</strong></div>
                            <div className="metric-card"><span className="muted mono">MODEL</span><strong>内容优先 / 专业排版</strong></div>
                            <div className="metric-card"><span className="muted mono">MODE</span><strong>长期维护</strong></div>
                        </div>
                    </div>

                    <div className="home-hero-side">
                        {leadPost ? (
                            <Link to={`/blog/${leadPost.slug}`} className="hero-story-card">
                                <span className="signal-label">Lead Story</span>
                                <h2>{leadPost.title}</h2>
                                <p>{leadPost.deck || leadPost.excerpt}</p>
                                <span className="command-hint">阅读代表内容</span>
                            </Link>
                        ) : (
                            <div className="hero-story-card">
                                <span className="signal-label">Lead Story</span>
                                <h2>精选内容会由首页编排后台接管</h2>
                                <p>当前还没有可用于首屏展示的精选文章。</p>
                            </div>
                        )}
                        {weatherSection?.enabled !== false ? <WeatherCard /> : null}
                    </div>
                </div>
            </section>

            <section className="section section-tight">
                <div className="container home-split-stage">
                    <div className="feature-panel">
                        <div className="eyebrow">{archiveSection?.eyebrow || '归档入口'}</div>
                        <h2 className="section-title">{archiveSection?.title || '按主题、标签和关键词进入内容档案'}</h2>
                        <p>{archiveSection?.description || '从更高密度的归档页里快速判断哪些内容值得继续深入。'}</p>
                        <Link to={archiveSection?.ctaHref || '/blog'} className="btn btn-secondary">{archiveSection?.ctaLabel || '浏览内容归档'}</Link>
                    </div>
                    <div className="feature-panel">
                        <div className="eyebrow">{newsletterSection?.eyebrow || 'Newsletter'}</div>
                        <h2 className="section-title">{newsletterSection?.title || '订阅长期写作与产品化更新'}</h2>
                        <p>{newsletterSection?.description || '接收新的长文、项目复盘和工作流迭代记录。'}</p>
                        <NewsletterSignup source="home_hero" compact />
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container section-stack">
                    <div className="section-heading">
                        <div>
                            <div className="eyebrow">{featuredPostsSection?.eyebrow || '精选文章'}</div>
                            <h2 className="section-title">{featuredPostsSection?.title || '先看到最能代表方法与判断力的内容'}</h2>
                        </div>
                        <Link to="/blog" className="btn btn-ghost">全部文章</Link>
                    </div>
                    {loading ? (
                        <div className="empty-state">正在读取首页模块...</div>
                    ) : featuredPosts.length ? (
                        <div className="home-post-grid">
                            {leadPost ? <PostCard post={leadPost} featured /> : null}
                            <div className="post-stack">
                                {restPosts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">还没有可展示的精选文章。</div>
                    )}
                </div>
            </section>

            <section className="section">
                <div className="container section-stack">
                    <div className="section-heading">
                        <div>
                            <div className="eyebrow">{projectsSection?.eyebrow || '代表项目'}</div>
                            <h2 className="section-title">{projectsSection?.title || '项目页承担方法论与落地能力的第二层证明'}</h2>
                        </div>
                        <Link to="/projects" className="btn btn-ghost">全部项目</Link>
                    </div>
                    {featuredProjects.length ? (
                        <div className="three-grid">
                            {featuredProjects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">还没有配置首页项目模块。</div>
                    )}
                </div>
            </section>

            <section className="section">
                <div className="container cta-shell editorial-cta">
                    <div>
                        <div className="eyebrow">{authorSection?.eyebrow || '作者与合作'}</div>
                        <h2 className="section-title">{authorSection?.title || '如果你也在做长期主义内容系统、独立项目或 AI 工作流，我们可以聊聊。'}</h2>
                        <p className="lead">{authorSection?.description || siteConfig.author.summary}</p>
                    </div>
                    <div className="hero-actions">
                        <a href={authorSection?.ctaHref || `mailto:${siteConfig.email}`} className="btn btn-primary">{authorSection?.ctaLabel || '发送邮件'}</a>
                        <Link to="/about" className="btn btn-secondary">了解作者</Link>
                    </div>
                </div>
            </section>
        </>
    );
}
