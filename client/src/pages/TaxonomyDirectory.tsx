import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCategories, fetchTags, type Category, type Tag } from '../api/client';
import SEO from '../components/SEO';
import SiteIcon from '../components/SiteIcon';

interface TaxonomyDirectoryProps {
    kind: 'tag' | 'category';
}

export default function TaxonomyDirectory({ kind }: TaxonomyDirectoryProps) {
    const [items, setItems] = useState<Array<Tag | Category>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loader = kind === 'tag' ? fetchTags : fetchCategories;
        loader()
            .then((response) => {
                setItems(
                    [...response]
                        .filter((item) => (item._count?.posts || 0) > 0)
                        .sort((left, right) => {
                            const countDiff = (right._count?.posts || 0) - (left._count?.posts || 0);
                            return countDiff !== 0 ? countDiff : left.name.localeCompare(right.name, 'zh-CN');
                        }),
                );
            })
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [kind]);

    const config = useMemo(
        () =>
            kind === 'tag'
                ? {
                    title: '标签目录',
                    eyebrow: 'Tag Index',
                    description: '标签是跨分类的主题切片，适合快速进入一类具体问题或方法。',
                    routePrefix: '/tags',
                    icon: 'tag' as const,
                }
                : {
                    title: '分类目录',
                    eyebrow: 'Category Index',
                    description: '分类更像编辑部分栏，适合按问题域、研究方向与产出类型浏览。',
                    routePrefix: '/categories',
                    icon: 'folder' as const,
                },
        [kind],
    );

    return (
        <>
            <SEO title={config.title} description={config.description} />

            <section className="section page-compact-hero taxonomy-directory-hero">
                <div className="container taxonomy-directory-grid">
                    <div>
                        <span className="eyebrow">{config.eyebrow}</span>
                        <h1 className="section-title">{config.title}</h1>
                        <p className="section-copy">{config.description}</p>
                    </div>

                    <div className="feature-panel taxonomy-summary-card">
                        <span className="eyebrow">Index Summary</span>
                        <div className="stat-grid">
                            <div className="stat-card">
                                <SiteIcon name={config.icon} size={16} />
                                <strong>{items.length}</strong>
                                <span>公开条目</span>
                            </div>
                            <div className="stat-card">
                                <SiteIcon name="book-open" size={16} />
                                <strong>{items.reduce((sum, item) => sum + (item._count?.posts || 0), 0)}</strong>
                                <span>关联文章</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container taxonomy-directory-shell">
                    <div className="taxonomy-directory-actions">
                        <Link to="/archive" className="btn btn-secondary">
                            <SiteIcon name="calendar" size={14} />
                            <span>查看时间归档</span>
                        </Link>
                        <Link to="/blog" className="btn btn-ghost">
                            <SiteIcon name="search" size={14} />
                            <span>回到博客筛选</span>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="empty-state">正在整理目录...</div>
                    ) : items.length ? (
                        <div className="taxonomy-card-grid">
                            {items.map((item) => (
                                <Link key={item.id} to={`${config.routePrefix}/${item.slug}`} className="feature-panel taxonomy-card">
                                    <div className="taxonomy-card-head">
                                        <span className="meta-pill">
                                            <SiteIcon name={config.icon} size={13} />
                                            <span>{config.title.replace('目录', '')}</span>
                                        </span>
                                        <span className="badge">{item._count?.posts || 0} 篇</span>
                                    </div>
                                    <strong>{item.name}</strong>
                                    <p>进入这个 {kind === 'tag' ? '标签' : '分类'} 的全部公开文章。</p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">当前没有可展示的目录项。</div>
                    )}
                </div>
            </section>
        </>
    );
}

