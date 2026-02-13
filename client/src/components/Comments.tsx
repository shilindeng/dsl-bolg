import { useState } from 'react';
import { type Comment, createComment } from '../api/client';
import { useToast } from '../hooks/useToast';

interface CommentsProps {
    postId: number;
    comments: Comment[];
    onCommentAdded: (comment: Comment) => void;
}

export default function Comments({ postId, comments, onCommentAdded }: CommentsProps) {
    const [author, setAuthor] = useState('');
    const [email, setEmail] = useState('');
    const [content, setContent] = useState('');
    const [replyTo, setReplyTo] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!author || !content) {
            showToast('请填写昵称和内容', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const { comment } = await createComment({
                postId,
                author,
                email,
                content,
                parentId: replyTo || undefined
            });
            onCommentAdded(comment);
            setContent('');
            setReplyTo(null);
            showToast('评论提交成功', 'success');
        } catch (error) {
            showToast('评论提交失败', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
        <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: isReply ? 'rgba(255,255,255,0.03)' : 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            borderLeft: isReply ? '2px solid var(--accent-cyan)' : 'none',
            marginLeft: isReply ? '2rem' : '0'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{comment.author}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(comment.createdAt).toLocaleString()}
                </span>
            </div>
            <p style={{ margin: '0.5rem 0', lineHeight: '1.6' }}>{comment.content}</p>

            {!isReply && (
                <button
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    {replyTo === comment.id ? '取消回复' : '回复'}
                </button>
            )}

            {/* Reply Form */}
            {replyTo === comment.id && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-dim)' }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '0.5rem' }}>回复 @{comment.author}:</div>
                        {/* We reuse the main form state but logic could be separated for cleaner UI */}
                        {/* For simplicity in this v1, assume user scrolls up or we duplicate inputs? 
                            Let's just keep inputs global for now or move form to bottom. 
                            Actually, better to have a simple reply text area here if auth info is saved?
                            Let's keep it simple: clicking Reply just sets the ID, user types in main box?
                            No, usually inplace. Let's redirect user to main form for now or show alert.
                        */}
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            请在下方评论框输入回复内容...
                        </div>
                    </form>
                </div>
            )}

            {/* Nested Replies */}
            {comment.replies && comment.replies.map(reply => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
            ))}
        </div>
    );

    return (
        <div style={{ marginTop: 'var(--space-3xl)', borderTop: '1px solid var(--border-dim)', paddingTop: 'var(--space-xl)' }}>
            <h3 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: 'var(--space-lg)' }}>
                💬 评论 ({comments.length})
            </h3>

            {/* Comment List */}
            <div style={{ marginBottom: 'var(--space-2xl)' }}>
                {comments.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        暂无评论，来坐沙发？
                    </div>
                ) : (
                    comments.map(c => <CommentItem key={c.id} comment={c} />)
                )}
            </div>

            {/* Comment Form */}
            <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)' }}>
                <h4 style={{ marginBottom: '1rem' }}>
                    {replyTo ? '回复评论' : '发表评论'}
                    {replyTo && <button onClick={() => setReplyTo(null)} style={{ marginLeft: '10px', fontSize: '0.8rem', color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>(取消)</button>}
                </h4>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            placeholder="昵称 (必填)"
                            value={author}
                            onChange={e => setAuthor(e.target.value)}
                            style={inputStyle}
                            required
                        />
                        <input
                            type="email"
                            placeholder="邮箱 (选填，用于头像)"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <textarea
                        placeholder="说点什么吧..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        style={{ ...inputStyle, minHeight: '100px', marginBottom: '1rem' }}
                        required
                    />
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting}
                        style={{ width: '100%' }}
                    >
                        {submitting ? '提交中...' : '🚀 发送评论'}
                    </button>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        注意：评论需要审核后才会显示
                    </p>
                </form>
            </div>
        </div>
    );
}

const inputStyle = {
    width: '100%',
    padding: '0.8rem',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--border-dim)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'var(--font-mono)'
};
