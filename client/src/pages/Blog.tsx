import { useState, useEffect } from 'react';
import { fetchPosts, fetchTags, type Post, type Tag } from '../api/client';
import PostCard from '../components/PostCard';

export default function Blog() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [activeTag, setActiveTag] = useState<string>('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTags().then(setTags).catch(console.error);
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchPosts({ tag: activeTag || undefined, search: search || undefined })
            .then(setPosts)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [activeTag, search]);

    return (
        <div className="container" style={{ paddingTop: 'var(--space-3xl)', paddingBottom: 'var(--space-3xl)' }}>
            {/* 页面标题 */}
            <div className="animate-fade-in-up" style={{ opacity: 0, marginBottom: 'var(--space-2xl)' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>
                    <span className="gradient-text">📝 博客</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>技术笔记、项目分享与思考</p>
            </div>

            {/* 搜索和筛选 */}
            <div className="animate-fade-in-up delay-1" style={{
                opacity: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-md)',
                marginBottom: 'var(--space-2xl)',
            }}>
                {/* 搜索框 */}
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <span style={{
                        position: 'absolute',
                        left: 'var(--space-md)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        fontSize: '0.9rem',
                    }}>🔍</span>
                    <input
                        type="text"
                        placeholder="搜索文章..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: 'var(--space-sm) var(--space-md) var(--space-sm) 40px',
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--border-glass)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            fontFamily: 'var(--font-sans)',
                            outline: 'none',
                            transition: 'border-color var(--transition-fast)',
                        }}
                        onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
                        onBlur={e => (e.target.style.borderColor = 'var(--border-glass)')}
                    />
                </div>

                {/* 标签筛选 */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                    <button
                        className={activeTag === '' ? 'btn btn-primary' : 'btn btn-ghost'}
                        onClick={() => setActiveTag('')}
                        style={{ fontSize: '0.8rem', padding: '4px 14px' }}
                    >全部</button>
                    {tags.map(tag => (
                        <button
                            key={tag.id}
                            className={activeTag === tag.slug ? 'btn btn-primary' : 'btn btn-ghost'}
                            onClick={() => setActiveTag(tag.slug)}
                            style={{ fontSize: '0.8rem', padding: '4px 14px' }}
                        >
                            {tag.name} {tag._count && <span style={{ opacity: 0.6 }}>({tag._count.posts})</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* 文章列表 */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }} className="animate-float">⏳</div>
                    <p>加载中...</p>
                </div>
            ) : posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>📭</div>
                    <p>没有找到相关文章</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: 'var(--space-lg)',
                }}>
                    {posts.map((post, i) => (
                        <PostCard key={post.id} post={post} index={i} />
                    ))}
                </div>
            )}
        </div>
    );
}
