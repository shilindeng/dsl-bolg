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

        Promise.all([fetchPosts({ limit: 5 }), fetchProjects()])
            .then(([postResponse, projectResponse]) => {
                if (cancelled) return;

                const featuredProjects = projectResponse.filter((item) => item.featured);

                setPosts(postResponse.data);
                setProjects((featuredProjects.length ? featuredProjects : projectResponse).slice(0, 3));
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
    const railPosts = posts.slice(1, 4);
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
                                <span className="command-hint">博客系统 / 长期在线</span>
                            </div>

                            <div className="hero-copy home-hero-copy">
                                <div className="eyebrow">长期主义的个人品牌主场</div>
                                <p className="hero-kicker mono">写作 / 产品 / 界面 / AI 工作流 / 发布系统</p>
                                <h1 className="display-title home-display-title">
                                    把博客做成真正
                                    <br />
                                    能持续经营的作品系统。
                                </h1>
                                <p className="lead home-hero-lead">
                                    这里不只是展示“我做了什么”，而是把内容、项目、审美和部署能力一起组织成可长期累积的个人资产界面。
                                </p>
                            </div>

                            <div className="hero-actions home-hero-actions">
                                <Link to="/blog" className="btn btn-primary">进入文章归档</Link>
                                <Link to="/projects" className="btn btn-secondary">查看代表项目</Link>
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

                            <div className="home-utility-rail home-utility-grid">
                                <WeatherCard />

                                <div className="panel panel-body hero-preview-panel utility-note-card">
                                    <div className="section-heading-left">
                                        <div>
                                            <div className="eyebrow">当前主线</div>
                                            <h2 className="hero-side-title">首页负责建立气质，正文负责建立信任</h2>
                                        </div>
                                    </div>

                                    <div className="utility-note-list">
                                        {siteConfig.currentFocus.map((item, index) => (
                                            <div key={item} className="utility-note-row">
                                                <span className="signal-label mono">0{index + 1}</span>
                                                <p>{item}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <Link to="/about" className="btn btn-secondary">了解作者方法论</Link>
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
                                <div className="eyebrow">精选文章</div>
                                <h2 className="section-title">先看到最能代表方法与判断力的内容</h2>
                            </div>
                            <p className="lead">
                                首页不堆满所有文章，而是优先把最值得建立第一印象的内容推到前面，让读者更快理解这座博客的真正价值。
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

                            <aside className="post-stack editorial-home-side home-editorial-rail">
                                <div className="feature-panel editorial-rail-header">
                                    <div className="eyebrow">继续阅读</div>
                                    <h3>归档入口</h3>
                                    <p className="muted">更轻、更快、更像编辑推荐列表，而不是重复的大卡片堆叠。</p>
                                </div>

                                {railPosts.length ? (
                                    railPosts.map((post) => (
                                        <Link key={post.id} to={`/blog/${post.slug}`} className="signal-card archive-rail-card">
                                            <div className="archive-rail-meta">
                                                <span className="chip">{post.category?.name || '文章'}</span>
                                                <span className="command-hint">{post.meta?.readTime || 1} 分钟</span>
                                            </div>
                                            <h3>{post.title}</h3>
                                            <p>{post.excerpt}</p>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="empty-state">更多文章会在持续发布后显示在这里。</div>
                                )}

                                <Link to="/blog" className="btn btn-ghost">打开完整归档</Link>
                            </aside>
                        </div>
                    </div>
                </section>

                <section className="section section-frame">
                    <div className="container section-stack">
                        <div className="section-heading">
                            <div>
                                <div className="eyebrow">聚焦方向</div>
                                <h2 className="section-title">把界面、内容和工作流做成同一套产品表达</h2>
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
                                <div className="eyebrow">代表项目</div>
                                <h2 className="section-title">项目页承担方法论与落地能力的第二层证明</h2>
                            </div>
                            <p className="lead">
                                文章建立判断力，项目建立可信度。它们共同决定这座博客是否真的像一个成熟品牌，而不是零散内容堆叠。
                            </p>
                        </div>

                        <div className="home-project-stage">
                            <div className="feature-panel home-project-intro">
                                <div className="eyebrow">项目主叙事</div>
                                <h3>{featuredProject?.name || '项目不只是附属页，而是品牌证据链的一部分'}</h3>
                                <p>{featuredProject?.summary || '挑选能代表结构、表达、工程和持续维护能力的项目，而不是把 demo 数量堆满页面。'}</p>
                                <div className="principle-list compact-principles">
                                    {siteConfig.principles.map((item) => (
                                        <div key={item} className="metric-card">
                                            <strong>{item}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="three-grid home-project-grid">
                                {projects.map((project) => (
                                    <ProjectCard key={project.id} project={project} />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section">
                    <div className="container editorial-grid reverse">
                        <div className="feature-panel">
                            <div className="eyebrow">作者与方法</div>
                            <h2 className="section-title">我如何经营这座博客</h2>
                            <p className="lead">
                                目标不是做一个短期漂亮的页面，而是把个人表达做成一个能持续发布、持续校准、持续积累信任的系统界面。
                            </p>
                            <div className="principle-list">
                                {siteConfig.principles.map((item) => (
                                    <div key={item} className="metric-card">
                                        <strong>{item}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="feature-panel accent-panel about-glance-card">
                            <div className="eyebrow">关于 DSL</div>
                            <h3>{siteConfig.author.name}</h3>
                            <p className="muted">{siteConfig.author.role}</p>
                            <p>{siteConfig.author.bio}</p>
                            <div className="metric-card">
                                <span className="muted mono">当前基准城市</span>
                                <strong>{siteConfig.author.location.city}, {siteConfig.author.location.country}</strong>
                            </div>
                            <Link to="/about" className="btn btn-secondary">查看更多</Link>
                        </div>
                    </div>
                </section>

                <section className="section">
                    <div className="container">
                        <div className="cta-shell home-cta-shell">
                            <div>
                                <div className="eyebrow">联系与合作</div>
                                <h2 className="section-title">如果你也在做长期主义内容系统、独立项目或 AI 工作流，我们可以聊聊。</h2>
                                <p className="lead">
                                    适合交流的方向包括：个人品牌站、内容产品、设计系统、AI 自动化、前端体验，以及把创作链路真正上线的工程实践。
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
