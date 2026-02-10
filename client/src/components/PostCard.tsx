import { Link } from 'react-router-dom';
import type { Post } from '../api/client';

export default function PostCard({ post, index }: { post: Post; index: number }) {
    const date = new Date(post.createdAt).toLocaleDateString('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <Link
            to={`/blog/${post.slug}`}
            className="glass-card animate-fade-in-up"
            style={{
                display: 'block',
                padding: 'var(--space-xl)',
                textDecoration: 'none',
                animationDelay: `${index * 0.1}s`,
                opacity: 0,
                cursor: 'pointer',
            }}
        >
            {post.coverImage && (
                <div style={{
                    width: '100%',
                    height: '180px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    marginBottom: 'var(--space-md)',
                }}>
                    <img src={post.coverImage} alt={post.title} style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        transition: 'transform var(--transition-base)',
                    }} />
                </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-sm)' }}>
                {post.tags.map(tag => (
                    <span key={tag.id} className="tag">{tag.name}</span>
                ))}
            </div>

            <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 600,
                marginBottom: 'var(--space-sm)',
                color: 'var(--text-primary)',
                lineHeight: 1.4,
            }}>{post.title}</h3>

            <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                marginBottom: 'var(--space-md)',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
            }}>{post.excerpt}</p>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
            }}>
                <span>{date}</span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>阅读更多 →</span>
            </div>
        </Link>
    );
}
