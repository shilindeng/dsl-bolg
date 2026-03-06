import { Link } from 'react-router-dom';
import type { Post } from '../api/client';
import { formatShortDate } from '../lib/format';

export default function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
    return (
        <Link to={`/blog/${post.slug}`} className="panel" style={{ display: 'block', height: '100%' }} data-testid={`post-card-${post.slug}`}>
            <div className="panel-body" style={{ display: 'grid', gap: '1rem', minHeight: featured ? 320 : 260 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                    {post.featured ? (
                        <span className="badge" style={{ color: 'var(--accent-gold)' }}>
                            Featured
                        </span>
                    ) : null}
                    {post.category ? <span className="chip">{post.category.name}</span> : null}
                    <span className="chip mono">{formatShortDate(post.publishedAt || post.createdAt)}</span>
                </div>

                <div style={{ display: 'grid', gap: '0.85rem' }}>
                    <h3 style={{ fontSize: featured ? '2rem' : '1.45rem' }}>{post.title}</h3>
                    <p className="muted" style={{ margin: 0 }}>{post.excerpt}</p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center', marginTop: 'auto' }}>
                    {post.tags.slice(0, featured ? 4 : 3).map((tag) => (
                        <span key={tag.id} className="tag">{tag.name}</span>
                    ))}
                    <span className="command-hint" style={{ marginLeft: 'auto' }}>
                        Read
                    </span>
                </div>
            </div>
        </Link>
    );
}
