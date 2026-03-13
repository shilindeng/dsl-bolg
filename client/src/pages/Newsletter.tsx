import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmNewsletter, fetchNewsletterIssues, unsubscribeNewsletter, type NewsletterIssue } from '../api/client';
import NewsletterSignup from '../components/NewsletterSignup';
import SEO from '../components/SEO';
import SiteIcon from '../components/SiteIcon';
import { useToast } from '../hooks/useToast';
import { formatShortDate } from '../lib/format';
import { siteConfig } from '../config/site';

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
                .then(() => showToast('你已退出 newsletter。', 'success'))
                .catch((error) => showToast(error instanceof Error ? error.message : '退订失败。', 'error'))
                .finally(() => setBusy(false));
        }
    }, [searchParams, showToast]);

    return (
        <>
            <SEO title="Newsletter" description={`订阅 ${siteConfig.name} 的长期写作与产品化更新。`} />

            <section className="section page-compact-hero">
                <div className="container split-feature">
                    <div>
                        <span className="eyebrow">Newsletter</span>
                        <h1 className="section-title">订阅长期写作与产品化更新</h1>
                        <p className="section-copy">
                            每期围绕长文、项目复盘、界面系统和 AI 工作流迭代，保持低频但高质量输出。
                        </p>

                        <div className="list-block compact-list">
                            <div className="list-item">
                                <SiteIcon name="book-open" size={15} />
                                <span>长文、复盘、方法论优先进入订阅。</span>
                            </div>
                            <div className="list-item">
                                <SiteIcon name="grid" size={15} />
                                <span>界面系统、项目迭代与上线记录一起发送。</span>
                            </div>
                            <div className="list-item">
                                <SiteIcon name="mail" size={15} />
                                <span>提交邮箱后会收到确认邮件，确认后才进入正式名单。</span>
                            </div>
                        </div>
                    </div>

                    <div className="feature-panel">
                        <span className="eyebrow">订阅入口</span>
                        <h2 className="section-title compact-title">首版订阅流</h2>
                        <p className="section-copy">这是一套更轻、更明确的订阅表单，只保留必要信息。</p>
                        <NewsletterSignup source="newsletter_page" />
                        {busy ? <span className="meta-pill">正在处理订阅操作...</span> : null}
                    </div>
                </div>
            </section>

            <section className="section section-border">
                <div className="container section-stack">
                    <div className="section-head">
                        <div>
                            <span className="eyebrow">公开归档</span>
                            <h2 className="section-title compact-title">已发送 issue</h2>
                        </div>
                    </div>

                    {issues.length ? (
                        <div className="stack-grid">
                            {issues.map((issue, index) => (
                                <Link key={issue.id} to={`/newsletter/${issue.slug}`} className={`archive-item ${index === 0 ? 'is-featured-issue' : ''}`}>
                                    <div>
                                        <div className="meta-inline">
                                            <span className="meta-pill">
                                                <SiteIcon name="calendar" size={13} />
                                                <span>{formatShortDate(issue.sentAt || issue.createdAt)}</span>
                                            </span>
                                            <span className="meta-pill">
                                                <SiteIcon name="inbox" size={13} />
                                                <span>{issue.status}</span>
                                            </span>
                                        </div>
                                        <strong>{issue.title}</strong>
                                        <p>{issue.previewText}</p>
                                    </div>
                                    <span className="section-link">
                                        <span>查看全文</span>
                                        <SiteIcon name="arrow-right" size={14} />
                                    </span>
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
