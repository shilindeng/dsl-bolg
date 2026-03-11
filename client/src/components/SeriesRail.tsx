import { Link } from 'react-router-dom';
import type { SeriesDetail } from '../api/client';
import SiteIcon from './SiteIcon';

interface SeriesRailProps {
    series: SeriesDetail;
    currentSlug: string;
    variant?: 'sidebar' | 'inline';
}

export default function SeriesRail({ series, currentSlug, variant = 'sidebar' }: SeriesRailProps) {
    const posts = series.posts || [];
    const currentIndex = Math.max(0, posts.findIndex((post) => post.slug === currentSlug));
    const total = posts.length;
    const previous = currentIndex > 0 ? posts[currentIndex - 1] : null;
    const next = currentIndex >= 0 && currentIndex < total - 1 ? posts[currentIndex + 1] : null;
    const baseClass = variant === 'inline' ? 'feature-panel series-rail-panel' : 'article-side-card series-rail-card';

    if (!total) {
        return null;
    }

    const testId = variant === 'inline' ? 'series-rail-inline' : 'series-rail-sidebar';

    return (
        <div className={baseClass} data-testid={testId}>
            <div className="series-rail-head">
                <div>
                    <span className="eyebrow">Series</span>
                    <Link to={`/series/${series.slug}`} className="series-rail-title">
                        {series.title}
                    </Link>
                </div>
                <span className="meta-pill emphasis">
                    <SiteIcon name="link" size={13} />
                    <span>第 {currentIndex + 1} / {total} 篇</span>
                </span>
            </div>

            {series.summary ? <p className="series-rail-summary">{series.summary}</p> : null}

            <div className="series-rail-actions">
                {previous ? (
                    <Link to={`/blog/${previous.slug}`} className="side-link">
                        <SiteIcon name="chevron-right" size={14} style={{ transform: 'rotate(180deg)' }} />
                        <span>上一章：{previous.title}</span>
                    </Link>
                ) : (
                    <span className="muted series-rail-edge">已到第一章</span>
                )}

                {next ? (
                    <Link to={`/blog/${next.slug}`} className="side-link">
                        <span>下一章：{next.title}</span>
                        <SiteIcon name="chevron-right" size={14} />
                    </Link>
                ) : (
                    <span className="muted series-rail-edge">已到最后一章</span>
                )}
            </div>

            <div className="series-rail-list" aria-label="专栏章节列表">
                {posts.slice(0, 6).map((post) => (
                    <Link
                        key={post.id}
                        to={`/blog/${post.slug}`}
                        className={`series-rail-item ${post.slug === currentSlug ? 'is-active' : ''}`}
                    >
                        <span className="series-rail-index mono">{String(post.seriesOrder ?? '--').padStart(2, '0')}</span>
                        <span className="series-rail-label">{post.title}</span>
                    </Link>
                ))}

                {total > 6 ? (
                    <Link to={`/series/${series.slug}`} className="section-link">
                        <span>查看全部 {total} 篇</span>
                        <SiteIcon name="arrow-right" size={14} />
                    </Link>
                ) : null}
            </div>
        </div>
    );
}
