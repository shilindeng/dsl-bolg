import { useEffect, useState } from 'react';
import {
    createCategory,
    createTag,
    deleteCategory,
    deleteTag,
    fetchCategories,
    fetchTags,
    mergeTags,
    updateCategory,
    updateTag,
    type Category,
    type Tag,
} from '../../api/client';
import SEO from '../../components/SEO';
import SiteIcon from '../../components/SiteIcon';
import { useToast } from '../../hooks/useToast';

export default function TaxonomyPage() {
    const { showToast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [categoryName, setCategoryName] = useState('');
    const [tagName, setTagName] = useState('');
    const [mergeSourceId, setMergeSourceId] = useState('');
    const [mergeTargetId, setMergeTargetId] = useState('');

    const reload = async () => {
        const [categoryResponse, tagResponse] = await Promise.all([fetchCategories(), fetchTags()]);
        setCategories(categoryResponse);
        setTags(tagResponse);
    };

    useEffect(() => {
        reload().catch(() => showToast('分类标签数据加载失败。', 'error'));
    }, [showToast]);

    return (
        <>
            <SEO title="分类标签" description="管理博客分类与标签。" />
            <section className="section">
                <div className="container admin-shell section-stack">
                    <header className="feature-panel">
                        <div className="section-heading">
                            <div>
                                <div className="eyebrow">Taxonomy</div>
                                <h1 className="section-title">分类与标签</h1>
                                <p className="section-copy">补齐分类编辑、删除迁移、标签编辑、删除与合并，把前台筛选从一次性录入改成可运营资产。</p>
                            </div>
                        </div>
                    </header>

                    <div className="dashboard-grid admin-manager-grid">
                        <div className="feature-panel section-stack">
                            <div className="editor-card-head">
                                <strong>分类管理</strong>
                                <span className="command-hint">{categories.length} 个</span>
                            </div>
                            <form
                                className="hero-actions"
                                onSubmit={async (event) => {
                                    event.preventDefault();
                                    try {
                                        await createCategory({ name: categoryName });
                                        setCategoryName('');
                                        await reload();
                                        showToast('分类已创建。', 'success');
                                    } catch (error) {
                                        showToast(error instanceof Error ? error.message : '分类创建失败。', 'error');
                                    }
                                }}
                            >
                                <input className="form-input" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="新增分类名称" />
                                <button type="submit" className="btn btn-primary">新增分类</button>
                            </form>
                            <div className="admin-list">
                                {categories.map((category) => (
                                    <div key={category.id} className="admin-row">
                                        <div className="admin-row-copy">
                                            <strong>{category.name}</strong>
                                            <div className="admin-row-meta">
                                                <span className="chip mono">{category.slug}</span>
                                                <span className="chip">{category._count?.posts || 0} 篇文章</span>
                                            </div>
                                        </div>
                                        <div className="admin-row-actions">
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={async () => {
                                                    const nextName = window.prompt('修改分类名称', category.name);
                                                    if (!nextName) return;
                                                    try {
                                                        await updateCategory(category.id, { name: nextName });
                                                        await reload();
                                                        showToast('分类已更新。', 'success');
                                                    } catch (error) {
                                                        showToast(error instanceof Error ? error.message : '分类更新失败。', 'error');
                                                    }
                                                }}
                                            >
                                                编辑
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-ghost"
                                                onClick={async () => {
                                                    const replacement = category._count?.posts
                                                        ? window.prompt('输入替代分类 ID，用于迁移文章。留空则取消删除。', '')
                                                        : '';
                                                    if (category._count?.posts && replacement === null) return;
                                                    try {
                                                        await deleteCategory(category.id, replacement ? Number(replacement) : null);
                                                        await reload();
                                                        showToast('分类已删除。', 'success');
                                                    } catch (error) {
                                                        showToast(error instanceof Error ? error.message : '分类删除失败。', 'error');
                                                    }
                                                }}
                                            >
                                                删除
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="feature-panel section-stack">
                            <div className="editor-card-head">
                                <strong>标签管理</strong>
                                <span className="command-hint">{tags.length} 个</span>
                            </div>
                            <form
                                className="hero-actions"
                                onSubmit={async (event) => {
                                    event.preventDefault();
                                    try {
                                        await createTag({ name: tagName });
                                        setTagName('');
                                        await reload();
                                        showToast('标签已创建。', 'success');
                                    } catch (error) {
                                        showToast(error instanceof Error ? error.message : '标签创建失败。', 'error');
                                    }
                                }}
                            >
                                <input className="form-input" value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="新增标签名称" />
                                <button type="submit" className="btn btn-primary">新增标签</button>
                            </form>
                            <div className="admin-list">
                                {tags.map((tag) => (
                                    <div key={tag.id} className="admin-row">
                                        <div className="admin-row-copy">
                                            <strong>{tag.name}</strong>
                                            <div className="admin-row-meta">
                                                <span className="chip mono">{tag.slug}</span>
                                                <span className="chip">{tag._count?.posts || 0} 篇文章</span>
                                            </div>
                                        </div>
                                        <div className="admin-row-actions">
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={async () => {
                                                    const nextName = window.prompt('修改标签名称', tag.name);
                                                    if (!nextName) return;
                                                    try {
                                                        await updateTag(tag.id, { name: nextName });
                                                        await reload();
                                                        showToast('标签已更新。', 'success');
                                                    } catch (error) {
                                                        showToast(error instanceof Error ? error.message : '标签更新失败。', 'error');
                                                    }
                                                }}
                                            >
                                                编辑
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-ghost"
                                                onClick={async () => {
                                                    try {
                                                        await deleteTag(tag.id);
                                                        await reload();
                                                        showToast('标签已删除。', 'success');
                                                    } catch (error) {
                                                        showToast(error instanceof Error ? error.message : '标签删除失败。', 'error');
                                                    }
                                                }}
                                            >
                                                删除
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <section className="feature-panel">
                        <div className="section-heading">
                            <div>
                                <div className="eyebrow">Tag Merge</div>
                                <h2 className="section-title">合并脏标签</h2>
                            </div>
                        </div>
                        <div className="two-grid">
                            <label className="form-field">
                                <span className="form-label">源标签</span>
                                <select className="form-select" value={mergeSourceId} onChange={(event) => setMergeSourceId(event.target.value)}>
                                    <option value="">选择源标签</option>
                                    {tags.map((tag) => (
                                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="form-field">
                                <span className="form-label">目标标签</span>
                                <select className="form-select" value={mergeTargetId} onChange={(event) => setMergeTargetId(event.target.value)}>
                                    <option value="">选择目标标签</option>
                                    {tags.map((tag) => (
                                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <button
                            type="button"
                            className="btn btn-primary"
                            disabled={!mergeSourceId || !mergeTargetId}
                            onClick={async () => {
                                try {
                                    await mergeTags(Number(mergeSourceId), Number(mergeTargetId));
                                    setMergeSourceId('');
                                    setMergeTargetId('');
                                    await reload();
                                    showToast('标签已合并。', 'success');
                                } catch (error) {
                                    showToast(error instanceof Error ? error.message : '标签合并失败。', 'error');
                                }
                            }}
                        >
                            <SiteIcon name="link" size={14} />
                            <span>执行合并</span>
                        </button>
                    </section>
                </div>
            </section>
        </>
    );
}
