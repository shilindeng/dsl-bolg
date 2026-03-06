import { useState } from 'react';
import { createComment, type Comment } from '../api/client';
import { formatDateTime, getInitials } from '../lib/format';
import { useToast } from '../hooks/useToast';
import TurnstileWidget from './TurnstileWidget';

interface CommentsProps {
    postId: number;
    comments: Comment[];
    onCommentAdded: (comment: Comment) => void;
}

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

export default function Comments({ postId, comments, onCommentAdded }: CommentsProps) {
    const { showToast } = useToast();
    const [author, setAuthor] = useState('');
    const [email, setEmail] = useState('');
    const [content, setContent] = useState('');
    const [replyTo, setReplyTo] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!author.trim() || !content.trim()) {
            showToast('请填写昵称和评论内容。', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const response = await createComment({
                postId,
                author: author.trim(),
                email: email.trim() || undefined,
                content: content.trim(),
                parentId: replyTo || undefined,
                turnstileToken: turnstileToken || undefined,
            });

            onCommentAdded(response.comment);
            setSubmitted(true);
            setContent('');
            setReplyTo(null);
            setTurnstileToken('');
            showToast('评论已提交，审核通过后会公开显示。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '评论提交失败。', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
        <article
            className={`comment-card ${isReply ? 'comment-card-reply' : ''}`}
            data-testid={`comment-item-${comment.id}`}
        >
            <div className="comment-card-head">
                <div className="comment-author">
                    <div className="comment-avatar" aria-hidden="true">
                        {getInitials(comment.author)}
                    </div>
                    <div>
                        <strong>{comment.author}</strong>
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
                    <div className="eyebrow">Comment Protocol</div>
                    <h3>公开评论</h3>
                </div>
                <span className="command-hint" data-testid="public-comments-count">{comments.length} 条已公开</span>
            </div>

            {comments.length === 0 ? (
                <div className="empty-state">还没有公开评论。欢迎留下你的观点，审核通过后会出现在这里。</div>
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
                        <p className="muted">
                            所有评论默认进入审核队列，用来过滤广告与低质量内容。
                        </p>
                    </div>
                    {submitted ? <span className="badge badge-green">已进入审核</span> : null}
                </div>

                <form onSubmit={handleSubmit} className="comment-form" data-testid="comment-form">
                    <div className="two-grid">
                        <label className="form-field">
                            <span className="form-label">昵称</span>
                            <input
                                className="form-input"
                                data-testid="comment-author-input"
                                value={author}
                                onChange={(event) => setAuthor(event.target.value)}
                                placeholder="你的名字"
                                required
                            />
                        </label>
                        <label className="form-field">
                            <span className="form-label">邮箱</span>
                            <input
                                className="form-input"
                                data-testid="comment-email-input"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="可选，用于联系"
                            />
                        </label>
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

                    <TurnstileWidget siteKey={turnstileSiteKey} onToken={setTurnstileToken} />

                    <div className="comment-form-actions">
                        <button type="submit" className="btn btn-primary" data-testid="comment-submit-button" disabled={submitting}>
                            {submitting ? '提交中...' : '提交评论'}
                        </button>
                        {replyTo ? (
                            <button type="button" className="btn btn-ghost" onClick={() => setReplyTo(null)}>
                                取消回复
                            </button>
                        ) : null}
                    </div>
                </form>
            </div>
        </section>
    );
}
