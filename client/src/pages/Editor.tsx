import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchPost, createPost, updatePost, uploadImage, fetchTags, type Tag } from '../api/client';

export default function Editor() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const [id, setId] = useState<number | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [published, setPublished] = useState(false);
    const [tags, setTags] = useState<string>('');

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);

    useEffect(() => {
        fetchTags().then(setAvailableTags).catch(console.error);

        if (slug) {
            setLoading(true);
            fetchPost(slug)
                .then(post => {
                    setId(post.id);
                    setTitle(post.title);
                    setContent(post.content);
                    setExcerpt(post.excerpt);
                    setCoverImage(post.coverImage || '');
                    setPublished(post.published);
                    setTags(post.tags.map(t => t.name).join(', '));
                })
                .catch(() => alert('文章未找到'))
                .finally(() => setLoading(false));
        }
    }, [slug]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        try {
            const { url } = await uploadImage(e.target.files[0]);
            const imageMarkdown = `\n![image](${url})\n`;
            setContent(prev => prev + imageMarkdown);
        } catch (error) {
            alert('图片上传失败');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) {
            alert('标题和内容不能为空');
            return;
        }

        setLoading(true);
        try {
            const postData = {
                title,
                content,
                excerpt,
                coverImage,
                published,
                tags: tags.split(/[,，]/).map(t => t.trim()).filter(Boolean)
            };

            if (id) {
                await updatePost(id, postData);
                alert('文章更新成功');
            } else {
                await createPost(postData);
                alert('文章创建成功');
                navigate('/blog');
            }
        } catch (error) {
            alert(id ? '更新失败' : '创建失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: 'var(--space-3xl)', paddingBottom: 'var(--space-3xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h1 className="gradient-text" style={{ fontSize: '2rem' }}>
                    {id ? '✏️ 编辑文章' : '✨ 新建文章'}
                </h1>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    <button
                        type="button"
                        className={`btn ${previewMode ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setPreviewMode(!previewMode)}
                    >
                        {previewMode ? '编辑模式' : '预览模式'}
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? '保存中...' : '💾 保存文章'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: previewMode ? '1fr 1fr' : '1fr', gap: 'var(--space-lg)' }}>
                {/* 编辑区 */}
                <div style={{ display: previewMode ? 'none' : 'block' }}>
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>标题</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            style={inputStyle}
                            placeholder="输入文章标题..."
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>摘要</label>
                        <textarea
                            value={excerpt}
                            onChange={e => setExcerpt(e.target.value)}
                            style={{ ...inputStyle, minHeight: '80px' }}
                            placeholder="输入文章摘要（可选）..."
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                            <label>内容 (Markdown)</label>
                            <label style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                                {uploading ? '上传中...' : '📷 上传图片'}
                                <input type="file" onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />
                            </label>
                        </div>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            style={{ ...inputStyle, minHeight: '500px', fontFamily: 'var(--font-mono)' }}
                            placeholder="# 开始写作..."
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>标签 (逗号分隔)</label>
                            <input
                                type="text"
                                value={tags}
                                onChange={e => setTags(e.target.value)}
                                style={inputStyle}
                                placeholder="例如: React, Vibe Coding..."
                            />
                            <div style={{ marginTop: '5px', fontSize: '0.8em', color: 'var(--text-muted)' }}>
                                常用标签: {availableTags.slice(0, 5).map(t => t.name).join(', ')}
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>封面图 URL</label>
                            <input
                                type="text"
                                value={coverImage}
                                onChange={e => setCoverImage(e.target.value)}
                                style={inputStyle}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={published}
                                onChange={e => setPublished(e.target.checked)}
                            />
                            直接发布
                        </label>
                    </div>
                </div>

                {/* 预览区 */}
                <div style={{
                    display: previewMode ? 'block' : 'none',
                    padding: 'var(--space-lg)',
                    background: 'var(--bg-glass)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-glass)',
                    height: 'fit-content'
                }}>
                    <div className="markdown-body">
                        <h1>{title}</h1>
                        {coverImage && <img src={coverImage} alt="Cover" style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-md)' }} />}
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
}

const inputStyle = {
    width: '100%',
    padding: 'var(--space-sm)',
    background: 'var(--bg-glass)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s',
};
