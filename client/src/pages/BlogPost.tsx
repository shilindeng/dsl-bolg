import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchPost, type Post } from '../api/client';

export default function BlogPost() {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        fetchPost(slug)
            .then(setPost)
            .catch(() => setError('文章未找到'))
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) return (
        <div className="container" style={{ paddingTop: 'var(--space-3xl)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem' }} className="animate-float">⏳</div>
            <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-md)' }}>加载中...</p>
        </div>
    );

    if (error || !post) return (
        <div className="container" style={{ paddingTop: 'var(--space-3xl)', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>😔</div>
            <h2 style={{ marginBottom: 'var(--space-md)' }}>{error || '文章未找到'}</h2>
            <Link to="/blog" className="btn btn-primary">← 返回博客</Link>
        </div>
    );

    const date = new Date(post.createdAt).toLocaleDateString('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const readingTime = Math.max(1, Math.ceil(post.content.length / 500));

    return (
        <div className="container" style={{ paddingTop: 'var(--space-3xl)', paddingBottom: 'var(--space-3xl)' }}>
            {/* 返回按钮 */}
            <Link to="/blog" className="animate-fade-in" style={{
                opacity: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                color: 'var(--text-muted)',
                marginBottom: 'var(--space-2xl)',
                fontSize: '0.9rem',
            }}>
                ← 返回博客
            </Link>

            {/* 文章头部 */}
            <header className="animate-fade-in-up" style={{ opacity: 0, marginBottom: 'var(--space-2xl)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
                    {post.tags.map(tag => (
                        <span key={tag.id} className="tag">{tag.name}</span>
                    ))}
                </div>
                <h1 style={{
                    fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                    fontWeight: 800,
                    lineHeight: 1.3,
                    letterSpacing: '-0.02em',
                    marginBottom: 'var(--space-md)',
                }}>{post.title}</h1>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-lg)',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                }}>
                    <span>📅 {date}</span>
                    <span>⏱️ 约 {readingTime} 分钟阅读</span>
                </div>
            </header>

            {/* 文章内容 */}
            <article className="glass-card animate-fade-in-up delay-1" style={{
                opacity: 0,
                padding: 'var(--space-2xl)',
                maxWidth: '800px',
            }}>
                <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                </div>
            </article>

            {/* 底部导航 */}
            <div className="animate-fade-in-up delay-2" style={{
                opacity: 0,
                marginTop: 'var(--space-2xl)',
                padding: 'var(--space-xl)',
                borderTop: '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <Link to="/blog" className="btn btn-ghost">← 返回博客列表</Link>
            </div>
        </div>
    );
}
