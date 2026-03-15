import { useEffect, useState } from 'react';
import { createApiKey, fetchApiKeys, revokeApiKey, type ApiKeyRecord } from '../../api/client';
import SEO from '../../components/SEO';
import SiteIcon from '../../components/SiteIcon';
import { useToast } from '../../hooks/useToast';
import { formatDateTime } from '../../lib/format';

const defaultDocExamples = {
    curl: `curl -X PUT "https://www.shilin.tech/api/open/v1/posts/wechat/demo-article" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "示例文章",
    "contentFormat": "html",
    "content": "<h2>标题</h2><p>正文</p>",
    "deck": "用于首页与详情首屏的短导语",
    "excerpt": "可选，留空则由服务端自动生成",
    "published": true,
    "featured": false,
    "tags": ["API", "Automation"]
  }'`,
    node: `await fetch("https://www.shilin.tech/api/open/v1/media", {
  method: "POST",
  headers: { Authorization: "Bearer YOUR_API_KEY" },
  body: formData,
});`,
    powershell: `node .\\scripts\\sync-wechat-studio-to-blog.mjs --blog-base-url https://www.shilin.tech --blog-api-key YOUR_API_KEY`,
};

export default function ApiKeysPage() {
    const { showToast } = useToast();
    const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
    const [creatingApiKey, setCreatingApiKey] = useState(false);
    const [apiKeyName, setApiKeyName] = useState('Automation Publisher');
    const [latestApiKey, setLatestApiKey] = useState('');

    const reload = async () => {
        const data = await fetchApiKeys();
        setApiKeys(data);
    };

    useEffect(() => {
        reload().catch(() => showToast('API Key 数据加载失败。', 'error'));
    }, [showToast]);

    const handleCreateApiKey = async (event: React.FormEvent) => {
        event.preventDefault();
        setCreatingApiKey(true);
        try {
            const created = await createApiKey({
                name: apiKeyName.trim() || 'Automation Publisher',
                scopes: ['posts:write', 'media:write'],
            });
            setLatestApiKey(created.key);
            await reload();
            showToast('开放 API Key 已创建。明文只会显示这一次。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '创建 API Key 失败。', 'error');
        } finally {
            setCreatingApiKey(false);
        }
    };

    const handleRevokeApiKey = async (id: number) => {
        try {
            await revokeApiKey(id);
            await reload();
            showToast('API Key 已吊销。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '吊销 API Key 失败。', 'error');
        }
    };

    const copyLatestApiKey = async () => {
        if (!latestApiKey) return;
        await navigator.clipboard.writeText(latestApiKey);
        showToast('已复制最新 API Key。', 'success');
    };

    return (
        <>
            <SEO title="API Key 管理" description="管理开放发布 API Key 与接入说明。" />
            <section className="section">
                <div className="container admin-shell section-stack">
                    <header className="feature-panel">
                        <div className="section-heading">
                            <div>
                                <div className="eyebrow">Open API</div>
                                <h1 className="section-title">API Key 管理</h1>
                                <p className="section-copy">把开放发布凭证从 Dashboard 拆出，单独管理创建、吊销、最近使用时间和接入说明。</p>
                            </div>
                            <button type="button" className="btn btn-secondary" onClick={() => void reload()}>
                                <SiteIcon name="grid" size={14} />
                                <span>刷新</span>
                            </button>
                        </div>
                    </header>

                    <div className="dashboard-grid admin-manager-grid">
                        <form className="feature-panel" onSubmit={handleCreateApiKey}>
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
                            <button type="submit" className="btn btn-primary" disabled={creatingApiKey}>
                                {creatingApiKey ? '创建中...' : '创建 API Key'}
                            </button>
                            {latestApiKey ? (
                                <div className="metric-card latest-key-card">
                                    <span className="muted mono">最新密钥</span>
                                    <strong className="mono api-key-value">{latestApiKey}</strong>
                                    <button type="button" className="btn btn-ghost" onClick={copyLatestApiKey}>复制</button>
                                </div>
                            ) : null}
                        </form>

                        <div className="feature-panel">
                            <div className="editor-card-head">
                                <strong>Key 列表</strong>
                                <span className="command-hint">{apiKeys.length} 个</span>
                            </div>
                            <div className="admin-list compact-admin-list">
                                {apiKeys.length ? apiKeys.map((key) => (
                                    <div key={key.id} className="admin-row compact-admin-row">
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
                                            {!key.revokedAt ? <button type="button" className="btn btn-ghost" onClick={() => handleRevokeApiKey(key.id)}>吊销</button> : null}
                                        </div>
                                    </div>
                                )) : <div className="empty-state">还没有开放 API Key。</div>}
                            </div>
                        </div>
                    </div>

                    <section id="api-docs" className="feature-panel">
                        <div className="section-heading">
                            <div>
                                <div className="eyebrow">Integration Guide</div>
                                <h2 className="section-title">接入说明</h2>
                            </div>
                        </div>
                        <div className="list-block">
                            <div className="list-item">
                                <SiteIcon name="check" size={14} />
                                <span>鉴权：`Authorization: Bearer &lt;API_KEY&gt;`</span>
                            </div>
                            <div className="list-item">
                                <SiteIcon name="check" size={14} />
                                <span>Scope：`posts:write` 用于发文，`media:write` 用于图片上传</span>
                            </div>
                            <div className="list-item">
                                <SiteIcon name="check" size={14} />
                                <span>文章正文支持 `contentFormat: markdown | html`；新富文本内容建议传 `html`</span>
                            </div>
                        </div>
                        <div className="section-stack">
                            <div>
                                <strong>curl</strong>
                                <pre className="code-panel"><code>{defaultDocExamples.curl}</code></pre>
                            </div>
                            <div>
                                <strong>Node.js</strong>
                                <pre className="code-panel"><code>{defaultDocExamples.node}</code></pre>
                            </div>
                            <div>
                                <strong>PowerShell</strong>
                                <pre className="code-panel"><code>{defaultDocExamples.powershell}</code></pre>
                            </div>
                        </div>
                    </section>
                </div>
            </section>
        </>
    );
}
