import { Link } from 'react-router-dom';
import type { Post } from '../api/client';
import { useSound } from '../hooks/useSound';

export default function PostCard({ post, index }: { post: Post; index: number }) {
    const { play } = useSound();
    const date = new Date(post.createdAt).toLocaleDateString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    }).replace(/\//g, '.');

    return (
        <Link
            to={`/blog/${post.slug}`}
            className="cyber-card animate-fade-in-up"
            onMouseEnter={() => play('hover')}
            style={{
                display: 'block',
                textDecoration: 'none',
                animationDelay: `${index * 0.1}s`,
                opacity: 0,
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                paddingLeft: '4px', // Space for neon strip
            }}
        >
            {/* Neon Strip */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                background: 'var(--accent-cyan)',
                boxShadow: 'var(--glow-cyan)',
                transition: 'all 0.3s ease',
            }} className="neon-strip" />

            <div style={{ padding: 'var(--space-xl)' }}>
                {/* ID / Date Meta */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: 'var(--space-md)',
                    borderBottom: '1px dashed var(--border-dim)',
                    paddingBottom: '8px'
                }}>
                    <span>ID: {post.id.toString().padStart(4, '0')}</span>
                    <span>{date}</span>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
                    {post.tags.map(tag => (
                        <span key={tag.id} className="tag">{tag.name}</span>
                    ))}
                </div>

                <h3 style={{
                    fontSize: '1.25rem',
                    marginBottom: 'var(--space-md)',
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    transition: 'color 0.2s ease',
                }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-pink)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
                >
                    {post.title}
                </h3>

                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    marginBottom: 'var(--space-lg)',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontFamily: 'var(--font-mono)', // Tech feel description
                }}>{post.excerpt}</p>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.8rem',
                    color: 'var(--accent-cyan)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                }}>
                    <span>[ 读取日志 ]</span>
                    <span style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        background: 'var(--accent-cyan)',
                        animation: 'blink 1s infinite'
                    }} />
                </div>
            </div>
        </Link>
    );
}
