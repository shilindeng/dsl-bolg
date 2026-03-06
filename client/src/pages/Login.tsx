import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/client';
import SEO from '../components/SEO';
import TurnstileWidget from '../components/TurnstileWidget';
import { useToast } from '../hooks/useToast';

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

export default function Login() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);

        try {
            const result = await login({ email, password, turnstileToken: turnstileToken || undefined });
            localStorage.setItem('auth_token', result.token);
            localStorage.setItem('auth_user', JSON.stringify(result.user));
            window.dispatchEvent(new Event('auth-change'));
            showToast('管理员登录成功。', 'success');
            navigate('/admin/dashboard');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '登录失败。', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <SEO title="登录" description="管理员登录入口。" />

            <section className="section">
                <div className="container" style={{ display: 'grid', placeItems: 'center' }}>
                    <div className="panel" style={{ width: 'min(520px, 100%)' }}>
                        <div className="panel-body" style={{ display: 'grid', gap: '1.2rem' }}>
                            <div className="eyebrow">Admin Access</div>
                            <div style={{ display: 'grid', gap: '0.8rem' }}>
                                <h1 className="section-title" style={{ fontSize: '2.4rem' }}>管理员登录</h1>
                                <p className="muted" style={{ margin: 0 }}>
                                    这是内容发布和评论审核入口，不对公开访客开放。
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }} data-testid="login-form">
                                <label className="form-field">
                                    <span className="form-label">邮箱</span>
                                    <input
                                        className="form-input"
                                        data-testid="login-email-input"
                                        type="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        required
                                    />
                                </label>

                                <label className="form-field">
                                    <span className="form-label">密码</span>
                                    <input
                                        className="form-input"
                                        data-testid="login-password-input"
                                        type="password"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        required
                                    />
                                </label>

                                <TurnstileWidget siteKey={turnstileSiteKey} onToken={setTurnstileToken} />

                                <button type="submit" className="btn btn-primary" data-testid="login-submit-button" disabled={loading}>
                                    {loading ? '验证中...' : '进入控制台'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
