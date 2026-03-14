import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { fetchCategories, fetchPosts, fetchTags, type Category, type Post, type Tag } from '../api/client';
import PostCard from '../components/PostCard';
import SEO from '../components/SEO';
import SiteIcon from '../components/SiteIcon';

const DEFAULT_TAG_LIMIT = 10;

function sortByUsage<T extends { _count?: { posts: number }; name: string }>(items: T[]) {
    return items
        .filter((item) => (item._count?.posts || 0) > 0)
        .sort((left, right) => {
            const countDiff = (right._count?.posts || 0) - (left._count?.posts || 0);
            if (countDiff !== 0) {
                return countDiff;
            }
            return left.name.localeCompare(right.name, 'zh-CN');
        });
}

export default function Blog() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeTag, setActiveTag] = useState('');
    const [activeCategory, setActiveCategory] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [showAllTags, setShowAllTags] = useState(false);
    const deferredSearch = useDeferredValue(search);

    useEffect(() => {
        Promise.all([fetchTags(), fetchCategories()])
            .then(([tagResponse, categoryResponse]) => {
                setTags(sortByUsage(tagResponse));
                setCategories(sortByUsage(categoryResponse));
            })
            .catch(() => {
                setTags([]);
                setCategories([]);
            });
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchPosts({
            tag: activeTag || undefined,
            category: activeCategory || undefined,
            search: deferredSearch || undefined,
            page,
            limit: 7,
        })
            .then((response) => {
                setPosts(response.data);
                setTotalPages(response.pagination.totalPages);
            })
            .catch(() => {
                setPosts([]);
                setTotalPages(1);
            })
            .finally(() => setLoading(false));
    }, [activeCategory, activeTag, deferredSearch, page]);

    useEffect(() => {
        setPage(1);
    }, [activeCategory, activeTag, deferredSearch]);

    const visibleTags = showAllTags ? tags : tags.slice(0, DEFAULT_TAG_LIMIT);
    const featuredPost = page === 1 ? posts[0] : null;
    const restPosts = page === 1 ? posts.slice(1) : posts;
    const activeFilters = [
        activeCategory ? categories.find((item) => item.slug === activeCategory)?.name : '',
        activeTag ? tags.find((item) => item.slug === activeTag)?.name : '',
        deferredSearch.trim(),
    ].filter(Boolean) as string[];

    return (
        <>
            <SEO title="博客" description="按主题、分类和关键词浏览长期写作与研究归档。" />

            <section className="section page-compact-hero archive-hero">
                <div className="container archive-hero-shell">
                    <div>
                        <span className="eyebrow">文章归档</span>
                        <h1 className="section-title">给长期阅读者准备的内容档案</h1>
                        <p className="section-copy">
                            这里按主题、分类和关键词组织长文、复盘和研究笔记。更像编辑目录，而不是无差别信息流。
                        </p>
                    </div>

                    <div className="hero-fact-rail archive-fact-rail">
                        <article className="hero-fact-item">
                            <strong>搜索 / 分类 / 标签</strong>
                            <p>先确定方向，再决定要不要投入阅读时间。</p>
                        </article>
                        <article className="hero-fact-item">
                            <strong>{categories.length || '--'} 个分类 / {tags.length || '--'} 个标签</strong>
                            <p>只保留当前公开内容真正用得到的线索。</p>
                        </article>
                    </div>
                </div>
            </section>

            <section className="section section-border section-tight">
                <div className="container">
                    <div className="filter-shell archive-filter-shell">
                        <div className="archive-filter-topline">
                            <label className="form-field archive-search-field">
                                <span className="form-label">搜索文章</span>
                                <div className="input-with-icon">
                                    <SiteIcon name="search" size={15} />
                                    <input
                                        data-testid="blog-search-input"
                                        className="form-input"
                                        value={search}
                                        onChange={(event) => startTransition(() => setSearch(event.target.value))}
                                        placeholder="搜索标题、摘要或关键词..."
                                    />
                                </div>
                            </label>

                            {activeFilters.length ? (
                                <div className="tag-list archive-active-tags">
                                    {activeFilters.map((item) => (
                                        <span key={item} className="tag">
                                            <SiteIcon name="spark" size={12} />
                                            <span>{item}</span>
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <div className="filter-group">
                            <span className="filter-label">
                                <SiteIcon name="folder" size={13} />
                                <span>分类</span>
                            </span>
                            <div className="filter-row">
                                <button
                                    type="button"
                                    className={`filter-chip ${activeCategory ? '' : 'is-active'}`}
                                    onClick={() => setActiveCategory('')}
                                >
                                    全部分类
                                </button>
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        data-testid={`category-filter-${category.slug}`}
                                        className={`filter-chip ${activeCategory === category.slug ? 'is-active' : ''}`}
                                        onClick={() => setActiveCategory(category.slug)}
                                    >
                                        {category.name}
                                        <span className="command-hint">{category._count?.posts || 0}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <div className="section-head compact-head">
                                <span className="filter-label">
                                    <SiteIcon name="tag" size={13} />
                                    <span>标签</span>
                                </span>
                                {tags.length > DEFAULT_TAG_LIMIT ? (
                                    <button type="button" className="btn btn-ghost archive-filter-toggle" onClick={() => setShowAllTags((current) => !current)}>
                                        {showAllTags ? '收起标签' : `展开更多标签 (${tags.length - DEFAULT_TAG_LIMIT})`}
                                    </button>
                                ) : null}
                            </div>
                            <div className="filter-row">
                                <button
                                    type="button"
                                    className={`filter-chip ${activeTag ? '' : 'is-active'}`}
                                    onClick={() => setActiveTag('')}
                                >
                                    全部标签
                                </button>
                                {visibleTags.map((tag) => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        data-testid={`tag-filter-${tag.slug}`}
                                        className={`filter-chip ${activeTag === tag.slug ? 'is-active' : ''}`}
                                        onClick={() => setActiveTag(tag.slug)}
                                    >
                                        {tag.name}
                                        <span className="command-hint">{tag._count?.posts || 0}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container section-stack archive-results-shell">
                    {loading ? (
                        <div className="empty-state">正在同步文章归档...</div>
                    ) : posts.length === 0 ? (
                        <div className="empty-state">没有找到符合条件的文章，换一个关键词或筛选条件试试。</div>
                    ) : (
                        <>
                            {featuredPost ? <PostCard post={featuredPost} featured /> : null}
                            <div className="stack-grid archive-results-list">
                                {restPosts.map((post) => (
                                    <PostCard key={post.id} post={post} compact />
                                ))}
                            </div>
                        </>
                    )}

                    {totalPages > 1 ? (
                        <div className="pagination-shell">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                disabled={page <= 1}
                                onClick={() => setPage((current) => Math.max(1, current - 1))}
                            >
                                <SiteIcon name="chevron-right" size={14} style={{ transform: 'rotate(180deg)' }} />
                                <span>上一页</span>
                            </button>
                            <span className="meta-pill emphasis">{page} / {totalPages}</span>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                disabled={page >= totalPages}
                                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                            >
                                <span>下一页</span>
                                <SiteIcon name="chevron-right" size={14} />
                            </button>
                        </div>
                    ) : null}
                </div>
            </section>
        </>
    );
}
