import { useEffect, useState } from 'react';
import {
    createNewsletterIssue,
    fetchAdminNewsletterIssues,
    fetchNewsletterSubscribers,
    sendNewsletterIssue,
    updateNewsletterIssue,
    type NewsletterIssue,
    type NewsletterSubscriber,
} from '../../api/client';
import SEO from '../../components/SEO';
import { useToast } from '../../hooks/useToast';
import { formatDateTime } from '../../lib/format';

const emptyForm = {
    title: '',
    slug: '',
    subject: '',
    previewText: '',
    bodyMarkdown: '',
    status: 'draft',
};

export default function NewsletterManagerPage() {
    const { showToast } = useToast();
    const [issues, setIssues] = useState<NewsletterIssue[]>([]);
    const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [sendingId, setSendingId] = useState<number | null>(null);

    const reload = async () => {
        const [nextIssues, nextSubscribers] = await Promise.all([
            fetchAdminNewsletterIssues(),
            fetchNewsletterSubscribers(),
        ]);
        setIssues(nextIssues);
        setSubscribers(nextSubscribers);
    };

    useEffect(() => {
        reload().catch(() => {
            showToast('Newsletter 数据加载失败。', 'error');
        });
    }, [showToast]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await updateNewsletterIssue(editingId, form);
            } else {
                await createNewsletterIssue(form);
            }
            setEditingId(null);
            setForm(emptyForm);
            await reload();
            showToast('Newsletter issue 已保存。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Newsletter issue 保存失败。', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSend = async (id: number) => {
        setSendingId(id);
        try {
            await sendNewsletterIssue(id);
            await reload();
            showToast('Newsletter issue 已进入发送流程。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Newsletter 发送失败。', 'error');
        } finally {
            setSendingId(null);
        }
    };

    return (
        <>
            <SEO title="Newsletter 管理" description="管理订阅者、issue 与发送记录。" />
            <section className="section">
                <div className="container admin-shell">
                    <header className="feature-panel">
                        <div className="section-heading">
                            <div>
                                <div className="eyebrow">Newsletter Workspace</div>
                                <h1 className="section-title">订阅者与 issue 管理</h1>
                            </div>
                        </div>
                        <div className="hero-metrics">
                            <div className="metric-card"><span className="muted mono">SUBSCRIBERS</span><strong>{subscribers.length}</strong></div>
                            <div className="metric-card"><span className="muted mono">ISSUES</span><strong>{issues.length}</strong></div>
                        </div>
                    </header>

                    <div className="dashboard-grid admin-manager-grid">
                        <form className="feature-panel comment-form" onSubmit={handleSubmit}>
                            <div className="section-heading">
                                <div>
                                    <div className="eyebrow">Issue Editor</div>
                                    <h2 className="section-title">{editingId ? '编辑 issue' : '新建 issue'}</h2>
                                </div>
                            </div>
                            <label className="form-field"><span className="form-label">标题</span><input className="form-input" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required /></label>
                            <label className="form-field"><span className="form-label">自定义 slug</span><input className="form-input mono" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} /></label>
                            <label className="form-field"><span className="form-label">邮件主题</span><input className="form-input" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} required /></label>
                            <label className="form-field"><span className="form-label">预览文案</span><textarea className="form-textarea" value={form.previewText} onChange={(event) => setForm((current) => ({ ...current, previewText: event.target.value }))} /></label>
                            <label className="form-field"><span className="form-label">Markdown 正文</span><textarea className="form-textarea editor-content-area mono" value={form.bodyMarkdown} onChange={(event) => setForm((current) => ({ ...current, bodyMarkdown: event.target.value }))} required /></label>
                            <label className="form-field">
                                <span className="form-label">状态</span>
                                <select className="form-select" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                                    <option value="draft">draft</option>
                                    <option value="published">published</option>
                                </select>
                            </label>
                            <div className="hero-actions">
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '保存中...' : editingId ? '更新 issue' : '创建 issue'}</button>
                                <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setForm(emptyForm); }}>重置</button>
                            </div>
                        </form>

                        <div className="section-stack">
                            <div className="feature-panel">
                                <div className="section-heading">
                                    <div>
                                        <div className="eyebrow">Subscribers</div>
                                        <h2 className="section-title">订阅者</h2>
                                    </div>
                                </div>
                                <div className="account-list">
                                    {subscribers.length ? subscribers.map((subscriber) => (
                                        <article key={subscriber.id} className="archive-row">
                                            <div>
                                                <h3>{subscriber.email}</h3>
                                                <p>{subscriber.status} / {subscriber.source}</p>
                                            </div>
                                            <span className="command-hint">{subscriber.confirmedAt ? formatDateTime(subscriber.confirmedAt) : '待确认'}</span>
                                        </article>
                                    )) : <div className="empty-state">还没有订阅者。</div>}
                                </div>
                            </div>

                            <div className="feature-panel">
                                <div className="section-heading">
                                    <div>
                                        <div className="eyebrow">Issue List</div>
                                        <h2 className="section-title">发送历史</h2>
                                    </div>
                                </div>
                                <div className="account-list">
                                    {issues.length ? issues.map((issue) => (
                                        <article key={issue.id} className="archive-row">
                                            <div>
                                                <h3>{issue.title}</h3>
                                                <p>{issue.subject}</p>
                                                <span className="muted">{formatDateTime(issue.updatedAt)}</span>
                                            </div>
                                            <div className="account-list-meta">
                                                <span className="chip">{issue.status}</span>
                                                <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(issue.id); setForm({ title: issue.title, slug: issue.slug, subject: issue.subject, previewText: issue.previewText, bodyMarkdown: issue.bodyMarkdown, status: issue.status }); }}>编辑</button>
                                                <button type="button" className="btn btn-primary" onClick={() => void handleSend(issue.id)} disabled={sendingId === issue.id}>{sendingId === issue.id ? '发送中...' : '发送'}</button>
                                            </div>
                                        </article>
                                    )) : <div className="empty-state">还没有 newsletter issue。</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
