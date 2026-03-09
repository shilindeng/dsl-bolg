import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { confirmNewsletter, fetchNewsletterIssues, unsubscribeNewsletter, type NewsletterIssue } from '../api/client';
import NewsletterSignup from '../components/NewsletterSignup';
import SEO from '../components/SEO';
import { useToast } from '../hooks/useToast';
import { formatShortDate } from '../lib/format';

export default function Newsletter() {
    const { showToast } = useToast();
    const [issues, setIssues] = useState<NewsletterIssue[]>([]);
    const [busy, setBusy] = useState(false);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        fetchNewsletterIssues().then(setIssues).catch(() => setIssues([]));
    }, []);

    useEffect(() => {
        const email = searchParams.get('email');
        const token = searchParams.get('token');
        const unsubscribe = searchParams.get('unsubscribe');

        if (!email) return;

        if (token) {
            setBusy(true);
            confirmNewsletter({ email, token })
                .then(() => showToast('订阅已确认。', 'success'))
                .catch((error) => showToast(error instanceof Error ? error.message : '订阅确认失败。', 'error'))
                .finally(() => setBusy(false));
        } else if (unsubscribe === '1') {
            setBusy(true);
            unsubscribeNewsletter({ email })
                .then(() => showToast('你已退订 newsletter。', 'success'))
                .catch((error) => showToast(error instanceof Error ? error.message : '退订失败。', 'error'))
                .finally(() => setBusy(false));
        }
    }, [searchParams, showToast]);

    return (
        <>
            <SEO title="Newsletter" description="订阅 DSL Blog 的长期写作与产品化更新。" />

            <section className="section page-hero page-hero-editorial">
                <div className="container page-hero-layout">
                    <div className="page-copy">
                        <div className="eyebrow">Newsletter</div>
                        <h1 className="page-title">订阅长期写作与产品化更新</h1>
                        <p className="page-lead">
                            每期围绕长文、项目复盘、界面系统和 AI 工作流迭代，保持低频但高质量输出。
                        </p>
                    </div>
                    <div className="editorial-panel">
                        <strong>首版订阅流</strong>
                        <p className="muted">提交邮箱后会收到确认邮件，确认后才进入正式订阅名单。</p>
                        <NewsletterSignup source="newsletter_page" />
                        {busy ? <span className="command-hint">正在处理订阅操作...</span> : null}
                    </div>
                </div>
            </section>

            <section className="section section-tight">
                <div className="container section-stack">
                    <div className="section-heading">
                        <div>
                            <div className="eyebrow">Issue Archive</div>
                            <h2 className="section-title">公开归档</h2>
                        </div>
                    </div>
                    {issues.length ? (
                        <div className="archive-list">
                            {issues.map((issue) => (
                                <Link key={issue.id} to={`/newsletter/${issue.slug}`} className="archive-row">
                                    <div>
                                        <span className="signal-label">{formatShortDate(issue.sentAt || issue.createdAt)}</span>
                                        <h3>{issue.title}</h3>
                                        <p>{issue.previewText}</p>
                                    </div>
                                    <span className="command-hint">{issue.status}</span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">还没有公开 issue，首期发送后会显示在这里。</div>
                    )}
                </div>
            </section>
        </>
    );
}
