import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts, fetchProjects, type Post, type Project } from '../api/client';
import ParticleBackground from '../components/ParticleBackground';
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

            <section className="section hero-section" data-testid="home-hero">
                <div className="container hero-grid">
                    <div className="hero-shell">
                        <ParticleBackground />
                        <div className="hero-scanline" />
                        <div className="hero-content">
                            <div className="eyebrow">Cyber Editorial System</div>
                            <div className="hero-copy">
                                <p className="hero-kicker mono">Independent signal from Shanghai</p>
                                <h1 className="display-title">
                                    写技术、做产品，
                                    <br />
                                    也认真经营数字审美。
                                </h1>
                                <p className="lead">
                                    这里不是临时作品页，而是一套长期写作、项目沉淀和个人表达系统。
                                    我关注前端体验、AI 工作流、内容结构，以及博客如何变成持续增值的资产。
                                </p>
                            </div>

                            <div className="hero-actions">
                                <Link to="/blog" className="btn btn-primary">阅读文章</Link>
                                <Link to="/projects" className="btn btn-secondary">查看项目</Link>
                                <a href={`mailto:${siteConfig.email}`} className="btn btn-ghost">联系合作</a>
                            </div>

                            <div className="hero-metrics">
                                {siteConfig.heroMetrics.map((item) => (
                                    <div key={item.label} className="metric-card">
                                        <span className="muted mono">{item.label}</span>
                                        <strong>{item.value}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <WeatherCard />
                </div>
            </section>

            <section className="section section-frame">
                <div className="container">
                    <div className="section-heading">
                        <div>
                            <div className="eyebrow">Core Signals</div>
                            <h2 className="section-title">这个博客为什么存在</h2>
                        </div>
                        <p className="lead">
                            我想做的不是“看起来像博客”的网站，而是一套有气质、有结构、也有执行力的公开系统。
                        </p>
                    </div>

                    <div className="signal-grid">
                        {siteConfig.homeSignals.map((signal) => (
                            <article key={signal.id} className="signal-card">
                                <span className="signal-label mono">{signal.label}</span>
                                <h3>{signal.title}</h3>
                                <p>{signal.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container editorial-grid">
                    <div className="section-stack">
                        <div className="section-heading section-heading-left">
                            <div>
                                <div className="eyebrow">Featured Writing</div>
                                <h2 className="section-title">精选文章</h2>
                            </div>
                            <p className="lead">
                                先看代表性内容，再决定要不要持续关注。这里不追求热闹，而是强调可复用的方法和判断。
                            </p>
                        </div>

                        {loading ? (
                            <div className="empty-state">正在读取代表文章...</div>
                        ) : featuredPost ? (
                            <PostCard post={featuredPost} featured />
                        ) : (
                            <div className="empty-state">暂时还没有公开文章。</div>
                        )}
                    </div>

                    <div className="post-stack">
                        {secondaryPosts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                </div>
            </section>

            <section className="section section-frame">
                <div className="container">
                    <div className="section-heading">
                        <div>
                            <div className="eyebrow">Focus Areas</div>
                            <h2 className="section-title">我的工作重心</h2>
                        </div>
                    </div>

                    <div className="focus-grid">
                        {siteConfig.focusAreas.map((item) => (
                            <article key={item.name} className="focus-card">
                                <span className="signal-label mono">{item.name}</span>
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="section-heading">
                        <div>
                            <div className="eyebrow">Selected Projects</div>
                            <h2 className="section-title">代表项目</h2>
                        </div>
                        <p className="lead">
                            项目展示不是为了堆数量，而是为了证明方法论、完成度和持续打磨能力。
                        </p>
                    </div>

                    <div className="three-grid">
                        {projects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container editorial-grid reverse">
                    <div className="feature-panel">
                        <div className="eyebrow">Operating Principles</div>
                        <h2 className="section-title">我如何经营这座博客</h2>
                        <div className="principle-list">
                            {siteConfig.principles.map((item) => (
                                <div key={item} className="metric-card">
                                    <strong>{item}</strong>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="feature-panel accent-panel">
                        <div className="eyebrow">About DSL</div>
                        <h3>{siteConfig.author.name}</h3>
                        <p className="muted">{siteConfig.author.role}</p>
                        <p>{siteConfig.author.bio}</p>
                        <div className="metric-card">
                            <span className="muted mono">Current Base</span>
                            <strong>{siteConfig.author.location.city}, {siteConfig.author.location.country}</strong>
                        </div>
                        <Link to="/about" className="btn btn-secondary">了解更多</Link>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="cta-shell">
                        <div>
                            <div className="eyebrow">Contact / Collaboration</div>
                            <h2 className="section-title">如果你也在做认真而长期的东西，可以联系我。</h2>
                            <p className="lead">
                                适合交流的主题包括：个人品牌站、内容产品、AI 工作流、设计系统、前端体验和独立项目。
                            </p>
                        </div>

                        <div className="hero-actions">
                            <a href={`mailto:${siteConfig.email}`} className="btn btn-primary">发送邮件</a>
                            <Link to="/blog" className="btn btn-ghost">继续阅读</Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
