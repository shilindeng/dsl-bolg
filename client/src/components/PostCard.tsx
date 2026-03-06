import { Link } from 'react-router-dom';
import type { Post } from '../api/client';
import { formatShortDate } from '../lib/format';

export default function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
    return (
        <Link
            to={`/blog/${post.slug}`}
            className={`post-card ${featured ? 'post-card-featured' : ''}`}
            data-testid={`post-card-${post.slug}`}
        >
            <div className="post-card-topline">
                <div className="post-card-meta">
                    {post.featured ? <span className="badge badge-gold">Featured</span> : null}
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
                <span className="command-hint">Read Signal</span>
            </div>
        </Link>
    );
}
