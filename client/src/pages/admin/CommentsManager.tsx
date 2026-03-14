import { useEffect, useState } from 'react';
import { fetchAdminComments, updateCommentStatus, type Comment } from '../../api/client';
import SEO from '../../components/SEO';
import SiteIcon from '../../components/SiteIcon';
import { useToast } from '../../hooks/useToast';
import { formatDateTime } from '../../lib/format';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function CommentsManagerPage() {
    const { showToast } = useToast();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
    const [processingId, setProcessingId] = useState<number | null>(null);

    const loadComments = async (nextStatus = statusFilter) => {
        const response = await fetchAdminComments(nextStatus === 'all' ? undefined : nextStatus);
        setComments(response);
    };

    useEffect(() => {
        loadComments()
            .catch(() => showToast('评论列表读取失败。', 'error'))
            .finally(() => setLoading(false));
    }, [showToast]);

    useEffect(() => {
        if (loading) {
            return;
        }

        loadComments(statusFilter).catch(() => showToast('评论筛选失败。', 'error'));
    }, [loading, showToast, statusFilter]);

    const handleAction = async (id: number, status: 'approved' | 'rejected' | 'pending') => {
        setProcessingId(id);
        try {
            await updateCommentStatus(id, status);
            await loadComments(statusFilter);
            showToast(`评论状态已更新为 ${status}。`, 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '评论状态更新失败。', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <>
            <SEO title="评论管理" description="集中处理评论审核与状态流转。" />

            <section className="section">
                <div className="container admin-shell">
                    <header className="feature-panel">
                        <div className="section-heading">
                            <div>
                                <div className="eyebrow">Comments</div>
                                <h1 className="section-title">评论管理</h1>
                                <p className="section-copy">评论审核从 Dashboard 独立出来，避免总控台变成待办清单。</p>
                            </div>
                            <button type="button" className="btn btn-secondary" onClick={() => void loadComments(statusFilter)}>
                                <SiteIcon name="spark" size={14} />
                                <span>刷新</span>
                            </button>
                        </div>

                        <div className="tag-list">
                            <button type="button" className={`filter-chip ${statusFilter === 'pending' ? 'is-active' : ''}`} onClick={() => setStatusFilter('pending')}>待审核</button>
                            <button type="button" className={`filter-chip ${statusFilter === 'approved' ? 'is-active' : ''}`} onClick={() => setStatusFilter('approved')}>已通过</button>
                            <button type="button" className={`filter-chip ${statusFilter === 'rejected' ? 'is-active' : ''}`} onClick={() => setStatusFilter('rejected')}>已拒绝</button>
                            <button type="button" className={`filter-chip ${statusFilter === 'all' ? 'is-active' : ''}`} onClick={() => setStatusFilter('all')}>全部</button>
                        </div>
                    </header>

                    <section className="feature-panel">
                        <div className="editor-card-head">
                            <strong>评论队列</strong>
                            <span className="command-hint">{loading ? '加载中...' : `${comments.length} 条`}</span>
                        </div>

                        {loading ? (
                            <div className="empty-state">正在读取评论队列...</div>
                        ) : comments.length ? (
                            <div className="admin-list">
                                {comments.map((comment) => (
                                    <article key={comment.id} className="admin-row">
                                        <div className="admin-row-copy">
                                            <strong>{comment.author}</strong>
                                            <div className="admin-row-meta">
                                                <span className="chip">{comment.status}</span>
                                                {comment.post ? <span className="chip">{comment.post.title}</span> : null}
                                                <span className="chip">{formatDateTime(comment.createdAt)}</span>
                                            </div>
                                            <p className="muted">{comment.content}</p>
                                            {comment.parent ? <div className="command-hint">回复给：{comment.parent.author}</div> : null}
                                        </div>
                                        <div className="admin-row-actions">
                                            <button type="button" className="btn btn-primary" disabled={processingId === comment.id} onClick={() => void handleAction(comment.id, 'approved')}>通过</button>
                                            <button type="button" className="btn btn-secondary" disabled={processingId === comment.id} onClick={() => void handleAction(comment.id, 'pending')}>设为待审核</button>
                                            <button type="button" className="btn btn-ghost" disabled={processingId === comment.id} onClick={() => void handleAction(comment.id, 'rejected')}>拒绝</button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">当前筛选条件下没有评论。</div>
                        )}
                    </section>
                </div>
            </section>
        </>
    );
}
