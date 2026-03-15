import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createComment, type Comment } from '../api/client';
import { formatDateTime, getInitials } from '../lib/format';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { resolveAvatarUrl } from '../lib/avatars';

interface CommentsProps {
    postId: number;
    comments: Comment[];
    onCommentAdded: (comment: Comment) => void;
}

export default function Comments({ postId, comments, onCommentAdded }: CommentsProps) {
    const { user, isAuthenticated } = useAuth();
    const { showToast } = useToast();
    const [content, setContent] = useState('');
    const [replyTo, setReplyTo] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!content.trim()) {
            showToast('请填写评论内容。', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const response = await createComment({
                postId,
                content: content.trim(),
                parentId: replyTo || undefined,
            });

            onCommentAdded(response.comment);
            setSubmitted(true);
            setContent('');
            setReplyTo(null);
            showToast('评论已提交，审核通过后会公开显示。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '评论提交失败。', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
        <article className={`comment-card ${isReply ? 'comment-card-reply' : ''}`} data-testid={`comment-item-${comment.id}`}>
            <div className="comment-card-head">
                <div className="comment-author">
                    <div className="comment-avatar" aria-hidden="true">
                        {comment.userId ? (
                            <img src={resolveAvatarUrl(comment.user?.avatarUrl, comment.user?.id || comment.userId)} alt={comment.user?.name || comment.author} />
                        ) : (
                            getInitials(comment.user?.name || comment.author)
                        )}
                    </div>
                    <div>
                        <strong>{comment.user?.name || comment.author}</strong>
                        <div className="muted">{comment.userId ? '会员评论' : '公开评论'}</div>
                        <div className="muted">{formatDateTime(comment.createdAt)}</div>
                    </div>
                </div>

                {!isReply ? (
                    <button type="button" className="btn btn-ghost" onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}>
                        {replyTo === comment.id ? '取消回复' : '回复'}
                    </button>
                ) : null}
            </div>

            <p className="comment-content">{comment.content}</p>

            {comment.replies?.length ? (
                <div className="comment-replies">
                    {comment.replies.map((reply) => (
                        <CommentItem key={reply.id} comment={reply} isReply />
                    ))}
                </div>
            ) : null}
        </article>
    );

    return (
        <section className="section-tight">
            <div className="section-heading" data-testid="public-comments-section">
                <div>
                    <span className="eyebrow">Comment Protocol</span>
                    <h3>公开评论</h3>
                </div>
                <span className="command-hint" data-testid="public-comments-count">{comments.length} 条已公开</span>
            </div>

            {comments.length === 0 ? (
                <div className="empty-state">还没有公开评论。欢迎留下你的观点，审核通过后会显示在这里。</div>
            ) : (
                <div className="comment-list">
                    {comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} />
                    ))}
                </div>
            )}

            <div className="comment-form-shell">
                <div className="comment-form-head">
                    <div>
                        <h4>{replyTo ? '回复评论' : '发送评论'}</h4>
                        <p className="muted">所有评论默认进入审核队列，用来过滤广告和低质量内容。</p>
                    </div>
                    {submitted ? <span className="badge">已进入审核</span> : null}
                </div>

                {isAuthenticated ? (
                    <form onSubmit={handleSubmit} className="comment-form" data-testid="comment-form">
                        <div className="chip">
                            <span className="mono">CURRENT USER</span>
                            <strong>{user?.name || user?.email}</strong>
                        </div>

                        <label className="form-field">
                            <span className="form-label">评论内容</span>
                            <textarea
                                className="form-textarea"
                                data-testid="comment-content-input"
                                value={content}
                                onChange={(event) => setContent(event.target.value)}
                                placeholder={replyTo ? '写下你的回复...' : '写下你的观点、补充或不同意见...'}
                                required
                            />
                        </label>

                        <div className="comment-form-actions">
                            <button type="submit" className="btn btn-primary" data-testid="comment-submit-button" disabled={submitting}>
                                {submitting ? '提交中' : '提交评论'}
                            </button>
                            {replyTo ? (
                                <button type="button" className="btn btn-ghost" onClick={() => setReplyTo(null)}>
                                    取消回复
                                </button>
                            ) : null}
                        </div>
                    </form>
                ) : (
                    <div className="empty-state">
                        <p>评论功能已升级为登录后优先。</p>
                        <Link to="/login" className="btn btn-primary">登录后参与讨论</Link>
                    </div>
                )}
            </div>
        </section>
    );
}
