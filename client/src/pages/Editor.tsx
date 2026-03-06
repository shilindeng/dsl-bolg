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

const DRAFT_VERSION = 'v3';

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
    const [uploadingInline, setUploadingInline] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
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

    const handleInlineImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.length) return;
        setUploadingInline(true);
        try {
            const result = await uploadImage(event.target.files[0]);
            setDraft((current) => ({
                ...current,
                content: `${current.content}\n\n![图片说明](${result.url})\n`,
            }));
            showToast(`正文图片上传成功，已保存到 ${result.storage.toUpperCase()}。`, 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '正文图片上传失败。', 'error');
        } finally {
            setUploadingInline(false);
            event.target.value = '';
        }
    };

    const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.length) return;
        setUploadingCover(true);
        try {
            const result = await uploadImage(event.target.files[0]);
            setDraft((current) => ({
                ...current,
                coverImage: result.url,
            }));
            showToast(`封面上传成功，已保存到 ${result.storage.toUpperCase()}。`, 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '封面上传失败。', 'error');
        } finally {
            setUploadingCover(false);
            event.target.value = '';
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
                <div className="container editor-shell">
                    <div className="editor-header">
                        <div>
                            <div className="eyebrow">文章编辑器</div>
                            <h1 className="section-title" style={{ marginTop: '1rem' }}>{id ? '编辑文章' : '新建文章'}</h1>
                            <p className="lead">封面、正文、标签、分类和发布状态都在一个界面里完成。</p>
                            <div className="hero-metrics">
                                <div className="metric-card">
                                    <span className="muted mono">PREVIEW</span>
                                    <strong>{previewMode ? '实时预览开启' : '聚焦编辑模式'}</strong>
                                </div>
                                <div className="metric-card">
                                    <span className="muted mono">AUTOSAVE</span>
                                    <strong>草稿自动保存在本地</strong>
                                </div>
                            </div>
                        </div>

                        <div className="editor-header-actions">
                            <button type="button" className="btn btn-ghost" onClick={() => setPreviewMode((current) => !current)}>
                                {previewMode ? '隐藏预览' : '显示预览'}
                            </button>
                            <button type="submit" form="editor-form" className="btn btn-primary" disabled={loading}>
                                {loading ? '保存中...' : '保存文章'}
                            </button>
                        </div>
                    </div>

                    <div className="editor-grid">
                        <form id="editor-form" onSubmit={handleSubmit} className="editor-main">
                            <div className="editor-card">
                                <label className="form-field">
                                    <span className="form-label">标题</span>
                                    <input className="form-input" value={draft.title} onChange={(event) => handleChange('title', event.target.value)} />
                                </label>

                                <div className="two-grid">
                                    <label className="form-field">
                                        <span className="form-label">自定义链接</span>
                                        <input className="form-input mono" value={draft.slug} onChange={(event) => handleChange('slug', event.target.value)} placeholder="可留空，系统自动生成" />
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
                                    <textarea className="form-textarea" style={{ minHeight: 120 }} value={draft.excerpt} onChange={(event) => handleChange('excerpt', event.target.value)} placeholder="这段内容会用于文章列表和 SEO 描述。" />
                                </label>
                            </div>

                            <div className="editor-card">
                                <div className="editor-card-head">
                                    <strong>封面与素材</strong>
                                    <div className="editor-upload-actions">
                                        <label className="btn btn-secondary" style={{ cursor: uploadingCover ? 'wait' : 'pointer' }}>
                                            {uploadingCover ? '上传封面中...' : '上传封面'}
                                            <input type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} />
                                        </label>
                                        <label className="btn btn-ghost" style={{ cursor: uploadingInline ? 'wait' : 'pointer' }}>
                                            {uploadingInline ? '插图上传中...' : '插入正文图片'}
                                            <input type="file" accept="image/*" onChange={handleInlineImageUpload} style={{ display: 'none' }} />
                                        </label>
                                    </div>
                                </div>

                                <label className="form-field">
                                    <span className="form-label">封面图片地址</span>
                                    <input className="form-input" value={draft.coverImage} onChange={(event) => handleChange('coverImage', event.target.value)} placeholder="https://... 或使用上方上传" />
                                </label>

                                {draft.coverImage ? (
                                    <div className="editor-cover-preview">
                                        <img src={draft.coverImage} alt={draft.title || '封面预览'} />
                                    </div>
                                ) : (
                                    <div className="empty-state editor-empty-cover">还没有设置封面。建议给重点文章配一张横向封面图。</div>
                                )}
                            </div>

                            <div className="editor-card">
                                <div className="editor-card-head">
                                    <strong>正文</strong>
                                    <div className="editor-inline-meta">
                                        <span className="command-hint">字数 {wordCount}</span>
                                        <span className="command-hint">预计阅读 {estimatedReadTime} 分钟</span>
                                    </div>
                                </div>

                                <label className="form-field">
                                    <span className="form-label">正文内容（Markdown）</span>
                                    <textarea className="form-textarea mono editor-content-area" value={draft.content} onChange={(event) => handleChange('content', event.target.value)} placeholder="# 开始写作" />
                                </label>
                            </div>
                        </form>

                        <aside className="editor-sidebar">
                            <div className="editor-card">
                                <div className="editor-card-head">
                                    <strong>发布设置</strong>
                                </div>

                                <label className="form-field">
                                    <span className="form-label">标签（逗号分隔）</span>
                                    <input className="form-input" value={draft.tags} onChange={(event) => handleChange('tags', event.target.value)} placeholder={availableTags.map((tag) => tag.name).slice(0, 4).join(', ')} />
                                </label>

                                <div className="editor-toggle-list">
                                    <label className="chip">
                                        <input type="checkbox" checked={draft.published} onChange={(event) => handleChange('published', event.target.checked)} />
                                        公开发布
                                    </label>
                                    <label className="chip">
                                        <input type="checkbox" checked={draft.featured} onChange={(event) => handleChange('featured', event.target.checked)} />
                                        设为精选
                                    </label>
                                </div>

                                <div className="editor-side-note">
                                    <span className="command-hint">草稿自动保存在本地</span>
                                </div>
                            </div>

                            {previewMode ? (
                                <div className="editor-card editor-preview-card">
                                    <div className="editor-card-head">
                                        <strong>实时预览</strong>
                                    </div>
                                    <div className="markdown-body">
                                        <h1>{draft.title || '文章标题预览'}</h1>
                                        {draft.coverImage ? <img src={draft.coverImage} alt={draft.title || 'cover'} style={{ borderRadius: 24 }} /> : null}
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.content || '正文预览会出现在这里。'}</ReactMarkdown>
                                    </div>
                                </div>
                            ) : null}
                        </aside>
                    </div>
                </div>
            </section>
        </>
    );
}
