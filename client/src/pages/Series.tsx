import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSeries, type Series } from '../api/client';
import SEO from '../components/SEO';
import SiteIcon from '../components/SiteIcon';
import { siteConfig } from '../config/site';
import { formatShortDate } from '../lib/format';

function formatSeriesDate(value?: string | null) {
    if (!value) return '--';
    return formatShortDate(value);
}

export default function SeriesPage() {
    const [items, setItems] = useState<Series[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetchSeries()
            .then(setItems)
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <SEO
                title="专栏"
                description="按主题连续更新的写作专栏与阅读路径。"
                jsonLd={{
                    '@context': 'https://schema.org',
                    '@type': 'CollectionPage',
                    name: `${siteConfig.name} 专栏`,
                    description: '按主题连续更新的写作专栏与阅读路径。',
                    url: `${siteConfig.url}/series`,
                }}
            />

            <section className="section page-compact-hero">
                <div className="container page-compact-grid">
                    <div>
                        <span className="eyebrow">Series</span>
                        <h1 className="section-title">专栏与连续写作</h1>
                        <p className="section-copy">
                            把相关主题按顺序组织成可持续更新的阅读路径，让内容从“列表”升级为“体系”。
                        </p>
                    </div>

                    <div className="stat-grid">
                        <div className="stat-card">
                            <SiteIcon name="link" size={16} />
                            <strong>{loading ? '--' : items.length} 个专栏</strong>
                            <span>只展示已有公开文章的专栏。</span>
                        </div>
                        <div className="stat-card">
                            <SiteIcon name="book-open" size={16} />
                            <strong>顺序阅读</strong>
                            <span>每个专栏都有章节排序与进度提示。</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section section-border">
                <div className="container section-stack">
                    {loading ? (
                        <div className="empty-state">正在读取专栏列表...</div>
                    ) : items.length ? (
                        <div className="series-grid">
                            {items.map((item) => (
                                <Link key={item.id} to={`/series/${item.slug}`} className="series-card" data-testid={`series-card-${item.slug}`}>
                                    <div className="series-card-media">
                                        {item.coverImage ? (
                                            <img src={item.coverImage} alt={item.title} />
                                        ) : (
                                            <div className="visual-placeholder">
                                                <span className="visual-badge">
                                                    <SiteIcon name="link" size={14} />
                                                    <span>series</span>
                                                </span>
                                                <strong>{item.title}</strong>
                                            </div>
                                        )}
                                    </div>

                                    <div className="series-card-content">
                                        <div className="series-card-topline">
                                            <div className="meta-inline">
                                                <span className="chip">
                                                    <SiteIcon name="spark" size={13} />
                                                    <span>{item.status}</span>
                                                </span>
                                                <span className="meta-pill">
                                                    <SiteIcon name="book-open" size={13} />
                                                    <span>{item.stats?.publishedPosts ?? 0} 篇</span>
                                                </span>
                                            </div>
                                            <span className="meta-pill">
                                                <SiteIcon name="calendar" size={13} />
                                                <span>{formatSeriesDate(item.stats?.lastUpdatedAt ?? item.updatedAt)}</span>
                                            </span>
                                        </div>

                                        <div className="series-card-body">
                                            <h3>{item.title}</h3>
                                            <p>{item.summary || item.description || '打开专栏，按顺序阅读完整路径。'}</p>
                                        </div>

                                        <span className="section-link">
                                            <span>进入专栏</span>
                                            <SiteIcon name="arrow-right" size={14} />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">当前还没有可以公开展示的专栏。</div>
                    )}
                </div>
            </section>
        </>
    );
}

