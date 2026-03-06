import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { fetchPost, likePost, type Comment, type Post } from '../api/client';
import ReadingProgress from '../components/ReadingProgress';
import Comments from '../components/Comments';
import SEO from '../components/SEO';
import LazyImage from '../components/LazyImage';
import { buildHeadingId } from '../lib/content';
import { formatDate } from '../lib/format';
import { siteConfig } from '../config/site';
import 'highlight.js/styles/atom-one-dark.css';

export default function BlogPost() {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [liking, setLiking] = useState(false);
    const [queueCount, setQueueCount] = useState(0);

    useEffect(() => {
        if (!slug) return;
        let cancelled = false;
        setLoading(true);

        fetchPost(slug)
            .then((data) => {
                if (cancelled) return;
                setPost(data);
                setComments(data.comments || []);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [slug]);

    const handleLike = async () => {
        if (!post || liking) return;
        setLiking(true);
        try {
            const result = await likePost(post.slug);
            setPost((current) =>
                current
                    ? {
                        ...current,
                        meta: {
                            views: current.meta?.views || 0,
                            readTime: current.meta?.readTime || 1,
                            likes: result.likes,
                        },
                    }
                    : current,
            );
        } finally {
            setLiking(false);
        }
    };

    const handleCommentAdded = () => {
        setQueueCount((value) => value + 1);
    };

    if (loading) {
        return (
            <section className="section">
                <div className="container">
                    <div className="empty-state">正在加载文章...</div>
                </div>
            </section>
        );
    }

    if (!post) {
        return (
            <section className="section">
                <div className="container">
                    <div className="empty-state">
                        <h1 className="section-title">文章不存在</h1>
                        <Link to="/blog" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                            返回博客
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    const articleUrl = `${siteConfig.url}/blog/${post.slug}`;
    const articleJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.publishedAt || post.createdAt,
        dateModified: post.updatedAt,
        author: { '@type': 'Person', name: siteConfig.author.name },
        image: post.coverImage ? `${siteConfig.url}${post.coverImage}` : `${siteConfig.url}${siteConfig.defaultOgImage}`,
        url: articleUrl,
    };

    return (
        <>
            <SEO
                title={post.title}
                description={post.excerpt}
                image={post.coverImage ?? undefined}
                type="article"
                url={articleUrl}
                publishedTime={post.publishedAt || post.createdAt}
                modifiedTime={post.updatedAt}
                jsonLd={articleJsonLd}
            />

            <ReadingProgress />

            <section className="section">
                <div className="container article-layout">
                    <article className="article-main">
                        <div style={{ display: 'grid', gap: '1.2rem' }}>
                            <Link to="/blog" className="command-hint" style={{ width: 'fit-content' }}>
                                返回文章归档
                            </Link>

                            <div className="eyebrow">Article</div>
                            <h1 className="section-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}>{post.title}</h1>
                            <p className="lead">{post.excerpt}</p>

                            <div className="article-meta" data-testid="article-meta">
                                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                                <span>{post.meta?.readTime || 1} 分钟阅读</span>
                                <span>{post.meta?.views || 0} 次浏览</span>
                                <span>最后更新于 {formatDate(post.updatedAt)}</span>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                                {post.category ? <span className="chip">{post.category.name}</span> : null}
                                {post.tags.map((tag) => (
                                    <span key={tag.id} className="tag">{tag.name}</span>
                                ))}
                            </div>

                            {post.coverImage ? (
                                <div className="article-cover">
                                    <LazyImage src={post.coverImage} alt={post.title} />
                                </div>
                            ) : null}

                            <div className="markdown-body" data-testid="article-content">
                                <Markdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight]}
                                    components={{
                                        h2: ({ children }) => {
                                            const text = String(children);
                                            const id = buildHeadingId(text);
                                            return (
                                                <h2 id={id}>
                                                    <a href={`#${id}`}>{children}</a>
                                                </h2>
                                            );
                                        },
                                        h3: ({ children }) => {
                                            const text = String(children);
                                            const id = buildHeadingId(text);
                                            return (
                                                <h3 id={id}>
                                                    <a href={`#${id}`}>{children}</a>
                                                </h3>
                                            );
                                        },
                                        h4: ({ children }) => {
                                            const text = String(children);
                                            const id = buildHeadingId(text);
                                            return (
                                                <h4 id={id}>
                                                    <a href={`#${id}`}>{children}</a>
                                                </h4>
                                            );
                                        },
                                        img: ({ node, alt, ...props }) => (
                                            <figure>
                                                <div className="article-cover" style={{ margin: 0 }}>
                                                    <LazyImage {...props} src={props.src || ''} alt={alt} />
                                                </div>
                                                {alt ? <figcaption>{alt}</figcaption> : null}
                                            </figure>
                                        ),
                                    }}
                                >
                                    {post.content}
                                </Markdown>
                            </div>

                            <div className="panel">
                                <div className="panel-body" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                                        <strong>这篇文章对你有帮助吗？</strong>
                                        <span className="muted">点赞会帮助我判断哪些主题值得继续深入。</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <button type="button" className="btn btn-primary" data-testid="article-like-button" onClick={handleLike} disabled={liking}>
                                            {liking ? '处理中...' : `点赞 ${post.meta?.likes || 0}`}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            data-testid="article-copy-link-button"
                                            onClick={() => navigator.clipboard.writeText(articleUrl)}
                                        >
                                            复制链接
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {queueCount > 0 ? (
                                <div className="panel">
                                    <div className="panel-body">
                                        <span className="badge" data-testid="pending-comment-badge" style={{ color: 'var(--accent-emerald)' }}>
                                            已新增 {queueCount} 条待审核评论
                                        </span>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <Comments postId={post.id} comments={comments} onCommentAdded={handleCommentAdded} />

                        {post.relatedPosts?.length ? (
                            <section className="section-tight">
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div>
                                        <div className="eyebrow">Related Reading</div>
                                        <h3 style={{ marginTop: '1rem', fontSize: '1.8rem' }}>继续阅读</h3>
                                    </div>
                                    <div className="two-grid">
                                        {post.relatedPosts.map((item) => (
                                            <Link key={item.id} to={`/blog/${item.slug}`} className="panel">
                                                <div className="panel-body" style={{ display: 'grid', gap: '0.75rem' }}>
                                                    <strong>{item.title}</strong>
                                                    <span className="muted">{item.excerpt}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        ) : null}
                    </article>

                    <aside className="article-sidebar">
                        {post.toc?.length ? (
                            <div className="panel">
                                <div className="panel-body" style={{ display: 'grid', gap: '1rem' }}>
                                    <strong className="mono">目录</strong>
                                    <div className="toc-list" data-testid="post-toc">
                                        {post.toc.map((item) => (
                                            <a key={item.id} href={`#${item.id}`} style={{ paddingLeft: `${(item.level - 2) * 12}px` }}>
                                                {item.text}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <div className="panel">
                            <div className="panel-body" style={{ display: 'grid', gap: '1rem' }}>
                                <strong className="mono">导航</strong>
                                {post.previousPost ? (
                                    <Link to={`/blog/${post.previousPost.slug}`} className="muted">
                                        ← {post.previousPost.title}
                                    </Link>
                                ) : null}
                                {post.nextPost ? (
                                    <Link to={`/blog/${post.nextPost.slug}`} className="muted">
                                        → {post.nextPost.title}
                                    </Link>
                                ) : null}
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </>
    );
}
