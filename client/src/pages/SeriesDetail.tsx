import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchSeriesDetail, type SeriesDetail } from '../api/client';
import SEO from '../components/SEO';
import SiteIcon from '../components/SiteIcon';
import { siteConfig } from '../config/site';
import { formatShortDate } from '../lib/format';

export default function SeriesDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const [data, setData] = useState<SeriesDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        let cancelled = false;
        setLoading(true);

        fetchSeriesDetail(slug)
            .then((response) => {
                if (cancelled) return;
                setData(response);
            })
            .catch(() => {
                if (cancelled) return;
                setData(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [slug]);

    const chapterCount = data?.posts.length || 0;
    const lastUpdated = useMemo(() => {
        if (!data) return '--';
        const candidate = data.stats?.lastUpdatedAt || data.updatedAt;
        return candidate ? formatShortDate(candidate) : '--';
    }, [data]);

    if (loading) {
        return (
            <section className="section">
                <div className="container">
                    <div className="empty-state">正在加载专栏...</div>
                </div>
            </section>
        );
    }

    if (!data) {
        return (
            <section className="section">
                <div className="container">
                    <div className="empty-state">
                        <h1 className="section-title">专栏不存在</h1>
                        <Link to="/series" className="btn btn-primary">
                            <SiteIcon name="arrow-right" size={14} style={{ transform: 'rotate(180deg)' }} />
                            <span>返回专栏列表</span>
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    const seriesUrl = `${siteConfig.url}/series/${data.slug}`;

    return (
        <>
            <SEO
                title={data.title}
                description={data.summary || data.description || '按顺序阅读这个专栏的全部章节。'}
                url={seriesUrl}
                jsonLd={{
                    '@context': 'https://schema.org',
                    '@type': 'CollectionPage',
                    name: data.title,
                    description: data.summary || data.description || '',
                    url: seriesUrl,
                }}
            />

            <section className="section page-compact-hero">
                <div className="container page-compact-grid">
                    <div className="series-hero-copy">
                        <Link to="/series" className="section-link back-link">
                            <SiteIcon name="chevron-right" size={14} style={{ transform: 'rotate(180deg)' }} />
                            <span>返回专栏列表</span>
                        </Link>

                        <span className="eyebrow">Series</span>
                        <h1 className="section-title">{data.title}</h1>
                        <p className="section-copy">{data.summary || data.description}</p>

                        <div className="meta-inline">
                            <span className="meta-pill">
                                <SiteIcon name="book-open" size={13} />
                                <span>{chapterCount} 篇</span>
                            </span>
                            <span className="meta-pill">
                                <SiteIcon name="spark" size={13} />
                                <span>{data.status}</span>
                            </span>
                            <span className="meta-pill">
                                <SiteIcon name="calendar" size={13} />
                                <span>最近更新 {lastUpdated}</span>
                            </span>
                        </div>
                    </div>

                    {data.coverImage ? (
                        <div className="series-cover-card">
                            <img src={data.coverImage} alt={data.title} />
                        </div>
                    ) : null}
                </div>
            </section>

            <section className="section section-border">
                <div className="container section-stack">
                    <div className="section-head">
                        <div>
                            <span className="eyebrow">Chapters</span>
                            <h2 className="section-title compact-title">章节目录</h2>
                        </div>
                        <Link to="/blog" className="section-link">
                            <span>打开文章归档</span>
                            <SiteIcon name="arrow-right" size={14} />
                        </Link>
                    </div>

                    {data.posts.length ? (
                        <div className="stack-grid">
                            {data.posts.map((post) => (
                                <Link key={post.id} to={`/blog/${post.slug}`} className="archive-item" data-testid={`series-post-${post.slug}`}>
                                    <div>
                                        <div className="meta-inline">
                                            <span className="meta-pill">
                                                <SiteIcon name="link" size={13} />
                                                <span>第 {post.seriesOrder ?? '--'} 篇</span>
                                            </span>
                                            <span className="meta-pill">
                                                <SiteIcon name="calendar" size={13} />
                                                <span>{formatShortDate(post.publishedAt || post.createdAt)}</span>
                                            </span>
                                            <span className="meta-pill">
                                                <SiteIcon name="clock" size={13} />
                                                <span>{post.meta?.readTime || 1} 分钟</span>
                                            </span>
                                        </div>
                                        <strong>{post.title}</strong>
                                        <p>{post.deck?.trim() || post.excerpt}</p>
                                    </div>
                                    <span className="section-link">
                                        <span>开始阅读</span>
                                        <SiteIcon name="arrow-right" size={14} />
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">这个专栏还没有公开章节。</div>
                    )}
                </div>
            </section>
        </>
    );
}

