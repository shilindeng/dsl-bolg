import { useEffect, useState } from 'react';
import { createApiKey, fetchApiKeys, revokeApiKey, type ApiKeyRecord } from '../../api/client';
import SEO from '../../components/SEO';
import SiteIcon from '../../components/SiteIcon';
import { useToast } from '../../hooks/useToast';
import { formatDateTime } from '../../lib/format';

export default function ApiKeysManagerPage() {
    const { showToast } = useToast();
    const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [revokingId, setRevokingId] = useState<number | null>(null);
    const [apiKeyName, setApiKeyName] = useState('Automation Publisher');
    const [latestApiKey, setLatestApiKey] = useState('');

    const loadKeys = async () => {
        const response = await fetchApiKeys();
        setApiKeys(response);
    };

    useEffect(() => {
        loadKeys()
            .catch(() => showToast('API Key 列表读取失败。', 'error'))
            .finally(() => setLoading(false));
    }, [showToast]);

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        setCreating(true);
        try {
            const created = await createApiKey({
                name: apiKeyName.trim() || 'Automation Publisher',
                scopes: ['posts:write', 'media:write'],
            });
            setLatestApiKey(created.key);
            await loadKeys();
            showToast('开放 API Key 已创建。明文只会显示这一次。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '创建 API Key 失败。', 'error');
        } finally {
            setCreating(false);
        }
    };

    const handleRevoke = async (id: number) => {
        setRevokingId(id);
        try {
            await revokeApiKey(id);
            await loadKeys();
            showToast('API Key 已吊销。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '吊销 API Key 失败。', 'error');
        } finally {
            setRevokingId(null);
        }
    };

    const copyLatestApiKey = async () => {
        if (!latestApiKey) {
            return;
        }

        await navigator.clipboard.writeText(latestApiKey);
        showToast('已复制最新 API Key。', 'success');
    };

    return (
        <>
            <SEO title="API Key 管理" description="维护开放 API Key 与外部自动发文凭证。" />

            <section className="section">
                <div className="container admin-shell">
                    <header className="feature-panel">
                        <div className="section-heading">
                            <div>
                                <div className="eyebrow">Open API</div>
                                <h1 className="section-title">API Key 管理</h1>
                                <p className="section-copy">把开放发布凭证从 Dashboard 拆出来，便于审计和权限复核。</p>
                            </div>
                            <button type="button" className="btn btn-secondary" onClick={() => void loadKeys()}>
                                <SiteIcon name="spark" size={14} />
                                <span>刷新</span>
                            </button>
                        </div>
                    </header>

                    <div className="dashboard-grid admin-workspace-grid-wide">
                        <form className="feature-panel" onSubmit={handleCreate}>
                            <div className="editor-card-head">
                                <strong>创建 Key</strong>
                                <span className="command-hint">POSTS + MEDIA</span>
                            </div>

                            <label className="form-field">
                                <span className="form-label">Key 名称</span>
                                <input className="form-input" value={apiKeyName} onChange={(event) => setApiKeyName(event.target.value)} placeholder="Automation Publisher" />
                            </label>

                            <div className="metric-card api-scope-card">
                                <span className="muted mono">权限范围</span>
                                <strong>posts:write / media:write</strong>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={creating}>
                                {creating ? '创建中...' : '创建 API Key'}
                            </button>

                            {latestApiKey ? (
                                <div className="metric-card latest-key-card">
                                    <span className="muted mono">最新密钥</span>
                                    <strong className="mono api-key-value">{latestApiKey}</strong>
                                    <button type="button" className="btn btn-ghost" onClick={() => void copyLatestApiKey()}>复制</button>
                                </div>
                            ) : null}
                        </form>

                        <section className="feature-panel">
                            <div className="editor-card-head">
                                <strong>Key 列表</strong>
                                <span className="command-hint">{loading ? '加载中...' : `${apiKeys.length} 个`}</span>
                            </div>

                            {loading ? (
                                <div className="empty-state">正在读取 API Key...</div>
                            ) : apiKeys.length ? (
                                <div className="admin-list compact-admin-list">
                                    {apiKeys.map((key) => (
                                        <article key={key.id} className="admin-row compact-admin-row">
                                            <div className="admin-row-copy">
                                                <strong>{key.name}</strong>
                                                <div className="admin-row-meta">
                                                    <span className="chip mono">{key.keyPrefix}</span>
                                                    <span className="chip">{key.scopes.join(' / ')}</span>
                                                    {key.revokedAt ? <span className="chip">已吊销</span> : <span className="chip">有效</span>}
                                                </div>
                                            </div>
                                            <div className="admin-row-actions">
                                                <span className="command-hint">{key.lastUsedAt ? `最近使用 ${formatDateTime(key.lastUsedAt)}` : '尚未使用'}</span>
                                                {!key.revokedAt ? (
                                                    <button type="button" className="btn btn-ghost" disabled={revokingId === key.id} onClick={() => void handleRevoke(key.id)}>
                                                        {revokingId === key.id ? '吊销中...' : '吊销'}
                                                    </button>
                                                ) : null}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">还没有开放 API Key。</div>
                            )}
                        </section>
                    </div>
                </div>
            </section>
        </>
    );
}
