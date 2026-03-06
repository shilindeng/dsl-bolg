import { startTransition, useDeferredValue, useEffect, useState } from 'react';
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

    const featuredPost = page === 1 ? posts[0] : null;
    const restPosts = page === 1 ? posts.slice(1) : posts;

    return (
        <>
            <SEO title="博客" description="按主题、分类和关键词浏览 DSL 的技术写作、产品思考与界面研究。" />

            <section className="section page-hero">
                <div className="container page-hero-shell">
                    <div>
                        <div className="eyebrow">文章归档</div>
                        <h1 className="section-title">文章归档</h1>
                        <p className="lead">
                            按主题浏览长文、复盘和设计笔记。这里的内容优先服务于判断力和可复用经验，而不是追逐热度。
                        </p>
                    </div>
                    <div className="page-hero-badge mono">可检索 / 可筛选 / 长文优先</div>
                </div>
            </section>

            <section className="section section-tight">
                <div className="container">
                    <div className="filter-shell">
                        <label className="form-field">
                            <span className="form-label">搜索文章</span>
                            <input
                                data-testid="blog-search-input"
                                className="form-input"
                                value={search}
                                onChange={(event) => startTransition(() => setSearch(event.target.value))}
                                placeholder="搜索标题、摘要或关键词..."
                            />
                        </label>

                        <div className="filter-group">
                            <span className="filter-label mono">CATEGORY</span>
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
                            <span className="filter-label mono">TAG</span>
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

            <section className="section">
                <div className="container" style={{ display: 'grid', gap: '1.5rem' }}>
                    {loading ? (
                        <div className="empty-state">正在同步文章归档...</div>
                    ) : posts.length === 0 ? (
                        <div className="empty-state">没有找到符合条件的文章，换一个关键词或标签试试。</div>
                    ) : (
                        <>
                            {featuredPost ? <PostCard post={featuredPost} featured /> : null}
                            <div className="two-grid">
                                {restPosts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        </>
                    )}

                    {totalPages > 1 ? (
                        <div className="pagination-shell">
                            <button type="button" className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                                上一页
                            </button>
                            <span className="command-hint">{page} / {totalPages}</span>
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
