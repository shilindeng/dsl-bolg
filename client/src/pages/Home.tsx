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

            <section className="section hero-panel" data-testid="home-hero">
                <div className="container hero-layout">
                    <div className="panel" style={{ position: 'relative', overflow: 'hidden' }} data-testid="hero-panel">
                        <ParticleBackground />
                        <div className="hero-orb" />
                        <div className="panel-body" style={{ position: 'relative', display: 'grid', gap: '1.5rem' }}>
                            <div className="eyebrow">Professional Personal Blog</div>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <h1 className="display-title">
                                    写技术、做项目，
                                    <br />
                                    也认真经营审美与表达。
                                </h1>
                                <p className="lead">
                                    这里不是一个临时作品页，而是一套长期写作、项目沉淀和个人品牌表达系统。
                                    我关注产品判断、前端体验、AI 工作流，以及数字内容如何变成资产。
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
                                <Link to="/blog" className="btn btn-primary">阅读文章</Link>
                                <Link to="/projects" className="btn btn-secondary">查看项目</Link>
                                <a href={`mailto:${siteConfig.email}`} className="btn btn-ghost">联系合作</a>
                            </div>

                            <div className="hero-stats">
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

            <section className="section">
                <div className="container split-grid">
                    <div style={{ display: 'grid', gap: '1.2rem' }}>
                        <div>
                            <div className="eyebrow">Featured Writing</div>
                            <h2 className="section-title" style={{ marginTop: '1rem' }}>精选文章</h2>
                            <p className="lead" style={{ maxWidth: '52ch', marginTop: '1rem' }}>
                                先看代表性内容，再决定要不要继续关注。这一页不追求热闹，而追求判断力。
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

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {secondaryPosts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="eyebrow">Selected Projects</div>
                        <h2 className="section-title">代表项目</h2>
                        <p className="lead">
                            项目展示不是为了铺数量，而是证明我的方法论、完成度和持续打磨能力。
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
                <div className="container split-grid">
                    <div className="panel">
                        <div className="panel-body" style={{ display: 'grid', gap: '1rem' }}>
                            <div className="eyebrow">Operating Principles</div>
                            <h2 className="section-title" style={{ fontSize: '2.4rem' }}>我如何经营这座博客</h2>
                            <div style={{ display: 'grid', gap: '0.9rem' }}>
                                {siteConfig.principles.map((item) => (
                                    <div key={item} className="metric-card">
                                        <strong style={{ fontSize: '1.05rem' }}>{item}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-body" style={{ display: 'grid', gap: '1rem' }}>
                            <div className="eyebrow">About DSL</div>
                            <h3 style={{ fontSize: '1.8rem' }}>{siteConfig.author.name}</h3>
                            <p className="muted" style={{ margin: 0 }}>{siteConfig.author.role}</p>
                            <p style={{ margin: 0 }}>{siteConfig.author.bio}</p>
                            <div className="metric-card">
                                <span className="muted mono">Current base</span>
                                <strong>{siteConfig.author.location.city}, {siteConfig.author.location.country}</strong>
                            </div>
                            <Link to="/about" className="btn btn-secondary">了解更多</Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="panel">
                        <div className="panel-body" style={{ display: 'grid', gap: '1rem', alignItems: 'center' }}>
                            <div className="eyebrow">Contact / Collaboration</div>
                            <h2 className="section-title">如果你也在做认真而长期的东西，可以联系我。</h2>
                            <p className="lead" style={{ maxWidth: '48ch' }}>
                                适合交流的话题包括：个人品牌站、内容产品、AI 工作流、设计系统、前端体验和独立产品。
                            </p>
                            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                                <a href={`mailto:${siteConfig.email}`} className="btn btn-primary">发送邮件</a>
                                <Link to="/blog" className="btn btn-ghost">继续阅读</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
