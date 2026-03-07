import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts, fetchProjects, type Post, type Project } from '../api/client';
import ParticleBackground from '../components/ParticleBackground';
import SEO from '../components/SEO';
import WeatherCard from '../components/WeatherCard';
import PostCard from '../components/PostCard';
import ProjectCard from '../components/ProjectCard';
import LazyImage from '../components/LazyImage';
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

            <div className="home-page-shell">
                <div className="home-particle-layer" aria-hidden="true">
                    <ParticleBackground variant="page" />
                </div>

            <section className="section hero-section" data-testid="home-hero">
                <div className="container hero-grid">
                    <div className="hero-shell home-hero-shell" data-testid="hero-panel">
                        <div className="hero-scanline" />

                        <div className="hero-content">
                            <div className="cyber-header-bar">
                                <span className="cyber-dot" />
                                <span className="cyber-dot" />
                                <span className="cyber-dot" />
                                <span className="command-hint">PERSONAL BRAND SYSTEM / LIVE</span>
                            </div>

                            <div className="hero-copy">
                                <div className="eyebrow">Future Editorial Identity</div>
                                <p className="hero-kicker mono">来自上海的长期信号 · 写作 / 系统 / 产品 / 审美</p>
                                <h1 className="display-title">
                                    把博客做成
                                    <br />
                                    一套真正上线的个人品牌系统。
                                </h1>
                                <p className="lead">
                                    这里不是模板化展示页，而是围绕技术写作、AI 工作流、内容工程与设计表达持续迭代的长期资产。
                                    我关心的不只是“好看”，而是一个站点如何同时拥有秩序、质感、效率和记忆点。
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

                    <div className="section-stack hero-side-stack">
                        <div className="panel panel-body home-visual-board">
                            <div className="section-heading-left">
                                <div>
                                    <div className="eyebrow">Landing Visual</div>
                                    <h2 className="hero-side-title">更像品牌落地页，而不是组件堆叠</h2>
                                </div>
                            </div>

                            <div className="home-visual-grid">
                                <div className="home-visual-card home-visual-card-large">
                                    {featuredPost?.coverImage ? (
                                        <LazyImage src={featuredPost.coverImage} alt={featuredPost.title} />
                                    ) : (
                                        <div className="home-visual-placeholder" />
                                    )}
                                    <div className="home-visual-overlay">
                                        <span className="chip">Featured Story</span>
                                        <strong>{featuredPost?.title || '代表内容会显示在这里'}</strong>
                                    </div>
                                </div>

                                <div className="home-visual-stack">
                                    <div className="home-visual-card home-visual-card-small">
                                        {projects[0]?.coverImage ? (
                                            <LazyImage src={projects[0].coverImage} alt={projects[0].name} />
                                        ) : (
                                            <div className="home-visual-placeholder is-alt" />
                                        )}
                                        <div className="home-visual-overlay compact">
                                            <span className="command-hint">Project</span>
                                            <strong>{projects[0]?.name || 'Project Preview'}</strong>
                                        </div>
                                    </div>
                                    <div className="metric-card home-visual-copy-card">
                                        <span className="muted mono">POSITIONING</span>
                                        <strong>内容品牌 / 项目陈列 / 开放发布能力</strong>
                                        <p className="muted">首页首屏直接传递专业感、可持续更新感和真实可交付能力。</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <WeatherCard />

                        <div className="panel panel-body hero-preview-panel">
                            <div className="section-heading-left">
                                <div>
                                    <div className="eyebrow">Editorial Preview</div>
                                    <h2 className="hero-side-title">先看代表内容，再判断是否值得持续关注</h2>
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
                                    <Link to={`/blog/${featuredPost.slug}`} className="btn btn-secondary">阅读这篇代表内容</Link>
                                </div>
                            ) : (
                                <div className="empty-state">代表内容会在发布后出现在这里。</div>
                            )}
                        </div>

                        <div className="panel panel-body">
                            <div className="section-heading-left">
                                <div>
                                    <div className="eyebrow">Current Focus</div>
                                    <h2 className="section-title">正在打磨的能力栈</h2>
                                </div>
                            </div>

                            <div className="principle-list">
                                {siteConfig.currentFocus.map((item, index) => (
                                    <div key={item} className="metric-card">
                                        <span className="muted mono">0{index + 1}</span>
                                        <strong>{item}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section section-frame">
                <div className="container">
                    <div className="section-heading">
                        <div>
                            <div className="eyebrow">核心信号</div>
                            <h2 className="section-title">不是“有博客”，而是“有系统”</h2>
                        </div>
                        <p className="lead">
                            我希望这个站点既能表达个性，又能承载长期内容、项目沉淀和真实工作流，而不是只停留在漂亮截图层面。
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

            <section className="section section-frame">
                <div className="container section-stack">
                    <div className="section-heading">
                        <div>
                            <div className="eyebrow">精选写作</div>
                            <h2 className="section-title">先看代表性内容，再判断是否值得持续关注</h2>
                        </div>
                        <p className="lead">
                            文章不是内容填充物，而是方法、判断和项目经验的公开接口。优先展示能代表这个系统气质的内容。
                        </p>
                    </div>

                    <div className="section-stack">
                        {loading ? (
                            <div className="empty-state">正在读取代表文章...</div>
                        ) : featuredPost ? (
                            <PostCard post={featuredPost} featured />
                        ) : (
                            <div className="empty-state">暂时还没有公开文章。</div>
                        )}

                        <div className="post-stack">
                            {secondaryPosts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="section section-frame">
                <div className="container">
                    <div className="section-heading">
                        <div>
                            <div className="eyebrow">关注方向</div>
                            <h2 className="section-title">我正在把哪些事情做得更像产品</h2>
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
                <div className="container section-stack">
                    <div className="section-heading">
                        <div>
                            <div className="eyebrow">精选项目</div>
                            <h2 className="section-title">代表项目不是数量，而是判断力的横截面</h2>
                        </div>
                        <p className="lead">
                            每个项目都应该能说明一件事：我如何从概念、结构、体验和交付四个维度去做完整产品，而不是只做静态展示。
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
                        <div className="eyebrow">运营原则</div>
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
                        <div className="eyebrow">关于 DSL</div>
                        <h3>{siteConfig.author.name}</h3>
                        <p className="muted">{siteConfig.author.role}</p>
                        <p>{siteConfig.author.bio}</p>
                        <div className="metric-card">
                            <span className="muted mono">当前所在地</span>
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
                            <div className="eyebrow">联系 / 合作</div>
                            <h2 className="section-title">如果你也在做长期主义、内容系统或 AI 工作流，可以联系我。</h2>
                            <p className="lead">
                                适合交流的方向包括：个人品牌站、内容产品、设计系统、AI 自动化、前端体验与独立项目的长期运营。
                            </p>
                        </div>

                        <div className="hero-actions">
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
