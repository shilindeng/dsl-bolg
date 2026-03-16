import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addBookmark, fetchPost, fetchSeriesDetail, likePost, removeBookmark, type Comment, type Post, type SeriesDetail } from '../api/client';
import ArticleContent from '../components/ArticleContent';
import Comments from '../components/Comments';
import LazyImage from '../components/LazyImage';
import NewsletterSignup from '../components/NewsletterSignup';
import PageScene from '../components/PageScene';
import PostCard from '../components/PostCard';
import ReadingProgress from '../components/ReadingProgress';
import RouteSkeleton from '../components/RouteSkeleton';
import SEO from '../components/SEO';
import SeriesRail from '../components/SeriesRail';
import SiteIcon from '../components/SiteIcon';
import Surface from '../components/Surface';
import { siteConfig } from '../config/site';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../lib/format';
import 'highlight.js/styles/github.css';

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
    const [activeHeading, setActiveHeading] = useState<string>('');

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

    useEffect(() => {
        const toc = post?.toc;
        if (!toc?.length) {
            setActiveHeading('');
            return;
        }

        const ids = toc.map((item) => item.id).filter(Boolean);
        const elements = ids
            .map((id) => document.getElementById(id))
            .filter((item): item is HTMLElement => Boolean(item));

        if (!elements.length) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                const next = visible[0]?.target as HTMLElement | undefined;
                if (next?.id) {
                    setActiveHeading(next.id);
                }
            },
            {
                root: null,
                threshold: [0, 0.1],
                rootMargin: '-18% 0px -72% 0px',
            },
        );

        elements.forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, [post?.slug, post?.toc]);

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
            <PageScene tone="editorial">
                <section className="section">
                    <RouteSkeleton variant="article" />
                </section>
            </PageScene>
        );
    }

    if (!post) {
        return (
            <PageScene tone="editorial">
                <section className="section">
                    <div className="container">
                        <Surface tone="glass" className="empty-state">
                            <h1 className="section-title">文章不存在</h1>
                            <Link to="/blog" className="btn btn-primary">
                                <SiteIcon name="arrow-right" size={14} style={{ transform: 'rotate(180deg)' }} />
                                <span>返回博客</span>
                            </Link>
                        </Surface>
                    </div>
                </section>
            </PageScene>
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

            <PageScene tone="editorial">
                <section className="section page-compact-hero article-hero">
                    <div className="container">
                        <Surface tone="hero" className="article-hero-stage">
                            <div className="article-header-grid">
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
                                        {post.series && post.seriesOrder ? (
                                            <span className="meta-pill">
                                                <SiteIcon name="link" size={13} />
                                                <span>专栏第 {post.seriesOrder} 篇</span>
                                            </span>
                                        ) : null}
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

                                <div className="article-hero-visual">
                                    {post.coverImage ? (
                                        <div className="article-cover-card editorial-cover-card">
                                            <LazyImage src={post.coverImage} alt={post.coverAlt || post.title} />
                                        </div>
                                    ) : (
                                        <Surface tone="floating" className="article-header-note">
                                            <span className="eyebrow">Reading Notes</span>
                                            <div className="list-block">
                                                <div className="list-item">
                                                    <SiteIcon name="book-open" size={14} />
                                                    <span>正文宽度和目录优先服务阅读，而不是堆砌界面效果。</span>
                                                </div>
                                                <div className="list-item">
                                                    <SiteIcon name="spark" size={14} />
                                                    <span>每篇长文都尽量回答一个问题，或给出一条可执行路径。</span>
                                                </div>
                                            </div>
                                        </Surface>
                                    )}
                                </div>
                            </div>
                        </Surface>
                    </div>
                </section>

                <section className="section section-tight">
                    <div className="container article-layout">
                        <article className="article-main">
                            <Surface tone="article" className="article-prose-shell">
                                <ArticleContent content={post.content} contentFormat={post.contentFormat} testId="article-content" />
                            </Surface>

                            <Surface tone="glass" className="article-actions-shell">
                                <div>
                                    <strong>这篇文章对你有帮助吗？</strong>
                                    <p className="muted">你的反馈会直接影响后续继续深挖的主题。</p>
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
                                            <SiteIcon name={post.viewerState?.bookmarked ? 'lucide:bookmark-check' : 'lucide:bookmark'} size={14} />
                                            <span>{bookmarking ? '处理中' : post.viewerState?.bookmarked ? '取消收藏' : '收藏文章'}</span>
                                        </button>
                                    ) : (
                                        <Link to="/login" className="btn btn-ghost">
                                            <SiteIcon name="user" size={14} />
                                            <span>登录后收藏</span>
                                        </Link>
                                    )}
                                </div>
                            </Surface>

                            {queueCount > 0 ? (
                                <div className="article-queue-note">
                                    <span className="badge">新增 {queueCount} 条待审核评论</span>
                                </div>
                            ) : null}

                            {seriesDetail ? <SeriesRail series={seriesDetail} currentSlug={post.slug} variant="inline" /> : null}

                            <Comments postId={post.id} comments={comments} onCommentAdded={handleCommentAdded} />

                            <Surface tone="glass" className="newsletter-inline-panel">
                                <div className="section-head compact-head">
                                    <div>
                                        <span className="eyebrow">Newsletter</span>
                                        <h3>喜欢这种长文？订阅后续更新</h3>
                                    </div>
                                </div>
                                <p className="section-copy">新的长文、项目复盘和工作流迭代会优先进入 newsletter。</p>
                                <NewsletterSignup source={`article:${post.slug}`} compact />
                            </Surface>

                            {post.relatedPosts?.length ? (
                                <section className="section-tight">
                                    <div className="section-head compact-head">
                                        <div>
                                            <span className="eyebrow">继续阅读</span>
                                            <h3>相关文章</h3>
                                        </div>
                                    </div>

                                    <div className="post-grid post-grid-related">
                                        {post.relatedPosts.map((item) => (
                                            <PostCard key={item.id} post={item} layout="grid" />
                                        ))}
                                    </div>
                                </section>
                            ) : null}
                        </article>

                        <aside className="article-sidebar">
                            {seriesDetail ? <SeriesRail series={seriesDetail} currentSlug={post.slug} /> : null}

                            {post.toc?.length ? (
                                <Surface tone="workbench" className="article-side-card article-toc-card">
                                    <strong>目录</strong>
                                    <div className="toc-list" data-testid="post-toc">
                                        {post.toc.map((item) => (
                                            <a
                                                key={item.id}
                                                href={`#${item.id}`}
                                                className={item.id === activeHeading ? 'is-active' : undefined}
                                                aria-current={item.id === activeHeading ? 'location' : undefined}
                                                style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
                                            >
                                                {item.text}
                                            </a>
                                        ))}
                                    </div>
                                </Surface>
                            ) : null}

                            <Surface tone="workbench" className="article-side-card">
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
                            </Surface>

                            {post.sourceUrl ? (
                                <Surface tone="workbench" className="article-side-card">
                                    <strong>补充链接</strong>
                                    <a href={post.sourceUrl} target="_blank" rel="noreferrer" className="side-link">
                                        <SiteIcon name="external" size={14} />
                                        <span>查看文章来源</span>
                                    </a>
                                </Surface>
                            ) : null}
                        </aside>
                    </div>
                </section>
            </PageScene>
        </>
    );
}
