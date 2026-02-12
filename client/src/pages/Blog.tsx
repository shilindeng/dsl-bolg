import { useState, useEffect } from 'react';
import { fetchPosts, fetchTags, type Post, type Tag } from '../api/client';
import PostCard from '../components/PostCard';
import TypewriterText from '../components/TypewriterText';
import ScrollReveal from '../components/ScrollReveal';

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
            .then((data) => setPosts(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [activeTag, search]);

    return (
        <div className="container" style={{ paddingTop: 'var(--space-3xl)', paddingBottom: 'var(--space-3xl)' }}>
            {/* Header */}
            <div className="animate-fade-in-up" style={{ marginBottom: 'var(--space-2xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                    <span style={{ color: 'var(--accent-pink)', fontSize: '2rem' }}>$</span>
                    <h1 style={{ fontSize: '2.5rem', margin: 0 }}>
                        cat <span style={{ color: 'var(--accent-cyan)' }}>/var/log/thoughts</span>
                    </h1>
                </div>
                <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', paddingLeft: '32px' }}>
                    // 解密开发者思维碎片...
                </p>
            </div>

            {/* Controls */}
            <ScrollReveal delay={0.1} className="blog-controls" style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 'var(--space-lg)',
                marginBottom: 'var(--space-2xl)',
                alignItems: 'end'
            }}>
                {/* Search */}
                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)'
                    }}>
                        搜索_查询:
                    </label>
                    <div style={{ position: 'relative' }}>
                        <span style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--accent-cyan)',
                            fontFamily: 'var(--font-mono)',
                            pointerEvents: 'none'
                        }}>grep &gt;</span>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="输入关键字..."
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 70px',
                                background: 'rgba(5, 5, 16, 0.6)',
                                border: '1px solid var(--border-dim)',
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-mono)',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                borderRadius: 'var(--radius-sm)',
                            }}
                            onFocus={e => {
                                e.target.style.borderColor = 'var(--accent-cyan)';
                                e.target.style.boxShadow = 'var(--glow-cyan)';
                            }}
                            onBlur={e => {
                                e.target.style.borderColor = 'var(--border-dim)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '600px' }}>
                    <button
                        onClick={() => setActiveTag('')}
                        style={{
                            background: activeTag === '' ? 'var(--accent-cyan)' : 'transparent',
                            color: activeTag === '' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                            border: activeTag === '' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-dim)',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.8rem',
                            transition: 'all 0.2s',
                        }}
                    >
                        [ 全部 ]
                    </button>
                    {tags.map(tag => (
                        <button
                            key={tag.id}
                            onClick={() => setActiveTag(tag.slug)}
                            style={{
                                background: activeTag === tag.slug ? 'var(--accent-cyan)' : 'transparent',
                                color: activeTag === tag.slug ? 'var(--bg-primary)' : 'var(--text-secondary)',
                                border: activeTag === tag.slug ? '1px solid var(--accent-cyan)' : '1px solid var(--border-dim)',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.8rem',
                                transition: 'all 0.2s',
                            }}
                        >
                            {tag.name}
                        </button>
                    ))}
                </div>
            </ScrollReveal>

            {/* List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
                    <div className="animate-pulse" style={{ fontSize: '2rem', marginBottom: '1rem' }}>...</div>
                    <TypewriterText text="加载文件中..." speed={50} />
                </div>
            ) : posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-primary)' }}>
                    <div style={{ fontSize: '3rem', color: 'var(--accent-pink)', marginBottom: '1rem' }}>404</div>
                    <p style={{ fontFamily: 'var(--font-mono)' }}>该扇区未找到数据</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: 'var(--space-lg)',
                }}>
                    {posts.map((post, i) => (
                        <PostCard key={post.id} post={post} index={i} />
                    ))}
                </div>
            )}

            <style>{`
                @media (max-width: 900px) {
                    .blog-controls {
                        grid-template-columns: 1fr !important;
                    }
                    .blog-controls > div:last-child {
                        justify-content: flex-start !important;
                    }
                }
            `}</style>
        </div>
    );
}
