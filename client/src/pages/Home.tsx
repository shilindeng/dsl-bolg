import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts, fetchProjects, type Post, type Project } from '../api/client';
import ParticleBackground from '../components/ParticleBackground';
import HeroVisual from '../components/HeroVisual';
import SEO from '../components/SEO';
import WeatherCard from '../components/WeatherCard';
import PostCard from '../components/PostCard';
import ProjectCard from '../components/ProjectCard';
import { siteConfig } from '../config/site';

export default function Home() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        Promise.all([fetchPosts({ limit: 4 }), fetchProjects()])
            .then(([postResponse, projectResponse]) => {
                if (cancelled) return;
                setPosts(postResponse.data);
                setProjects(projectResponse.filter((item) => item.featured).slice(0, 3));
            })
            .catch(() => {
                if (cancelled) return;
                setPosts([]);
                setProjects([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const featuredPost = posts[0];
    const secondaryPosts = posts.slice(1, 4);
    const featuredProject = projects[0];

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

            <div className="home-page-shell">
                <div className="home-particle-layer" aria-hidden="true">
                    <ParticleBackground variant="page" />
                </div>

                <section className="section hero-section" data-testid="home-hero">
                    <div className="container home-hero-layout">
                        <div className="home-hero-copy-column" data-testid="hero-panel">
                            <div className="cyber-header-bar hero-badge-bar">
                                <span className="cyber-dot" />
                                <span className="cyber-dot" />
                                <span className="cyber-dot" />
                                <span className="command-hint">PERSONAL BRAND SYSTEM / LIVE</span>
                            </div>

                            <div className="hero-copy home-hero-copy">
                                <div className="eyebrow">Editorial identity for builders</div>
                                <p className="hero-kicker mono">写作 / 产品 / 系统 / 审美 / 长期主义</p>
                                <h1 className="display-title home-display-title">
                                    把博客做成真正上线的
                                    <br />
                                    个人品牌系统。
                                </h1>
                                <p className="lead home-hero-lead">
                                    这里不是一页“好看”的展示页，而是一套持续发布、持续运营、持续沉淀判断力的内容产品界面。
                                </p>
                            </div>

                            <div className="hero-actions home-hero-actions">
                                <Link to="/blog" className="btn btn-primary">阅读文章</Link>
                                <Link to="/projects" className="btn btn-secondary">查看项目</Link>
                                <a href={`mailto:${siteConfig.email}`} className="btn btn-ghost">联系合作</a>
                            </div>

                            <div className="home-summary-strip">
                                {siteConfig.heroMetrics.map((item) => (
                                    <div key={item.label} className="metric-card home-summary-card">
                                        <span className="muted mono">{item.label}</span>
                                        <strong>{item.value}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="home-hero-visual-column">
                            <HeroVisual featuredPost={featuredPost} featuredProject={featuredProject} />

                            <div className="home-utility-rail">
                                <WeatherCard />

                                <div className="panel panel-body hero-preview-panel">
                                    <div className="section-heading-left">
                                        <div>
                                            <div className="eyebrow">Latest editorial signal</div>
                                            <h2 className="hero-side-title">先看代表内容，再决定要不要持续关注</h2>
                                        </div>
                                    </div>

                                    {featuredPost ? (
                                        <div className="hero-preview-card">
                                            <div className="hero-preview-meta">
                                                <span className="chip">{featuredPost.category?.name || '精选文章'}</span>
                                                <span className="command-hint">{featuredPost.meta?.readTime || 1} 分钟</span>
                                            </div>
                                            <strong>{featuredPost.title}</strong>
                                            <p>{featuredPost.excerpt}</p>
                                            <Link to={`/blog/${featuredPost.slug}`} className="btn btn-secondary">阅读代表内容</Link>
                                        </div>
                                    ) : (
                                        <div className="empty-state">代表内容会在文章发布后显示在这里。</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section section-tight">
                    <div className="container">
                        <div className="home-signal-bar">
                            {siteConfig.homeSignals.map((signal) => (
                                <article key={signal.id} className="signal-card signal-card-compact">
                                    <span className="signal-label mono">{signal.label}</span>
                                    <h3>{signal.title}</h3>
                                    <p>{signal.description}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="section section-frame">
                    <div className="container section-stack editorial-home-stage">
                        <div className="section-heading">
                            <div>
                                <div className="eyebrow">Selected writing</div>
                                <h2 className="section-title">优先展示最能代表方法和判断力的内容</h2>
                            </div>
                            <p className="lead">
                                把文章做成长期资产，而不是一次性的信息堆叠。每篇内容都应该更接近产品，而不是动态。
                            </p>
                        </div>

                        <div className="editorial-home-grid">
                            <div className="editorial-home-main">
                                {loading ? (
                                    <div className="empty-state">正在读取代表文章...</div>
                                ) : featuredPost ? (
                                    <PostCard post={featuredPost} featured />
                                ) : (
                                    <div className="empty-state">暂时还没有公开文章。</div>
                                )}
                            </div>

                            <div className="post-stack editorial-home-side">
                                {secondaryPosts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section section-frame">
                    <div className="container section-stack">
                        <div className="section-heading">
                            <div>
                                <div className="eyebrow">Focus areas</div>
                                <h2 className="section-title">把界面、内容和工作流一起做得更像产品</h2>
                            </div>
                        </div>

                        <div className="focus-grid home-focus-grid">
                            {siteConfig.focusAreas.map((item) => (
                                <article key={item.name} className="focus-card home-focus-card">
                                    <span className="signal-label mono">{item.name}</span>
                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="section">
                    <div className="container section-stack">
                        <div className="section-heading">
                            <div>
                                <div className="eyebrow">Selected projects</div>
                                <h2 className="section-title">代表项目不是数量，而是长期判断力的横截面</h2>
                            </div>
                            <p className="lead">
                                我更在意项目是否能体现结构能力、界面表达、工程质量和长期维护，而不只是做出一个 demo。
                            </p>
                        </div>

                        <div className="three-grid home-project-grid">
                            {projects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="section">
                    <div className="container editorial-grid reverse">
                        <div className="feature-panel">
                            <div className="eyebrow">Operating principles</div>
                            <h2 className="section-title">我如何经营这座博客</h2>
                            <div className="principle-list">
                                {siteConfig.principles.map((item) => (
                                    <div key={item} className="metric-card">
                                        <strong>{item}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="feature-panel accent-panel about-glance-card">
                            <div className="eyebrow">About DSL</div>
                            <h3>{siteConfig.author.name}</h3>
                            <p className="muted">{siteConfig.author.role}</p>
                            <p>{siteConfig.author.bio}</p>
                            <div className="metric-card">
                                <span className="muted mono">CURRENT BASE</span>
                                <strong>{siteConfig.author.location.city}, {siteConfig.author.location.country}</strong>
                            </div>
                            <Link to="/about" className="btn btn-secondary">了解更多</Link>
                        </div>
                    </div>
                </section>

                <section className="section">
                    <div className="container">
                        <div className="cta-shell home-cta-shell">
                            <div>
                                <div className="eyebrow">Contact / Collaboration</div>
                                <h2 className="section-title">如果你也在做长期主义、内容系统或 AI 工作流，可以和我聊聊。</h2>
                                <p className="lead">
                                    适合交流的方向包括：个人品牌站、内容产品、设计系统、AI 自动化、前端体验与独立项目的长期运营。
                                </p>
                            </div>

                            <div className="hero-actions home-hero-actions">
                                <a href={`mailto:${siteConfig.email}`} className="btn btn-primary">发送邮件</a>
                                <Link to="/blog" className="btn btn-ghost">继续阅读</Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
