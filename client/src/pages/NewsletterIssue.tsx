import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchNewsletterIssue, type NewsletterIssue } from '../api/client';
import SEO from '../components/SEO';
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
        return <section className="section"><div className="container"><div className="empty-state">正在加载 issue...</div></div></section>;
    }

    if (!issue) {
        return <section className="section"><div className="container"><div className="empty-state">没有找到对应的 newsletter issue。</div></div></section>;
    }

    return (
        <>
            <SEO title={issue.title} description={issue.previewText} />
            <section className="section article-shell">
                <div className="container article-page-layout">
                    <header className="article-header-card">
                        <div className="eyebrow">Newsletter Issue</div>
                        <h1 className="article-title">{issue.title}</h1>
                        <p className="lead">{issue.previewText}</p>
                        <div className="article-meta">
                            <span>{formatDate(issue.sentAt || issue.createdAt)}</span>
                            <span>{issue.status}</span>
                        </div>
                    </header>
                    <article className="markdown-body article-prose">
                        <Markdown remarkPlugins={[remarkGfm]}>{issue.bodyMarkdown}</Markdown>
                    </article>
                </div>
            </section>
        </>
    );
}
