import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { fetchCategories, fetchPosts, fetchTags, type Category, type Post, type Tag } from '../api/client';
import PostCard from '../components/PostCard';
import SEO from '../components/SEO';

export default function Blog() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeTag, setActiveTag] = useState('');
    const [activeCategory, setActiveCategory] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPosts, setTotalPosts] = useState(0);
    const [loading, setLoading] = useState(true);
    const deferredSearch = useDeferredValue(search);

    useEffect(() => {
        Promise.all([fetchTags(), fetchCategories()]).then(([tagResponse, categoryResponse]) => {
            setTags(tagResponse);
            setCategories(categoryResponse);
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
                setTotalPosts(response.pagination.total);
            })
            .catch(() => {
                setPosts([]);
                setTotalPages(1);
                setTotalPosts(0);
            })
            .finally(() => setLoading(false));
    }, [activeCategory, activeTag, deferredSearch, page]);

    useEffect(() => {
        setPage(1);
    }, [activeCategory, activeTag, deferredSearch]);

    const featuredPost = page === 1 ? posts[0] : null;
    const restPosts = page === 1 ? posts.slice(1) : posts;
    const activeFilters = useMemo(
        () => [
            activeCategory ? categories.find((item) => item.slug === activeCategory)?.name : '',
            activeTag ? tags.find((item) => item.slug === activeTag)?.name : '',
            deferredSearch.trim(),
        ].filter(Boolean) as string[],
        [activeCategory, activeTag, categories, deferredSearch, tags],
    );

    return (
        <>
            <SEO title="博客" description="按主题、分类和关键词浏览 DSL 的技术写作、产品思考与界面研究。" />

            <section className="section page-hero archive-hero">
                <div className="container page-hero-shell archive-hero-shell">
                    <div className="section-stack">
                        <div>
                            <div className="eyebrow">文章归档</div>
                            <h1 className="section-title">给长期阅读者准备的内容档案</h1>
                            <p className="lead">
                                这里按主题、标签与关键词组织长文、复盘和设计笔记。目标不是追逐更新频率，而是把可复用的判断力沉淀成长期资产。
                            </p>
                        </div>

                        <div className="hero-metrics archive-hero-metrics">
                            <div className="metric-card">
                                <span className="muted mono">检索模型</span>
                                <strong>搜索 / 分类 / 标签</strong>
                            </div>
                            <div className="metric-card">
                                <span className="muted mono">分类</span>
                                <strong>{categories.length || '--'} 个主题</strong>
                            </div>
                            <div className="metric-card">
                                <span className="muted mono">结果数</span>
                                <strong>{loading ? '--' : totalPosts} 篇文章</strong>
                            </div>
                        </div>
                    </div>

                    <div className="panel panel-body archive-note-panel">
                        <div className="eyebrow">阅读方式</div>
                        <h2 className="section-title">先缩小范围，再进入正文</h2>
                        <p className="muted">
                            一次只给你足够少、但足够清晰的内容线索。先确定主题方向，再决定投入阅读时间，体验会比无差别信息流更高级。
                        </p>
                    </div>
                </div>
            </section>

            <section className="section section-tight">
                <div className="container">
                    <div className="filter-shell archive-filter-shell">
                        <div className="archive-filter-topline">
                            <label className="form-field archive-search-field">
                                <span className="form-label">搜索文章</span>
                                <input
                                    data-testid="blog-search-input"
                                    className="form-input"
                                    value={search}
                                    onChange={(event) => startTransition(() => setSearch(event.target.value))}
                                    placeholder="搜索标题、摘要或关键词..."
                                />
                            </label>

                            {activeFilters.length ? (
                                <div className="tag-list archive-active-tags">
                                    {activeFilters.map((item) => (
                                        <span key={item} className="tag">{item}</span>
                                    ))}
                                    <button type="button" className="btn btn-ghost" onClick={() => { setActiveCategory(''); setActiveTag(''); setSearch(''); }}>
                                        清空筛选
                                    </button>
                                </div>
                            ) : null}
                        </div>

                        <div className="filter-group">
                            <span className="filter-label mono">分类</span>
                            <div className="filter-row">
                                <button type="button" className={`btn ${activeCategory ? 'btn-ghost' : 'btn-secondary'}`} onClick={() => setActiveCategory('')}>
                                    全部分类
                                </button>
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        data-testid={`category-filter-${category.slug}`}
                                        className={`btn ${activeCategory === category.slug ? 'btn-secondary' : 'btn-ghost'}`}
                                        onClick={() => setActiveCategory(category.slug)}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <span className="filter-label mono">标签</span>
                            <div className="filter-row">
                                <button type="button" className={`btn ${activeTag ? 'btn-ghost' : 'btn-secondary'}`} onClick={() => setActiveTag('')}>
                                    全部标签
                                </button>
                                {tags.map((tag) => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        data-testid={`tag-filter-${tag.slug}`}
                                        className={`btn ${activeTag === tag.slug ? 'btn-secondary' : 'btn-ghost'}`}
                                        onClick={() => setActiveTag(tag.slug)}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section archive-results-section">
                <div className="container archive-results-shell">
                    {loading ? (
                        <div className="empty-state">正在同步文章归档...</div>
                    ) : posts.length === 0 ? (
                        <div className="empty-state">没有找到符合条件的文章，换一个关键词或标签试试。</div>
                    ) : (
                        <>
                            {featuredPost ? (
                                <div className="archive-featured-stage">
                                    <div className="archive-featured-copy feature-panel">
                                        <div className="eyebrow">本页主打</div>
                                        <h2>先从这篇开始，快速判断内容是否值得继续深入</h2>
                                        <p className="muted">
                                            归档页第一页会优先展示一篇更能代表站点方法论的内容，其余文章则进入更高密度、更易浏览的档案网格。
                                        </p>
                                    </div>
                                    <PostCard post={featuredPost} featured />
                                </div>
                            ) : null}

                            <div className="two-grid archive-grid">
                                {restPosts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        </>
                    )}

                    {totalPages > 1 ? (
                        <div className="pagination-shell archive-pagination">
                            <button type="button" className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                                上一页
                            </button>
                            <span className="command-hint">第 {page} / {totalPages} 页</span>
                            <button type="button" className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                                下一页
                            </button>
                        </div>
                    ) : null}
                </div>
            </section>
        </>
    );
}
