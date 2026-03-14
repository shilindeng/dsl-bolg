import { useEffect, useState } from 'react';
import {
    createCategory,
    createTag,
    deleteCategory,
    deleteTag,
    fetchCategories,
    fetchTags,
    updateCategory,
    updateTag,
    type Category,
    type Tag,
} from '../../api/client';
import SEO from '../../components/SEO';
import SiteIcon from '../../components/SiteIcon';
import { useToast } from '../../hooks/useToast';

export default function TaxonomyManagerPage() {
    const { showToast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryName, setCategoryName] = useState('');
    const [tagName, setTagName] = useState('');
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
    const [editingTagId, setEditingTagId] = useState<number | null>(null);
    const [categoryEditName, setCategoryEditName] = useState('');
    const [tagEditName, setTagEditName] = useState('');

    const loadTaxonomy = async () => {
        const [categoryResponse, tagResponse] = await Promise.all([fetchCategories(), fetchTags()]);
        setCategories(categoryResponse);
        setTags(tagResponse);
    };

    useEffect(() => {
        loadTaxonomy()
            .catch(() => showToast('分类与标签读取失败。', 'error'))
            .finally(() => setLoading(false));
    }, [showToast]);

    const handleCreateCategory = async (event: React.FormEvent) => {
        event.preventDefault();
        setSavingKey('create-category');
        try {
            await createCategory({ name: categoryName });
            setCategoryName('');
            await loadTaxonomy();
            showToast('分类已创建。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '分类创建失败。', 'error');
        } finally {
            setSavingKey(null);
        }
    };

    const handleCreateTag = async (event: React.FormEvent) => {
        event.preventDefault();
        setSavingKey('create-tag');
        try {
            await createTag({ name: tagName });
            setTagName('');
            await loadTaxonomy();
            showToast('标签已创建。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '标签创建失败。', 'error');
        } finally {
            setSavingKey(null);
        }
    };

    const handleUpdateCategory = async (id: number) => {
        setSavingKey(`update-category-${id}`);
        try {
            await updateCategory(id, { name: categoryEditName });
            setEditingCategoryId(null);
            setCategoryEditName('');
            await loadTaxonomy();
            showToast('分类已更新。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '分类更新失败。', 'error');
        } finally {
            setSavingKey(null);
        }
    };

    const handleUpdateTag = async (id: number) => {
        setSavingKey(`update-tag-${id}`);
        try {
            await updateTag(id, { name: tagEditName });
            setEditingTagId(null);
            setTagEditName('');
            await loadTaxonomy();
            showToast('标签已更新。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '标签更新失败。', 'error');
        } finally {
            setSavingKey(null);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        setSavingKey(`delete-category-${id}`);
        try {
            await deleteCategory(id);
            await loadTaxonomy();
            showToast('分类已删除。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '分类删除失败。', 'error');
        } finally {
            setSavingKey(null);
        }
    };

    const handleDeleteTag = async (id: number) => {
        setSavingKey(`delete-tag-${id}`);
        try {
            await deleteTag(id);
            await loadTaxonomy();
            showToast('标签已删除。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '标签删除失败。', 'error');
        } finally {
            setSavingKey(null);
        }
    };

    return (
        <>
            <SEO title="分类与标签管理" description="集中维护 taxonomy，避免脏标签直接暴露到前台。" />

            <section className="section">
                <div className="container admin-shell">
                    <header className="feature-panel">
                        <div className="section-heading">
                            <div>
                                <div className="eyebrow">Taxonomy</div>
                                <h1 className="section-title">分类与标签管理</h1>
                                <p className="section-copy">把 taxonomy 从隐式生成改成可维护资产，减少前台脏数据和 0 篇筛选项。</p>
                            </div>
                            <button type="button" className="btn btn-secondary" onClick={() => void loadTaxonomy()}>
                                <SiteIcon name="spark" size={14} />
                                <span>刷新</span>
                            </button>
                        </div>
                    </header>

                    <div className="dashboard-grid admin-workspace-grid-wide">
                        <section className="feature-panel">
                            <div className="editor-card-head">
                                <strong>分类</strong>
                                <span className="command-hint">{loading ? '加载中...' : `${categories.length} 个`}</span>
                            </div>

                            <form className="comment-form" onSubmit={handleCreateCategory}>
                                <label className="form-field">
                                    <span className="form-label">新建分类</span>
                                    <input className="form-input" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="例如：产品设计" required />
                                </label>
                                <button type="submit" className="btn btn-primary" disabled={savingKey === 'create-category'}>
                                    {savingKey === 'create-category' ? '创建中...' : '创建分类'}
                                </button>
                            </form>

                            {loading ? (
                                <div className="empty-state">正在读取分类...</div>
                            ) : (
                                <div className="admin-list">
                                    {categories.map((category) => (
                                        <article key={category.id} className="admin-row">
                                            <div className="admin-row-copy">
                                                {editingCategoryId === category.id ? (
                                                    <input className="form-input" value={categoryEditName} onChange={(event) => setCategoryEditName(event.target.value)} />
                                                ) : (
                                                    <strong>{category.name}</strong>
                                                )}
                                                <div className="admin-row-meta">
                                                    <span className="chip mono">{category.slug}</span>
                                                    <span className="chip">{category._count?.posts || 0} 篇</span>
                                                </div>
                                            </div>
                                            <div className="admin-row-actions">
                                                {editingCategoryId === category.id ? (
                                                    <>
                                                        <button type="button" className="btn btn-primary" disabled={savingKey === `update-category-${category.id}`} onClick={() => void handleUpdateCategory(category.id)}>保存</button>
                                                        <button type="button" className="btn btn-ghost" onClick={() => setEditingCategoryId(null)}>取消</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button type="button" className="btn btn-secondary" onClick={() => { setEditingCategoryId(category.id); setCategoryEditName(category.name); }}>重命名</button>
                                                        <button type="button" className="btn btn-ghost" disabled={savingKey === `delete-category-${category.id}`} onClick={() => void handleDeleteCategory(category.id)}>删除</button>
                                                    </>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="feature-panel">
                            <div className="editor-card-head">
                                <strong>标签</strong>
                                <span className="command-hint">{loading ? '加载中...' : `${tags.length} 个`}</span>
                            </div>

                            <form className="comment-form" onSubmit={handleCreateTag}>
                                <label className="form-field">
                                    <span className="form-label">新建标签</span>
                                    <input className="form-input" value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="例如：React" required />
                                </label>
                                <button type="submit" className="btn btn-primary" disabled={savingKey === 'create-tag'}>
                                    {savingKey === 'create-tag' ? '创建中...' : '创建标签'}
                                </button>
                            </form>

                            {loading ? (
                                <div className="empty-state">正在读取标签...</div>
                            ) : (
                                <div className="admin-list">
                                    {tags.map((tag) => (
                                        <article key={tag.id} className="admin-row">
                                            <div className="admin-row-copy">
                                                {editingTagId === tag.id ? (
                                                    <input className="form-input" value={tagEditName} onChange={(event) => setTagEditName(event.target.value)} />
                                                ) : (
                                                    <strong>{tag.name}</strong>
                                                )}
                                                <div className="admin-row-meta">
                                                    <span className="chip mono">{tag.slug}</span>
                                                    <span className="chip">{tag._count?.posts || 0} 篇</span>
                                                </div>
                                            </div>
                                            <div className="admin-row-actions">
                                                {editingTagId === tag.id ? (
                                                    <>
                                                        <button type="button" className="btn btn-primary" disabled={savingKey === `update-tag-${tag.id}`} onClick={() => void handleUpdateTag(tag.id)}>保存</button>
                                                        <button type="button" className="btn btn-ghost" onClick={() => setEditingTagId(null)}>取消</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button type="button" className="btn btn-secondary" onClick={() => { setEditingTagId(tag.id); setTagEditName(tag.name); }}>重命名</button>
                                                        <button type="button" className="btn btn-ghost" disabled={savingKey === `delete-tag-${tag.id}`} onClick={() => void handleDeleteTag(tag.id)}>删除</button>
                                                    </>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </section>
        </>
    );
}
