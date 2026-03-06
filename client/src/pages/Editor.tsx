import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    createPost,
    fetchCategories,
    fetchPost,
    fetchTags,
    updatePost,
    uploadImage,
    type Category,
    type Tag,
} from '../api/client';
import SEO from '../components/SEO';
import { useToast } from '../hooks/useToast';

const DRAFT_VERSION = 'v2';

interface DraftState {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string;
    published: boolean;
    featured: boolean;
    tags: string;
    categoryId: string;
}

const emptyDraft: DraftState = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    published: false,
    featured: false,
    tags: '',
    categoryId: '',
};

export default function Editor() {
    const { slug: editingSlug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [draft, setDraft] = useState<DraftState>(emptyDraft);
    const [id, setId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewMode, setPreviewMode] = useState(true);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
    const [ready, setReady] = useState(false);
    const storageKey = `dsl-blog-editor:${DRAFT_VERSION}:${editingSlug || 'new'}`;

    useEffect(() => {
        let cancelled = false;

        Promise.all([fetchTags(), fetchCategories()])
            .then(([tags, categories]) => {
                if (cancelled) return;
                setAvailableTags(tags);
                setAvailableCategories(categories);
            })
            .catch(() => undefined);

        async function bootstrap() {
            if (!editingSlug) {
                const localDraft = localStorage.getItem(storageKey);
                if (localDraft) {
                    try {
                        const parsed = JSON.parse(localDraft) as DraftState;
                        if (!cancelled) setDraft(parsed);
                    } catch {
                        localStorage.removeItem(storageKey);
                    }
                }
            }

            if (editingSlug) {
                try {
                    const post = await fetchPost(editingSlug);
                    if (cancelled) return;
                    setId(post.id);
                    setDraft({
                        title: post.title,
                        slug: post.slug,
                        excerpt: post.excerpt,
                        content: post.content,
                        coverImage: post.coverImage || '',
                        published: post.published,
                        featured: post.featured,
                        tags: post.tags.map((tag) => tag.name).join(', '),
                        categoryId: post.category?.id ? String(post.category.id) : '',
                    });
                } catch {
                    showToast('文章加载失败。', 'error');
                }
            }

            if (!cancelled) {
                setReady(true);
            }
        }

        bootstrap();
        return () => {
            cancelled = true;
        };
    }, [editingSlug, showToast, storageKey]);

    useEffect(() => {
        if (!ready) return;
        localStorage.setItem(storageKey, JSON.stringify(draft));
    }, [draft, ready, storageKey]);

    const handleChange = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
        setDraft((current) => ({ ...current, [key]: value }));
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.length) return;
        setUploading(true);
        try {
            const result = await uploadImage(event.target.files[0]);
            setDraft((current) => ({
                ...current,
                content: `${current.content}\n\n![图片说明](${result.url})\n`,
            }));
            showToast(`图片上传成功，已存储到 ${result.storage.toUpperCase()}。`, 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '图片上传失败。', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!draft.title.trim() || !draft.content.trim()) {
            showToast('标题和正文不能为空。', 'error');
            return;
        }

        setLoading(true);
        const payload = {
            title: draft.title.trim(),
            slug: draft.slug.trim() || undefined,
            excerpt: draft.excerpt.trim(),
            content: draft.content,
            coverImage: draft.coverImage.trim() || null,
            published: draft.published,
            featured: draft.featured,
            tags: draft.tags.split(',').map((item) => item.trim()).filter(Boolean),
            categoryId: draft.categoryId ? Number(draft.categoryId) : null,
        };

        try {
            const post = id ? await updatePost(id, payload) : await createPost(payload);
            localStorage.removeItem(storageKey);
            showToast(id ? '文章已更新。' : '文章已创建。', 'success');
            navigate(`/blog/${post.slug}`);
        } catch (error) {
            showToast(error instanceof Error ? error.message : '保存失败。', 'error');
        } finally {
            setLoading(false);
        }
    };

    const wordCount = draft.content.trim().split(/\s+/).filter(Boolean).length;
    const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 220));

    return (
        <>
            <SEO title={id ? '编辑文章' : '新建文章'} description="管理员内容编辑器。" />

            <section className="section">
                <div className="container" style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div>
                            <div className="eyebrow">Publishing Console</div>
                            <h1 className="section-title" style={{ marginTop: '1rem' }}>{id ? '编辑文章' : '新建文章'}</h1>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setPreviewMode((current) => !current)}>
                                {previewMode ? '隐藏预览' : '显示预览'}
                            </button>
                            <button type="submit" form="editor-form" className="btn btn-primary" disabled={loading}>
                                {loading ? '保存中...' : '保存文章'}
                            </button>
                        </div>
                    </div>

                    <div className="split-grid">
                        <form id="editor-form" onSubmit={handleSubmit} className="panel">
                            <div className="panel-body" style={{ display: 'grid', gap: '1rem' }}>
                                <label className="form-field">
                                    <span className="form-label">标题</span>
                                    <input className="form-input" value={draft.title} onChange={(event) => handleChange('title', event.target.value)} />
                                </label>

                                <div className="two-grid">
                                    <label className="form-field">
                                        <span className="form-label">自定义 slug</span>
                                        <input className="form-input mono" value={draft.slug} onChange={(event) => handleChange('slug', event.target.value)} placeholder="可留空，后台自动生成" />
                                    </label>
                                    <label className="form-field">
                                        <span className="form-label">分类</span>
                                        <select className="form-select" value={draft.categoryId} onChange={(event) => handleChange('categoryId', event.target.value)}>
                                            <option value="">未分类</option>
                                            {availableCategories.map((category) => (
                                                <option key={category.id} value={category.id}>{category.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>

                                <label className="form-field">
                                    <span className="form-label">摘要</span>
                                    <textarea className="form-textarea" style={{ minHeight: 120 }} value={draft.excerpt} onChange={(event) => handleChange('excerpt', event.target.value)} placeholder="为列表页和 SEO 准备一段摘要..." />
                                </label>

                                <label className="form-field">
                                    <span className="form-label">正文（Markdown）</span>
                                    <textarea className="form-textarea mono" style={{ minHeight: 440 }} value={draft.content} onChange={(event) => handleChange('content', event.target.value)} placeholder="# 开始写作" />
                                </label>

                                <div className="two-grid">
                                    <label className="form-field">
                                        <span className="form-label">封面图地址</span>
                                        <input className="form-input" value={draft.coverImage} onChange={(event) => handleChange('coverImage', event.target.value)} placeholder="https://..." />
                                    </label>

                                    <label className="form-field">
                                        <span className="form-label">标签（逗号分隔）</span>
                                        <input className="form-input" value={draft.tags} onChange={(event) => handleChange('tags', event.target.value)} placeholder={availableTags.map((tag) => tag.name).slice(0, 4).join(', ')} />
                                    </label>
                                </div>

                                <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                                    <label className="chip">
                                        <input type="checkbox" checked={draft.published} onChange={(event) => handleChange('published', event.target.checked)} />
                                        公开发布
                                    </label>
                                    <label className="chip">
                                        <input type="checkbox" checked={draft.featured} onChange={(event) => handleChange('featured', event.target.checked)} />
                                        设为精选
                                    </label>
                                    <label className="btn btn-secondary" style={{ cursor: uploading ? 'wait' : 'pointer' }}>
                                        {uploading ? '上传中...' : '插入图片'}
                                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                    </label>
                                </div>

                                <div className="panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    <div className="panel-body" style={{ padding: '1rem 1.1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <span className="command-hint">字数 {wordCount}</span>
                                        <span className="command-hint">预计阅读 {estimatedReadTime} 分钟</span>
                                        <span className="command-hint">草稿自动保存</span>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {previewMode ? (
                            <div className="panel">
                                <div className="panel-body" style={{ display: 'grid', gap: '1rem' }}>
                                    <div className="eyebrow">Preview</div>
                                    <div className="markdown-body">
                                        <h1>{draft.title || '文章标题预览'}</h1>
                                        {draft.coverImage ? <img src={draft.coverImage} alt={draft.title || 'cover'} style={{ borderRadius: 24 }} /> : null}
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.content || '正文预览会出现在这里。'}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>
        </>
    );
}
