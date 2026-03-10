import { Link } from 'react-router-dom';
import type { Post } from '../api/client';
import { formatShortDate } from '../lib/format';
import LazyImage from './LazyImage';
import SiteIcon from './SiteIcon';

interface PostCardProps {
    post: Post;
    featured?: boolean;
    compact?: boolean;
}

function getSummary(post: Post) {
    return post.deck?.trim() || post.excerpt;
}

export default function PostCard({ post, featured = false, compact = false }: PostCardProps) {
    const classes = ['post-card'];

    if (featured) {
        classes.push('is-featured');
    }

    if (compact) {
        classes.push('is-compact');
    }

    return (
        <Link to={`/blog/${post.slug}`} className={classes.join(' ')} data-testid={`post-card-${post.slug}`}>
            <div className="post-card-media">
                {post.coverImage ? (
                    <LazyImage src={post.coverImage} alt={post.coverAlt || post.title} />
                ) : (
                    <div className="visual-placeholder">
                        <span className="visual-badge">
                            <SiteIcon name="book-open" size={14} />
                            <span>article</span>
                        </span>
                        <strong>{post.category?.name || '长期写作'}</strong>
                    </div>
                )}
            </div>

            <div className="post-card-content">
                <div className="post-card-topline">
                    <div className="meta-inline">
                        {post.featured ? <span className="badge">精选</span> : null}
                        {post.category ? (
                            <span className="chip">
                                <SiteIcon name="folder" size={13} />
                                <span>{post.category.name}</span>
                            </span>
                        ) : null}
                    </div>

                    <span className="meta-pill">
                        <SiteIcon name="calendar" size={13} />
                        <span>{formatShortDate(post.publishedAt || post.createdAt)}</span>
                    </span>
                </div>

                <div className="post-card-body">
                    <h3>{post.title}</h3>
                    <p>{getSummary(post)}</p>
                </div>

                <div className="post-card-bottom">
                    <div className="tag-list">
                        {post.tags.slice(0, featured ? 4 : 3).map((tag) => (
                            <span key={tag.id} className="tag">
                                <SiteIcon name="tag" size={12} />
                                <span>{tag.name}</span>
                            </span>
                        ))}
                    </div>

                    <div className="meta-inline">
                        <span className="meta-pill">
                            <SiteIcon name="clock" size={13} />
                            <span>{post.meta?.readTime || 1} 分钟</span>
                        </span>
                        <span className="meta-pill emphasis">
                            <span>阅读全文</span>
                            <SiteIcon name="arrow-right" size={13} />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
