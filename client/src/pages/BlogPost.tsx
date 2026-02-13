import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { fetchPost, likePost, fetchComments, type Post, type Comment } from '../api/client';
import ReadingProgress from '../components/ReadingProgress';
import GlitchText from '../components/GlitchText';
import Comments from '../components/Comments';
import SEO from '../components/SEO';
import LazyImage from '../components/LazyImage';
import 'highlight.js/styles/atom-one-dark.css';

export default function BlogPost() {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [liking, setLiking] = useState(false);

    useEffect(() => {
        if (slug) {
            fetchPost(slug)
                .then(data => {
                    setPost(data);
                    // Initial comments might come from post include, or fetch separately
                    if (data.comments) setComments(data.comments);
                    // If backend doesn't return deep comments, might need fetchComments(data.id)
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [slug]);

    const handleLike = async () => {
        if (!post || liking) return;
        setLiking(true);
        try {
            const { likes } = await likePost(post.slug);
            setPost(prev => prev ? { ...prev, meta: { ...prev.meta!, likes } } : null);
        } catch (error) {
            console.error('Like failed', error);
        } finally {
            setLiking(false);
        }
    };

    const handleCommentAdded = (newComment: Comment) => {
        // Typically new comments are pending approval, so maybe don't show immediately?
        // Or show with a "Pending" flag. 
        // For now, let's assume if it came back it might be visible or we just alert user.
        // Actually the API returns the comment.
    };

    if (loading) return (
        <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <div className="animate-spin" style={{
                width: '40px', height: '40px', border: '2px solid var(--accent-cyan)', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '20px'
            }} />
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>正在解密...</div>
        </div>
    );

    if (!post) return (
        <div className="container" style={{ padding: 'var(--space-3xl) 0', textAlign: 'center' }}>
            <h1 style={{ color: 'var(--accent-pink)', fontSize: '4rem' }}>404</h1>
            <p style={{ fontFamily: 'var(--font-mono)' }}>文件损坏或丢失</p>
            <Link to="/blog" className="btn" style={{ marginTop: 'var(--space-lg)' }}>&lt; 返回</Link>
        </div>
    );

    return (
        <div style={{ position: 'relative' }}>
            <SEO
                title={post.title}
                description={post.excerpt || post.content.substring(0, 150)}
                image={post.coverImage}
                type="article"
            />
            <ReadingProgress />

            <div className="container" style={{ paddingTop: 'var(--space-3xl)', paddingBottom: 'var(--space-3xl)', maxWidth: '900px' }}>
                <Link to="/blog" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--text-muted)',
                    marginBottom: 'var(--space-xl)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem'
                }}>
                    &lt; cd .. (返回)
                </Link>

                <article className="animate-fade-in-up">
                    <header style={{ marginBottom: 'var(--space-2xl)', borderBottom: '1px solid var(--border-dim)', paddingBottom: 'var(--space-lg)' }}>
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--accent-cyan)',
                            marginBottom: 'var(--space-sm)',
                            display: 'flex',
                            gap: 'var(--space-md)',
                            fontSize: '0.9rem'
                        }}>
                            <span>
                                日期: {new Date(post.createdAt).toISOString().split('T')[0]}
                            </span>
                            <span>// 日志_ID: {post.id}</span>
                            <span>👀 {post.meta?.views || 0}</span>
                        </div>

                        <h1 style={{
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                            color: 'var(--text-primary)',
                            marginBottom: 'var(--space-md)',
                            lineHeight: 1.2
                        }}>
                            <GlitchText text={post.title} as="span" />
                        </h1>

                        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                            {post.tags.map(tag => (
                                <span key={tag.id} className="tag">{tag.name}</span>
                            ))}
                        </div>
                    </header>

                    <div className="markdown-body">
                        <Markdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                                code(props) {
                                    const { children, className, node, ...rest } = props
                                    const match = /language-(\w+)/.exec(className || '')
                                    return match ? (
                                        <div style={{ position: 'relative', marginTop: '1.5em', marginBottom: '1.5em' }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '-24px',
                                                left: '0',
                                                background: 'var(--bg-tertiary)',
                                                border: '1px solid var(--border-dim)',
                                                borderBottom: 'none',
                                                padding: '2px 10px',
                                                fontSize: '0.75rem',
                                                color: 'var(--text-muted)',
                                                fontFamily: 'var(--font-mono)',
                                                borderTopLeftRadius: '4px',
                                                borderTopRightRadius: '4px',
                                                textTransform: 'uppercase'
                                            }}>
                                                {match[1]}
                                            </div>
                                            <code {...rest} className={className}>
                                                {children}
                                            </code>
                                        </div>
                                    ) : (
                                        <code {...rest} className={className} style={{ color: 'var(--accent-pink)', background: 'rgba(255,0,85,0.1)', padding: '2px 4px', borderRadius: '3px' }}>
                                            {children}
                                        </code>
                                    )
                                },
                                img: ({ node, ...props }) => (
                                    <div style={{ border: '1px solid var(--border-dim)', padding: '5px', background: 'var(--bg-secondary)', margin: '2rem 0' }}>
                                        <LazyImage {...props} src={props.src || ''} alt={props.alt} />
                                    </div>
                                ),
                                blockquote: ({ node, ...props }) => (
                                    <blockquote style={{
                                        borderLeft: '4px solid var(--accent-purple)',
                                        background: 'rgba(189, 0, 255, 0.05)',
                                        padding: '1rem',
                                        margin: '1.5rem 0',
                                        color: 'var(--text-secondary)'
                                    }} {...props} />
                                )
                            }}
                        >
                            {post.content}
                        </Markdown>
                    </div>

                    <div style={{
                        marginTop: 'var(--space-3xl)',
                        paddingTop: 'var(--space-lg)',
                        borderTop: '1px solid var(--border-dim)',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                    }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <button
                                onClick={handleLike}
                                disabled={liking}
                                className="btn"
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--accent-pink)',
                                    color: 'var(--accent-pink)',
                                    fontSize: '1.2rem',
                                    padding: '0.5rem 2rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                            >
                                <span>❤️</span>
                                <span>{post.meta?.likes || 0}</span>
                            </button>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)' }}>*** 传输结束 ***</div>
                    </div>

                    <Comments
                        postId={post.id}
                        comments={comments}
                        onCommentAdded={handleCommentAdded}
                    />
                </article>
            </div>
        </div>
    );
}
