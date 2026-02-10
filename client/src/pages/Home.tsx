import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts, fetchProjects, type Post, type Project } from '../api/client';
import ParticleBackground from '../components/ParticleBackground';
import BentoCard from '../components/BentoCard';

export default function Home() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchPosts(), fetchProjects()])
            .then(([p, pr]) => { setPosts(p.slice(0, 3)); setProjects(pr.filter(x => x.featured).slice(0, 2)); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            {/* Hero 区域 */}
            <section style={{
                position: 'relative',
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}>
                <ParticleBackground />
                <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <div className="animate-fade-in-up" style={{ opacity: 0 }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>⚡</div>
                        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 'var(--space-md)' }}>
                            <span className="gradient-text">你好，我是 DSL</span>
                        </h1>
                        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto var(--space-xl)' }}>
                            开发者 · Vibe Coder · 技术探索者
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/blog" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '1rem' }}>📝 阅读博客</Link>
                            <Link to="/projects" className="btn btn-ghost" style={{ padding: '12px 28px', fontSize: '1rem' }}>🛠️ 查看项目</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bento Grid */}
            <section className="container" style={{ paddingBottom: 'var(--space-3xl)' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 'var(--space-lg)',
                }} className="bento-grid">
                    {/* 最新文章 */}
                    <BentoCard span={2} delay={0.1}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>📝 最新文章</h2>
                        {loading ? (
                            <p style={{ color: 'var(--text-muted)' }}>加载中...</p>
                        ) : posts.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>暂无文章</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                {posts.map(post => (
                                    <Link key={post.id} to={`/blog/${post.slug}`} style={{
                                        display: 'block',
                                        padding: 'var(--space-md)',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'var(--bg-glass)',
                                        border: '1px solid var(--border-glass)',
                                        transition: 'all var(--transition-fast)',
                                        textDecoration: 'none',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateX(8px)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{post.title}</h3>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{post.excerpt.slice(0, 60)}...</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                                {post.tags.slice(0, 2).map(tag => (
                                                    <span key={tag.id} className="tag" style={{ fontSize: '0.65rem' }}>{tag.name}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                        <Link to="/blog" style={{
                            display: 'inline-block',
                            marginTop: 'var(--space-lg)',
                            color: 'var(--accent-primary)',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                        }}>查看全部文章 →</Link>
                    </BentoCard>

                    {/* 终端风格自我介绍 */}
                    <BentoCard delay={0.2}>
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.8rem',
                            lineHeight: 2,
                        }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>~/about $</div>
                            <div><span style={{ color: 'var(--accent-primary)' }}>name:</span> <span style={{ color: 'var(--text-secondary)' }}>DSL</span></div>
                            <div><span style={{ color: 'var(--accent-primary)' }}>role:</span> <span style={{ color: 'var(--text-secondary)' }}>Developer</span></div>
                            <div><span style={{ color: 'var(--accent-primary)' }}>focus:</span> <span style={{ color: 'var(--text-secondary)' }}>Full-Stack</span></div>
                            <div><span style={{ color: 'var(--accent-primary)' }}>vibe:</span> <span style={{ color: 'var(--text-secondary)' }}>Coding ⚡</span></div>
                            <div style={{ color: 'var(--text-muted)', marginTop: 'var(--space-sm)', opacity: 0.6 }}>
                                <span className="animate-float" style={{ display: 'inline-block' }}>▊</span>
                            </div>
                        </div>
                    </BentoCard>

                    {/* 精选项目 */}
                    {projects.map((project, i) => (
                        <BentoCard key={project.id} delay={0.3 + i * 0.1}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                                <span style={{ fontSize: '1.2rem' }}>🛠️</span>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{project.name}</h3>
                                {project.featured && (
                                    <span style={{
                                        background: 'var(--accent-gradient)',
                                        color: 'white',
                                        fontSize: '0.6rem',
                                        fontWeight: 600,
                                        padding: '1px 8px',
                                        borderRadius: '999px',
                                    }}>精选</span>
                                )}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                                {project.description.slice(0, 80)}
                            </p>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {project.techStack.split(',').slice(0, 3).map(t => (
                                    <span key={t} className="tag" style={{ fontSize: '0.65rem' }}>{t.trim()}</span>
                                ))}
                            </div>
                        </BentoCard>
                    ))}

                    {/* 技术栈 */}
                    <BentoCard delay={0.5}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>🧰 技术栈</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                            {['React', 'TypeScript', 'Node.js', 'Python', 'SQLite', 'Git', 'Docker', 'AI'].map(tech => (
                                <span key={tech} className="tag">{tech}</span>
                            ))}
                        </div>
                    </BentoCard>
                </div>

                <style>{`
          @media (max-width: 768px) {
            .bento-grid {
              grid-template-columns: 1fr !important;
            }
            .bento-grid > * {
              grid-column: span 1 !important;
            }
          }
        `}</style>
            </section>
        </div>
    );
}
