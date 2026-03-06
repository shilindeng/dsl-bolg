import { Link } from 'react-router-dom';
import type { Post } from '../api/client';
import LazyImage from './LazyImage';
import { formatShortDate } from '../lib/format';

export default function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
    return (
        <Link
            to={`/blog/${post.slug}`}
            className={`post-card ${featured ? 'post-card-featured' : ''}`}
            data-testid={`post-card-${post.slug}`}
        >
            {post.coverImage ? (
                <div className={`post-card-cover ${featured ? 'is-featured' : ''}`}>
                    <LazyImage src={post.coverImage} alt={post.title} />
                </div>
            ) : null}

            <div className="post-card-topline">
                <div className="post-card-meta">
                    {post.featured ? <span className="badge badge-gold">精选</span> : null}
                    {post.category ? <span className="chip">{post.category.name}</span> : null}
                </div>
                <span className="chip mono">{formatShortDate(post.publishedAt || post.createdAt)}</span>
            </div>

            <div className="post-card-body">
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
            </div>

            <div className="post-card-bottom">
                <div className="tag-list">
                    {post.tags.slice(0, featured ? 4 : 3).map((tag) => (
                        <span key={tag.id} className="tag">{tag.name}</span>
                    ))}
                </div>
                <div className="post-card-stats">
                    {post.meta ? <span className="command-hint">{post.meta.readTime || 1} 分钟</span> : null}
                    <span className="command-hint">阅读全文</span>
                </div>
            </div>
        </Link>
    );
}
