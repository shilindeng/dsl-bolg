import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchNewsletterIssue, type NewsletterIssue } from '../api/client';
import SEO from '../components/SEO';
import SiteIcon from '../components/SiteIcon';
import { formatDate } from '../lib/format';

export default function NewsletterIssuePage() {
    const { slug } = useParams<{ slug: string }>();
    const [issue, setIssue] = useState<NewsletterIssue | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        fetchNewsletterIssue(slug)
            .then(setIssue)
            .catch(() => setIssue(null))
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) {
        return (
            <section className="section">
                <div className="container">
                    <div className="empty-state">正在加载 issue...</div>
                </div>
            </section>
        );
    }

    if (!issue) {
        return (
            <section className="section">
                <div className="container">
                    <div className="empty-state">没有找到对应的 newsletter issue。</div>
                </div>
            </section>
        );
    }

    return (
        <>
            <SEO title={issue.title} description={issue.previewText} />

            <section className="section page-compact-hero">
                <div className="container page-compact-grid">
                    <div>
                        <Link to="/newsletter" className="section-link back-link">
                            <SiteIcon name="chevron-right" size={14} style={{ transform: 'rotate(180deg)' }} />
                            <span>返回 Newsletter</span>
                        </Link>
                        <span className="eyebrow">Newsletter Issue</span>
                        <h1 className="section-title">{issue.title}</h1>
                        <p className="section-copy">{issue.previewText}</p>
                    </div>

                    <div className="stat-grid">
                        <div className="stat-card">
                            <SiteIcon name="calendar" size={16} />
                            <strong>{formatDate(issue.sentAt || issue.createdAt)}</strong>
                            <span>发送日期</span>
                        </div>
                        <div className="stat-card">
                            <SiteIcon name="inbox" size={16} />
                            <strong>{issue.status}</strong>
                            <span>当前状态</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section section-tight">
                <div className="container article-layout article-layout-single">
                    <article className="article-main">
                        <div className="article-prose-shell">
                            <div className="markdown-body article-prose">
                                <Markdown remarkPlugins={[remarkGfm]}>{issue.bodyMarkdown}</Markdown>
                            </div>
                        </div>
                    </article>
                </div>
            </section>
        </>
    );
}
