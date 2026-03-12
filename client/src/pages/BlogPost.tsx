import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { addBookmark, fetchPost, fetchSeriesDetail, likePost, removeBookmark, type Comment, type Post, type SeriesDetail } from '../api/client';
import Comments from '../components/Comments';
import LazyImage from '../components/LazyImage';
import NewsletterSignup from '../components/NewsletterSignup';
import ReadingProgress from '../components/ReadingProgress';
import SEO from '../components/SEO';
import SeriesRail from '../components/SeriesRail';
import SiteIcon from '../components/SiteIcon';
import { siteConfig } from '../config/site';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { buildHeadingId, looksLikeHtmlContent } from '../lib/content';
import { formatDate } from '../lib/format';
import 'highlight.js/styles/github.css';

function enhanceArticleHtml(content: string) {
    if (typeof window === 'undefined' || !looksLikeHtmlContent(content)) {
        return content;
    }

    const documentFragment = new window.DOMParser().parseFromString(content, 'text/html');
    const counts = new Map<string, number>();
    let fallbackIndex = 0;

    documentFragment.querySelectorAll('h2, h3, h4').forEach((heading) => {
        const text = heading.textContent?.trim() || '';
        const base = buildHeadingId(text) || `section-${++fallbackIndex}`;
        const currentCount = counts.get(base) || 0;
        const nextCount = currentCount + 1;
        counts.set(base, nextCount);
        heading.id = nextCount === 1 ? base : `${base}-${nextCount}`;
    });

    documentFragment.querySelectorAll('img').forEach((image) => {
        image.setAttribute('loading', 'lazy');
    });

    return documentFragment.body.innerHTML;
}

