import { Link } from 'react-router-dom';
import type { Post } from '../api/client';
import LazyImage from './LazyImage';
import { formatShortDate } from '../lib/format';

export default function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
    const categoryLabel = post.category?.name || '文章';

    return (
        <Link
            to={`/blog/${post.slug}`}
            className={`post-card ${featured ? 'post-card-featured' : ''}`}
            data-testid={`post-card-${post.slug}`}
        >
            <div className={`post-card-cover ${featured ? 'is-featured' : ''}`}>
                <LazyImage src={post.coverImage} alt={post.title} fallbackLabel={post.title} fallbackKicker={categoryLabel.toUpperCase()} />
            </div>

            <div className="post-card-topline">
                <div className="post-card-meta">
                    {post.featured ? <span className="badge badge-gold">精选</span> : null}
                    <span className="chip">{categoryLabel}</span>
                </div>
                <span className="chip mono">{formatShortDate(post.publishedAt || post.createdAt)}</span>
            </div>

            <div className="post-card-body">
                <span className="post-card-kicker mono">{featured ? '代表内容' : '归档阅读'}</span>
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
