import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAccountComments, type AccountComment } from '../../api/client';
import { formatDateTime } from '../../lib/format';

export default function AccountCommentsPage() {
    const [comments, setComments] = useState<AccountComment[]>([]);

    useEffect(() => {
        fetchAccountComments().then(setComments).catch(() => setComments([]));
    }, []);

    return (
        <div className="feature-panel">
            <div className="section-heading">
                <div>
                    <div className="eyebrow">My Comments</div>
                    <h2 className="section-title">我的评论</h2>
                </div>
            </div>
            <div className="hero-metrics">
                <div className="metric-card">
                    <span className="muted mono">TOTAL</span>
                    <strong>{comments.length}</strong>
                </div>
                <div className="metric-card">
                    <span className="muted mono">STATUS</span>
                    <strong>含审核状态</strong>
                </div>
            </div>
            {comments.length ? (
                <div className="account-list">
                    {comments.map((comment) => (
                        <article key={comment.id} className="archive-row">
                            <div>
                                <h3>{comment.post?.title || '未关联文章'}</h3>
                                <p>{comment.content}</p>
                                <span className="muted">{formatDateTime(comment.createdAt)}</span>
                            </div>
                            <div className="account-list-meta">
                                <span className="chip">{comment.status}</span>
                                {comment.post ? <Link to={`/blog/${comment.post.slug}`} className="btn btn-ghost">查看文章</Link> : null}
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="empty-state">你还没有提交过评论。</div>
            )}
        </div>
    );
}