export default function BlogPost() {
    const { slug } = useParams<{ slug: string }>();
    const { isAdmin, isAuthenticated } = useAuth();
    const { showToast } = useToast();
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [liking, setLiking] = useState(false);
    const [bookmarking, setBookmarking] = useState(false);
    const [queueCount, setQueueCount] = useState(0);
    const [seriesDetail, setSeriesDetail] = useState<SeriesDetail | null>(null);
    const articleContent = post?.content || '';
    const isHtmlArticle = looksLikeHtmlContent(articleContent);
    const renderedHtml = useMemo(
        () => (isHtmlArticle ? enhanceArticleHtml(articleContent) : ''),
        [articleContent, isHtmlArticle],
    );

    useEffect(() => {
        if (!slug) return;
        let cancelled = false;
        setLoading(true);
        setSeriesDetail(null);

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

    useEffect(() => {
        const seriesSlug = post?.series?.slug;
        if (!seriesSlug) {
            setSeriesDetail(null);
            return;
        }

        let cancelled = false;
        fetchSeriesDetail(seriesSlug)
            .then((detail) => {
                if (cancelled) return;
                setSeriesDetail(detail);
            })
            .catch(() => {
                if (cancelled) return;
                setSeriesDetail(null);
            });

        return () => {
            cancelled = true;
        };
    }, [post?.series?.slug]);

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

    const handleBookmarkToggle = async () => {
        if (!post || bookmarking || !isAuthenticated) return;
        setBookmarking(true);
        try {
            if (post.viewerState?.bookmarked) {
                await removeBookmark(post.id);
            } else {
                await addBookmark(post.id);
            }
            setPost((current) => (current ? { ...current, viewerState: { bookmarked: !current.viewerState?.bookmarked } } : current));
        } finally {
            setBookmarking(false);
        }
    };

    const handleCopyLink = async () => {
        if (!post) return;

        try {
            await navigator.clipboard.writeText(`${siteConfig.url}/blog/${post.slug}`);
            showToast('文章链接已复制。', 'success');
        } catch {
            showToast('复制链接失败。', 'error');
        }
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
                        <Link to="/blog" className="btn btn-primary">
                            <SiteIcon name="arrow-right" size={14} style={{ transform: 'rotate(180deg)' }} />
                            <span>返回博客</span>
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

            <section className="section page-compact-hero article-hero">
                <div className="container article-header-grid">
                    <div className="article-header-copy">
                        <Link to="/blog" className="section-link back-link">
                            <SiteIcon name="chevron-right" size={14} style={{ transform: 'rotate(180deg)' }} />
                            <span>返回文章归档</span>
                        </Link>

                        <div className="meta-inline">
                            {post.category ? (
                                <span className="chip">
                                    <SiteIcon name="folder" size={13} />
                                    <span>{post.category.name}</span>
                                </span>
                            ) : null}
                            {post.series ? (
                                <Link to={`/series/${post.series.slug}`} className="chip">
                                    <SiteIcon name="link" size={13} />
                                    <span>{post.series.title}</span>
                                </Link>
                            ) : null}
                            {post.tags.slice(0, 3).map((tag) => (
                                <span key={tag.id} className="tag">
                                    <SiteIcon name="tag" size={12} />
                                    <span>{tag.name}</span>
                                </span>
                            ))}
                        </div>

                        <h1 className="section-title article-title">{post.title}</h1>
                        <p className="section-copy article-hero-lead">{post.deck || post.excerpt}</p>

                        <div className="article-meta" data-testid="article-meta">
                            <span className="meta-pill">
                                <SiteIcon name="calendar" size={13} />
                                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                            </span>
                            <span className="meta-pill">
                                <SiteIcon name="clock" size={13} />
                                <span>{post.meta?.readTime || 1} 分钟阅读</span>
                            </span>
                            <span className="meta-pill">
                                <SiteIcon name="spark" size={13} />
                                <span>最后更新于 {formatDate(post.updatedAt)}</span>
                            </span>
                        </div>

                        {isAdmin ? (
                            <div className="hero-actions">
                                <Link to={`/editor/${post.slug}`} className="btn btn-secondary">
                                    <SiteIcon name="pen" size={14} />
                                    <span>编辑文章</span>
                                </Link>
                            </div>
                        ) : null}
                    </div>

                    {post.coverImage ? (
                        <div className="article-cover-card editorial-cover-card">
                            <LazyImage src={post.coverImage} alt={post.coverAlt || post.title} />
                        </div>
                    ) : null}
                </div>
            </section>

            <section className="section section-tight">
                <div className="container article-layout">
                    <article className="article-main">
                        <div className="article-prose-shell">
                            <div className="markdown-body article-rich-body" data-testid="article-content">
                                {isHtmlArticle ? (
                                    <div className="article-html-body" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
                                ) : (
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
                                            img: ({ alt, ...props }) => (
                                                <figure>
                                                    <div className="article-inline-media">
                                                        <LazyImage {...props} src={props.src || ''} alt={alt} />
                                                    </div>
                                                    {alt ? <figcaption>{alt}</figcaption> : null}
                                                </figure>
                                            ),
                                        }}
                                    >
                                        {post.content}
                                    </Markdown>
                                )}
                            </div>
                        </div>

                        <div className="article-actions-shell">
                            <div>
                                <strong>这篇文章对你有帮助吗？</strong>
                                <p className="muted">点赞能帮助我判断哪些主题值得继续深挖。</p>
                            </div>
                            <div className="article-actions">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    data-testid="article-like-button"
                                    onClick={handleLike}
                                    disabled={liking}
                                >
                                    <SiteIcon name="spark" size={14} />
                                    <span>{liking ? '处理中' : `点赞 ${post.meta?.likes || 0}`}</span>
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    data-testid="article-copy-link-button"
                                    onClick={() => void handleCopyLink()}
                                >
                                    <SiteIcon name="copy" size={14} />
                                    <span>复制链接</span>
                                </button>
                                {isAuthenticated ? (
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        onClick={() => void handleBookmarkToggle()}
                                        disabled={bookmarking}
                                    >
                                        <SiteIcon name="inbox" size={14} />
                                        <span>{bookmarking ? '处理中' : post.viewerState?.bookmarked ? '取消收藏' : '收藏文章'}</span>
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        {queueCount > 0 ? (
                            <div className="article-queue-note">
                                <span className="badge">新增 {queueCount} 条待审核评论</span>
                            </div>
                        ) : null}

                        {seriesDetail ? <SeriesRail series={seriesDetail} currentSlug={post.slug} variant="inline" /> : null}

                        <Comments postId={post.id} comments={comments} onCommentAdded={handleCommentAdded} />

                        <div className="feature-panel newsletter-inline-panel">
                            <div className="section-head compact-head">
                                <div>
                                    <span className="eyebrow">Newsletter</span>
                                    <h3>喜欢这种长文？订阅后续更新</h3>
                                </div>
                            </div>
                            <p className="section-copy">新长文、项目复盘和工作流迭代会优先进入 newsletter。</p>
                            <NewsletterSignup source={`article:${post.slug}`} compact />
                        </div>

                        {post.relatedPosts?.length ? (
                            <section className="section-tight">
                                <div className="section-head compact-head">
                                    <div>
                                        <span className="eyebrow">继续阅读</span>
                                        <h3>相关文章</h3>
                                    </div>
                                </div>

                                <div className="stack-grid">
                                    {post.relatedPosts.map((item) => (
                                        <Link key={item.id} to={`/blog/${item.slug}`} className="related-card">
                                            <div>
                                                <span className="meta-pill">
                                                    <SiteIcon name="book-open" size={13} />
                                                    <span>相关文章</span>
                                                </span>
                                                <strong>{item.title}</strong>
                                                <p>{item.excerpt}</p>
                                            </div>
                                            <span className="section-link">
                                                <span>继续阅读</span>
                                                <SiteIcon name="arrow-right" size={14} />
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        ) : null}
                    </article>

                    <aside className="article-sidebar">
                        {seriesDetail ? <SeriesRail series={seriesDetail} currentSlug={post.slug} /> : null}
                        {post.toc?.length ? (
                            <div className="article-side-card">
                                <strong>目录</strong>
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
                            <strong>导航</strong>
                            <div className="stack-grid">
                                {post.previousPost ? (
                                    <Link to={`/blog/${post.previousPost.slug}`} className="side-link">
                                        <SiteIcon name="chevron-right" size={14} style={{ transform: 'rotate(180deg)' }} />
                                        <span>上一篇：{post.previousPost.title}</span>
                                    </Link>
                                ) : null}
                                {post.nextPost ? (
                                    <Link to={`/blog/${post.nextPost.slug}`} className="side-link">
                                        <span>下一篇：{post.nextPost.title}</span>
                                        <SiteIcon name="chevron-right" size={14} />
                                    </Link>
                                ) : null}
                                <button type="button" className="action-chip" onClick={() => void handleCopyLink()}>
                                    <SiteIcon name="copy" size={14} />
                                    <span>复制本页链接</span>
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </>
    );
}
