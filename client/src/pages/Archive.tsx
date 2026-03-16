import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchArchive, fetchCategories, fetchTags, type ArchiveResponse, type Category, type Tag } from '../api/client';
import SEO from '../components/SEO';
import SiteIcon from '../components/SiteIcon';
import { formatDate } from '../lib/format';

function sortByUsage<T extends { _count?: { posts: number }; name: string }>(items: T[]) {
    return [...items]
        .filter((item) => (item._count?.posts || 0) > 0)
        .sort((left, right) => {
            const countDiff = (right._count?.posts || 0) - (left._count?.posts || 0);
            return countDiff !== 0 ? countDiff : left.name.localeCompare(right.name, 'zh-CN');
        });
}

export default function Archive() {
    const [archive, setArchive] = useState<ArchiveResponse | null>(null);
    const [tags, setTags] = useState<Tag[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchArchive(), fetchTags(), fetchCategories()])
            .then(([archiveResponse, tagResponse, categoryResponse]) => {
                setArchive(archiveResponse);
                setTags(sortByUsage(tagResponse).slice(0, 12));
                setCategories(sortByUsage(categoryResponse).slice(0, 8));
            })
            .catch(() => {
                setArchive({ summary: { totalPosts: 0, totalYears: 0, lastPublishedAt: null }, years: [] });
                setTags([]);
                setCategories([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const latestMonth = archive?.years[0]?.months[0];
    const standoutMonths = useMemo(
        () => archive?.years.flatMap((year) => year.months).slice(0, 3) || [],
        [archive],
    );

    return (
        <>
            <SEO title="归档" description="按年份、月份、主题与目录入口浏览公开文章归档。" />

            <section className="section page-compact-hero archive-ledger-hero">
                <div className="container archive-ledger-grid">
                    <div className="archive-ledger-copy">
                        <span className="eyebrow">Archive Ledger</span>
                        <h1 className="section-title">把博客当作一份长期维护的研究目录</h1>
                        <p className="section-copy">
                            这里不是时间线，而是一份可回查、可跳读、可建立上下文的公开档案。先按年份进入，再按月份与主题判断是否值得深入。
                        </p>

                        <div className="archive-hero-actions">
                            <Link to="/blog" className="btn btn-primary">
                                <SiteIcon name="book-open" size={14} />
                                <span>进入博客筛选</span>
                            </Link>
                            <Link to="/tags" className="btn btn-secondary">
                                <SiteIcon name="tag" size={14} />
                                <span>浏览标签目录</span>
                            </Link>
                        </div>
                    </div>

                    <div className="archive-ledger-side">
                        <div className="feature-panel archive-ledger-panel">
                            <span className="eyebrow">Archive Summary</span>
                            <div className="archive-stat-grid">
                                <div className="stat-card">
                                    <SiteIcon name="book-open" size={16} />
                                    <strong>{archive?.summary.totalPosts || 0}</strong>
                                    <span>公开文章</span>
                                </div>
                                <div className="stat-card">
                                    <SiteIcon name="calendar" size={16} />
                                    <strong>{archive?.summary.totalYears || 0}</strong>
                                    <span>归档年份</span>
                                </div>
                                <div className="stat-card">
                                    <SiteIcon name="spark" size={16} />
                                    <strong>{latestMonth?.label || '--'}</strong>
                                    <span>最近更新月</span>
                                </div>
                            </div>
                            {archive?.summary.lastPublishedAt ? (
                                <p className="muted archive-summary-note">
                                    最近公开更新时间：{formatDate(archive.summary.lastPublishedAt)}
                                </p>
                            ) : null}
                        </div>

                        <div className="feature-panel archive-ledger-panel">
                            <span className="eyebrow">Jump In</span>
                            <div className="list-block">
                                <Link to="/categories" className="archive-item archive-mini-link">
                                    <strong>分类目录</strong>
                                    <p>按问题域而不是按发布日期进入内容。</p>
                                </Link>
                                <Link to="/series" className="archive-item archive-mini-link">
                                    <strong>专栏阅读路径</strong>
                                    <p>适合连续理解同一主题的深度文章。</p>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section section-border section-tight">
                <div className="container archive-highlights-grid">
                    {standoutMonths.map((month) => (
                        <article key={`${month.label}-${month.month}`} className="feature-panel archive-highlight-card">
                            <span className="eyebrow">Recent Shelf</span>
                            <strong>{month.label}</strong>
                            <p className="muted">{month.totalPosts} 篇公开文章，{month.featuredCount} 篇精选。</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="section">
                <div className="container archive-structure-grid">
                    <div className="archive-timeline-column">
                        {loading ? (
                            <div className="empty-state">正在整理归档目录...</div>
                        ) : archive?.years.length ? (
                            <div className="archive-year-stack">
                                {archive.years.map((year) => (
                                    <section key={year.year} className="archive-year-section">
                                        <div className="archive-year-heading">
                                            <div>
                                                <span className="eyebrow">Year</span>
                                                <h2>{year.year}</h2>
                                            </div>
                                            <span className="meta-pill emphasis">{year.totalPosts} 篇</span>
                                        </div>

                                        <div className="archive-month-stack">
                                            {year.months.map((month) => (
                                                <article key={`${year.year}-${month.month}`} className="feature-panel archive-month-card">
                                                    <div className="archive-month-head">
                                                        <div>
                                                            <strong>{month.label}</strong>
                                                            <p className="muted">{month.totalPosts} 篇文章，{month.featuredCount} 篇精选。</p>
                                                        </div>
                                                        <Link to="/blog" className="section-link archive-inline-link">
                                                            <span>进入筛选页</span>
                                                            <SiteIcon name="arrow-right" size={14} />
                                                        </Link>
                                                    </div>

                                                    <div className="archive-ledger-list">
                                                        {month.posts.map((post) => (
                                                            <Link key={post.id} to={`/blog/${post.slug}`} className="archive-ledger-row">
                                                                <div>
                                                                    <strong>{post.title}</strong>
                                                                    <p>{post.deck?.trim() || post.excerpt}</p>
                                                                </div>
                                                                <div className="archive-ledger-meta">
                                                                    {post.category ? <span className="chip">{post.category.name}</span> : null}
                                                                    <span className="meta-pill">{post.meta?.readTime || 1} 分钟</span>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">当前没有可展示的归档内容。</div>
                        )}
                    </div>

                    <aside className="archive-aside-column">
                        <div className="feature-panel archive-aside-card">
                            <span className="eyebrow">Top Categories</span>
                            <div className="archive-taxonomy-list">
                                {categories.map((category) => (
                                    <Link key={category.id} to={`/categories/${category.slug}`} className="archive-taxonomy-row">
                                        <span>{category.name}</span>
                                        <span className="command-hint">{category._count?.posts || 0}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="feature-panel archive-aside-card">
                            <span className="eyebrow">Tag Shelf</span>
                            <div className="tag-list archive-tag-cloud">
                                {tags.map((tag) => (
                                    <Link key={tag.id} to={`/tags/${tag.slug}`} className="tag">
                                        <SiteIcon name="tag" size={12} />
                                        <span>{tag.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </>
    );
}
