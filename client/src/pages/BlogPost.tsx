import { Children, type ReactNode, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { fetchPost, likePost, type Comment, type Post } from '../api/client';
import ReadingProgress from '../components/ReadingProgress';
import Comments from '../components/Comments';
import SEO from '../components/SEO';
import LazyImage from '../components/LazyImage';
import { createHeadingIdResolver } from '../lib/content';
import { formatDate } from '../lib/format';
import { siteConfig } from '../config/site';
import 'highlight.js/styles/atom-one-dark.css';

function getNodeText(children: ReactNode) {
    return Children.toArray(children)
        .map((child) => (typeof child === 'string' || typeof child === 'number' ? String(child) : ''))
        .join('')
        .trim();
}

function stripLeadingMarkdownTitle(content: string, title: string) {
    const lines = content.split('\n');
    const firstMeaningfulIndex = lines.findIndex((line) => line.trim());

    if (firstMeaningfulIndex < 0) {
        return content;
    }

    const firstMeaningfulLine = lines[firstMeaningfulIndex].trim();
    const normalizedTitle = title.trim();

    if (firstMeaningfulLine === `# ${normalizedTitle}` || firstMeaningfulLine === `#${normalizedTitle}`) {
        return lines.filter((_, index) => index !== firstMeaningfulIndex).join('\n').trim();
    }

    return content;
}

export default function BlogPost() {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [liking, setLiking] = useState(false);
    const [queueCount, setQueueCount] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem('auth_user');
        if (!raw) return;

        try {
            const user = JSON.parse(raw) as { role?: string };
            setIsAdmin(user.role === 'admin');
        } catch {
            setIsAdmin(false);
        }
    }, []);

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

    const articleContent = stripLeadingMarkdownTitle(post.content, post.title);
    const resolveHeadingId = createHeadingIdResolver();

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

            <section className="section article-hero-section">
                <div className="container article-hero-shell article-hero-shell-v2">
                    <div className="article-hero-copy">
                        <Link to="/blog" className="command-hint article-back-link">
                            返回文章归档
                        </Link>
                        <div className="eyebrow">长文阅读</div>
                        <h1 className="article-title">{post.title}</h1>
                        <p className="lead article-hero-lead">{post.excerpt}</p>

                        <div className="article-meta" data-testid="article-meta">
                            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                            <span>{post.meta?.readTime || 1} 分钟阅读</span>
                            <span>{post.meta?.views || 0} 次浏览</span>
                            <span>最后更新于 {formatDate(post.updatedAt)}</span>
                        </div>

                        <div className="tag-list article-tag-list">
                            {post.category ? <span className="chip">{post.category.name}</span> : null}
                            {post.tags.map((tag) => (
                                <span key={tag.id} className="tag">{tag.name}</span>
                            ))}
                        </div>
                    </div>

                    <div className="article-hero-side">
                        <div className="article-hero-cover article-hero-cover-v2">
                            <LazyImage src={post.coverImage} alt={post.title} fallbackLabel={post.title} fallbackKicker="ARTICLE" />
                        </div>

                        <div className="article-context-grid">
                            <div className="article-side-card article-context-card">
                                <span className="signal-label mono">文章状态</span>
                                <strong>{isAdmin && !post.published ? '草稿预览中' : '已发布，并持续维护'}</strong>
                                <p className="muted">这篇文章会继续修订，而不是发布即结束。</p>
                            </div>
                            <div className="article-side-card article-context-card">
                                <span className="signal-label mono">阅读模式</span>
                                <strong>长文 / 结构化 / 可引用</strong>
                                <p className="muted">正文承担阅读，装饰只做氛围，不干扰信息密度。</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section article-body-section">
                <div className="container article-layout article-layout-v2">
                    <article className="article-main">
                        <div className="markdown-body article-prose-shell" data-testid="article-content">
                            <Markdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight]}
                                components={{
                                    h1: () => null,
                                    h2: ({ children }) => {
                                        const text = getNodeText(children);
                                        const id = resolveHeadingId(text);

                                        return (
                                            <h2 id={id}>
                                                <a href={`#${id}`}>{children}</a>
                                            </h2>
                                        );
                                    },
                                    h3: ({ children }) => {
                                        const text = getNodeText(children);
                                        const id = resolveHeadingId(text);

                                        return (
                                            <h3 id={id}>
                                                <a href={`#${id}`}>{children}</a>
                                            </h3>
                                        );
                                    },
                                    h4: ({ children }) => {
                                        const text = getNodeText(children);
                                        const id = resolveHeadingId(text);

                                        return (
                                            <h4 id={id}>
                                                <a href={`#${id}`}>{children}</a>
                                            </h4>
                                        );
                                    },
                                    img: ({ src, alt }) => (
                                        <figure className="article-cover">
                                            <LazyImage src={typeof src === 'string' ? src : ''} alt={alt || post.title} fallbackLabel={alt || post.title} fallbackKicker="MEDIA" />
                                            {alt ? <figcaption>{alt}</figcaption> : null}
                                        </figure>
                                    ),
                                }}
                            >
                                {articleContent}
                            </Markdown>
                        </div>

                        <div className="article-actions-shell">
                            <div>
                                <strong>这篇文章对你有帮助吗？</strong>
                                <p className="muted">点赞会帮助我判断哪些主题值得继续深挖。</p>
                            </div>
                            <div className="article-actions">
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

                        {queueCount > 0 ? (
                            <div className="article-queue-note">
                                <span className="badge badge-green" data-testid="pending-comment-badge">
                                    已新增 {queueCount} 条待审核评论
                                </span>
                            </div>
                        ) : null}

                        <Comments postId={post.id} comments={comments} onCommentAdded={handleCommentAdded} />

                        {post.relatedPosts?.length ? (
                            <section className="section-tight">
                                <div className="section-heading section-heading-left">
                                    <div>
                                        <div className="eyebrow">相关文章</div>
                                        <h3>继续阅读</h3>
                                    </div>
                                </div>
                                <div className="two-grid">
                                    {post.relatedPosts.map((item) => (
                                        <Link key={item.id} to={`/blog/${item.slug}`} className="signal-card">
                                            <span className="signal-label mono">相关文章</span>
                                            <h3>{item.title}</h3>
                                            <p>{item.excerpt}</p>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        ) : null}
                    </article>

                    <aside className="article-sidebar">
                        {post.toc?.length ? (
                            <div className="article-side-card article-toc-card">
                                <strong className="mono">目录</strong>
                                <div className="toc-list" data-testid="post-toc">
                                    {post.toc.map((item) => (
                                        <a key={item.id} href={`#${item.id}`} style={{ paddingLeft: `${(item.level - 2) * 12}px` }}>
                                            {item.text}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div className="article-side-card">
                            <strong className="mono">邻近阅读</strong>
                            {post.previousPost ? (
                                <Link to={`/blog/${post.previousPost.slug}`} className="muted">
                                    上一篇: {post.previousPost.title}
                                </Link>
                            ) : null}
                            {post.nextPost ? (
                                <Link to={`/blog/${post.nextPost.slug}`} className="muted">
                                    下一篇: {post.nextPost.title}
                                </Link>
                            ) : null}
                        </div>
                    </aside>
                </div>
            </section>
        </>
    );
}
