import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    fetchCategories,
    fetchPosts,
    fetchTags,
    type Category,
    type Post,
    type Tag,
} from '../api/client';
import PostCard from '../components/PostCard';
import SEO from '../components/SEO';
import SiteIcon from '../components/SiteIcon';

interface TaxonomyCollectionProps {
    kind: 'tag' | 'category';
}

export default function TaxonomyCollection({ kind }: TaxonomyCollectionProps) {
    const { slug } = useParams<{ slug: string }>();
    const [posts, setPosts] = useState<Post[]>([]);
    const [items, setItems] = useState<Array<Tag | Category>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) {
            setItems([]);
            setPosts([]);
            setLoading(false);
            return;
        }

        const loadTaxonomy = kind === 'tag' ? fetchTags : fetchCategories;
        Promise.all([
            loadTaxonomy(),
            fetchPosts({
                ...(kind === 'tag' ? { tag: slug } : { category: slug }),
                limit: 50,
            }),
        ])
            .then(([taxonomyItems, response]) => {
                setItems(taxonomyItems);
                setPosts(response.data);
            })
            .catch(() => {
                setItems([]);
                setPosts([]);
            })
            .finally(() => setLoading(false));
    }, [kind, slug]);

    const currentItem = useMemo(
        () => items.find((item) => item.slug === slug) || null,
        [items, slug],
    );

    const siblings = useMemo(
        () =>
            items
                .filter((item) => item.slug !== slug && (item._count?.posts || 0) > 0)
                .sort((left, right) => (right._count?.posts || 0) - (left._count?.posts || 0))
                .slice(0, 8),
        [items, slug],
    );

    const featuredPost = posts[0] || null;
    const restPosts = featuredPost ? posts.slice(1) : posts;
    const config = useMemo(
        () =>
            kind === 'tag'
                ? {
                    titlePrefix: '标签',
                    icon: 'tag' as const,
                    routePrefix: '/tags',
                    siblingLabel: '相邻标签',
                    directoryLabel: '全部标签',
                }
                : {
                    titlePrefix: '分类',
                    icon: 'folder' as const,
                    routePrefix: '/categories',
                    siblingLabel: '其他分类',
                    directoryLabel: '全部分类',
                },
        [kind],
    );

    const seoTitle = currentItem ? `${currentItem.name} · ${config.titlePrefix}` : config.directoryLabel;
    const seoDescription = currentItem
        ? `浏览「${currentItem.name}」下的全部公开文章与阅读路径。`
        : `浏览${config.directoryLabel}。`;

    return (
        <>
            <SEO title={seoTitle} description={seoDescription} />

            <section className="section page-compact-hero taxonomy-detail-hero">
                <div className="container taxonomy-detail-grid">
                    <div>
                        <Link to={config.routePrefix} className="section-link back-link">
                            <SiteIcon name="chevron-right" size={14} style={{ transform: 'rotate(180deg)' }} />
                            <span>返回{config.directoryLabel}</span>
                        </Link>
                        <span className="eyebrow">{config.titlePrefix} Collection</span>
                        <h1 className="section-title">{currentItem?.name || '未找到对应目录'}</h1>
                        <p className="section-copy">
                            {currentItem
                                ? `这里聚合了「${currentItem.name}」相关的公开文章，适合沿着同一个问题持续阅读。`
                                : '没有找到对应的目录项。'}
                        </p>
                    </div>

                    <div className="feature-panel taxonomy-detail-panel">
                        <span className="eyebrow">Collection Stats</span>
                        <div className="stat-grid">
                            <div className="stat-card">
                                <SiteIcon name={config.icon} size={16} />
                                <strong>{currentItem?._count?.posts || 0}</strong>
                                <span>文章总数</span>
                            </div>
                            <div className="stat-card">
                                <SiteIcon name="book-open" size={16} />
                                <strong>{posts.filter((post) => post.featured).length}</strong>
                                <span>精选文章</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container taxonomy-detail-shell">
                    <div className="taxonomy-detail-main">
                        {loading ? (
                            <div className="empty-state">正在读取目录内容...</div>
                        ) : !currentItem ? (
                            <div className="empty-state">没有找到对应的 {config.titlePrefix}。</div>
                        ) : posts.length ? (
                            <>
                                {featuredPost ? <PostCard post={featuredPost} featured /> : null}
                                {restPosts.length ? (
                                    <div className="stack-grid archive-results-list">
                                        {restPosts.map((post) => (
                                            <PostCard key={post.id} post={post} compact />
                                        ))}
                                    </div>
                                ) : null}
                            </>
                        ) : (
                            <div className="empty-state">这个目录下暂时还没有公开文章。</div>
                        )}
                    </div>

                    <aside className="taxonomy-detail-aside">
                        <div className="feature-panel archive-aside-card">
                            <span className="eyebrow">{config.siblingLabel}</span>
                            <div className="archive-taxonomy-list">
                                {siblings.map((item) => (
                                    <Link key={item.id} to={`${config.routePrefix}/${item.slug}`} className="archive-taxonomy-row">
                                        <span>{item.name}</span>
                                        <span className="command-hint">{item._count?.posts || 0}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="feature-panel archive-aside-card">
                            <span className="eyebrow">Explore More</span>
                            <div className="list-block">
                                <Link to="/archive" className="archive-item archive-mini-link">
                                    <strong>时间归档</strong>
                                    <p>按年份与月份浏览全部公开文章。</p>
                                </Link>
                                <Link to="/series" className="archive-item archive-mini-link">
                                    <strong>专栏路径</strong>
                                    <p>进入连续更新的系列阅读方式。</p>
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </>
    );
}

