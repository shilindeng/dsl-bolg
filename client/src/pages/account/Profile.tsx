import { useEffect, useMemo, useState } from 'react';
import { fetchAccountProfile, updateAccountProfile, type User } from '../../api/client';
import { useToast } from '../../hooks/useToast';
import { getPresetAvatars, resolveAvatarUrl } from '../../lib/avatars';

export default function AccountProfilePage() {
    const { showToast } = useToast();
    const [profile, setProfile] = useState<User | null>(null);
    const [form, setForm] = useState({ name: '', avatarUrl: '', bio: '' });
    const [saving, setSaving] = useState(false);
    const presetAvatars = useMemo(() => getPresetAvatars(), []);

    useEffect(() => {
        fetchAccountProfile()
            .then((data) => {
                setProfile(data);
                setForm({
                    name: data.name || '',
                    avatarUrl: data.avatarUrl || '',
                    bio: data.bio || '',
                });
            })
            .catch(() => setProfile(null));
    }, []);

    const resolvedPreviewAvatar = resolveAvatarUrl(form.avatarUrl, profile?.id);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        try {
            const next = await updateAccountProfile({
                name: form.name,
                avatarUrl: form.avatarUrl || null,
                bio: form.bio || null,
            });
            setProfile(next);
            localStorage.setItem('auth_user', JSON.stringify(next));
            window.dispatchEvent(new Event('auth-change'));
            showToast('资料已更新。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '资料更新失败。', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="feature-panel">
            <div className="section-heading">
                <div>
                    <div className="eyebrow">Profile</div>
                    <h2 className="section-title">账户资料</h2>
                </div>
            </div>
            <div className="hero-metrics">
                <div className="metric-card">
                    <span className="muted mono">MEMBERSHIP</span>
                    <strong>{profile?.role || 'reader'}</strong>
                </div>
                <div className="metric-card">
                    <span className="muted mono">EMAIL</span>
                    <strong>{profile?.email || '--'}</strong>
                </div>
            </div>
            <form className="comment-form" onSubmit={handleSubmit}>
                <div className="profile-avatar-panel">
                    <div className="profile-avatar-preview">
                        <img src={resolvedPreviewAvatar} alt="当前头像预览" />
                    </div>
                    <div className="profile-avatar-copy">
                        <strong>默认预置 5 个程序员头像</strong>
                        <p className="muted">不填自定义地址时，会自动按账号稳定分配一个默认头像。</p>
                    </div>
                </div>

                <div className="avatar-preset-grid">
                    {presetAvatars.map((avatar) => (
                        <button
                            key={avatar}
                            type="button"
                            className={`avatar-preset-card ${form.avatarUrl === avatar ? 'is-active' : ''}`}
                            onClick={() => setForm((current) => ({ ...current, avatarUrl: avatar }))}
                        >
                            <img src={avatar} alt="预置头像" />
                        </button>
                    ))}
                    <button
                        type="button"
                        className={`avatar-preset-card avatar-preset-reset ${form.avatarUrl ? '' : 'is-active'}`}
                        onClick={() => setForm((current) => ({ ...current, avatarUrl: '' }))}
                    >
                        <span>默认</span>
                    </button>
                </div>

                <label className="form-field">
                    <span className="form-label">名称</span>
                    <input className="form-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label className="form-field">
                    <span className="form-label">头像地址</span>
                    <input className="form-input" value={form.avatarUrl} onChange={(event) => setForm((current) => ({ ...current, avatarUrl: event.target.value }))} placeholder="https://... 或选择上方预置头像" />
                </label>
                <label className="form-field">
                    <span className="form-label">个人简介</span>
                    <textarea className="form-textarea" value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} />
                </label>
                <div className="hero-metrics">
                    <div className="metric-card">
                        <span className="muted mono">VERIFIED</span>
                        <strong>{profile?.emailVerifiedAt ? '已验证' : '未验证'}</strong>
                    </div>
                    <div className="metric-card">
                        <span className="muted mono">UPDATED</span>
                        <strong>{profile?.lastLoginAt ? '近期活跃' : '刚创建'}</strong>
                    </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? '保存中...' : '保存资料'}
                </button>
            </form>
        </div>
    );
}
