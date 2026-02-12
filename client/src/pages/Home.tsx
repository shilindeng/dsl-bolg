import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts, fetchProjects, type Post, type Project } from '../api/client';
import ParticleBackground from '../components/ParticleBackground';
import BentoCard from '../components/BentoCard';
import TypewriterText from '../components/TypewriterText';
import GlitchText from '../components/GlitchText';
import ScrollReveal from '../components/ScrollReveal';
import { useSound } from '../hooks/useSound';

export default function Home() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const { play } = useSound();

    useEffect(() => {
        // Startup sound
        const timer = setTimeout(() => play('success'), 800);
        return () => clearTimeout(timer);
    }, [play]);

    useEffect(() => {
        Promise.all([fetchPosts(), fetchProjects()])
            .then(([p, pr]) => { setPosts(p.slice(0, 3)); setProjects(pr.filter(x => x.featured).slice(0, 2)); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ position: 'relative' }}>
            {/* Hero Section */}
            <section style={{
                position: 'relative',
                minHeight: '90vh', // Taller hero
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                marginTop: '-var(--navbar-height)', // Counteract navbar padding for full screen feel
                paddingTop: 'var(--navbar-height)',
            }}>
                <ParticleBackground />

                <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--accent-cyan)',
                            marginBottom: 'var(--space-md)',
                            fontSize: '1rem',
                            letterSpacing: '0.1em'
                        }}>
                            <TypewriterText text="> 唤醒中, 用户..." speed={100} cursor={false} />
                        </div>

                        <h1 style={{
                            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                            marginBottom: 'var(--space-lg)',
                            lineHeight: 1.1,
                            textTransform: 'uppercase'
                        }}>
                            <div>我是 <span className="gradient-text">DSL</span></div>
                            <GlitchText text="VIBE_CODER" />
                        </h1>

                        <p style={{
                            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                            color: 'var(--text-secondary)',
                            maxWidth: '600px',
                            margin: '0 auto var(--space-xl)',
                            fontFamily: 'var(--font-mono)'
                        }}>
                            用代码、AI 和纯粹的 <span style={{ color: 'var(--accent-pink)' }}>风格</span> 构建数字现实。
                        </p>

                        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/blog" className="btn">
                                执行 _博客.exe
                            </Link>
                            <Link to="/projects" className="btn btn-ghost">
                                查看 _项目
                            </Link>
                        </div>
                    </div>

                    <ScrollReveal>
                        <div style={{
                            opacity: 0.6,
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-mono)',
                            marginTop: 'var(--space-3xl)',
                            color: 'var(--text-muted)'
                        }}>
                            向下滚动解密 v
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* Asymmetric Bento Grid */}
            <section className="container" style={{ paddingBottom: 'var(--space-3xl)' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(12, 1fr)', // 12 column grid for asymmetry
                    gap: 'var(--space-lg)',
                    gridAutoRows: 'minmax(100px, auto)'
                }} className="bento-grid">

                    {/* Latest Posts: Main Block (Span 8) */}
                    <BentoCard span={2} className="card-posts" title="最新日志" style={{ gridColumn: 'span 8', minHeight: '400px' }}>
                        <ScrollReveal>
                            {loading ? (
                                <p className="animate-pulse">加载数据流...</p>
                            ) : posts.length === 0 ? (
                                <p>未找到数据</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                    {posts.map(post => (
                                        <Link key={post.id} to={`/blog/${post.slug}`} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px',
                                            borderLeft: '2px solid var(--border-dim)',
                                            background: 'rgba(255,255,255,0.02)',
                                            textDecoration: 'none',
                                            transition: 'all 0.2s ease'
                                        }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.borderLeftColor = 'var(--accent-cyan)';
                                                e.currentTarget.style.background = 'rgba(0, 255, 200, 0.05)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.borderLeftColor = 'var(--border-dim)';
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                            }}
                                        >
                                            <div>
                                                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{post.title}</h3>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div style={{ color: 'var(--accent-cyan)' }}>&gt;</div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </ScrollReveal>
                    </BentoCard>

                    {/* Terminal Profile (Span 4) */}
                    <BentoCard span={1} title="用户档案" style={{ gridColumn: 'span 4', gridRow: 'span 2' }}>
                        <ScrollReveal delay={0.2}>
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.85rem',
                                lineHeight: 1.8,
                                color: 'var(--text-secondary)'
                            }}>
                                <div style={{ marginBottom: 'var(--space-md)' }}>
                                    <TypewriterText text="> whoami" speed={50} cursor={false} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px' }}>
                                    <span style={{ color: 'var(--accent-purple)' }}>用户:</span> <span>DSL</span>
                                    <span style={{ color: 'var(--accent-purple)' }}>职业:</span> <span>赛博术士</span>
                                    <span style={{ color: 'var(--accent-purple)' }}>等级:</span> <span>99</span>
                                    <span style={{ color: 'var(--accent-purple)' }}>公会:</span> <span>VibeCoders</span>
                                </div>
                                <div style={{ marginTop: 'var(--space-lg)', padding: '10px', border: '1px dashed var(--border-dim)' }}>
                                    "代码是写给机器的诗。"
                                </div>
                            </div>
                        </ScrollReveal>
                    </BentoCard>

                    {/* Featured Projects (Span 4 each) */}
                    {projects.map((project, i) => (
                        <div key={project.id} style={{ gridColumn: 'span 6', display: 'contents' }}>
                            {/* Wait, using contents to pass grid props to BentoCard inside wrapper? No, just pass style directly to BentoCard */}
                        </div>
                    ))}
                    {projects.map((project, i) => (
                        <BentoCard key={project.id} title={`项目_0${i + 1}`} style={{ gridColumn: 'span 6' }}>
                            <ScrollReveal delay={0.3 + i * 0.1}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-md)' }}>
                                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{project.name}</h3>
                                    {project.featured && <span className="tag">精选</span>}
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                                    {project.description.slice(0, 100)}...
                                </p>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {project.techStack.split(',').slice(0, 3).map(t => (
                                        <span key={t} style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>[{t.trim()}]</span>
                                    ))}
                                </div>
                            </ScrollReveal>
                        </BentoCard>
                    ))}

                    {/* Stack (Span 12 / Full width strip) */}
                    <BentoCard title="系统模块" style={{ gridColumn: 'span 12', background: 'var(--bg-secondary)' }}>
                        <ScrollReveal delay={0.5}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-lg)', alignItems: 'center', justifyContent: 'center' }}>
                                {['REACT', 'TYPESCRIPT', 'NODE.JS', 'PYTHON', 'DOCKER', 'NEOVIM', 'GIT'].map(tech => (
                                    <div key={tech} style={{
                                        fontFamily: 'var(--font-display)',
                                        fontWeight: 800,
                                        color: 'var(--border-bright)',
                                        fontSize: '1.5rem'
                                    }}>
                                        {tech}
                                    </div>
                                ))}
                            </div>
                        </ScrollReveal>
                    </BentoCard>
                </div>

                <style>{`
                  @media (max-width: 900px) {
                    .bento-grid > div {
                      grid-column: span 12 !important; 
                      grid-row: auto !important;
                    }
                  }
                `}</style>
            </section>
        </div>
    );
}
