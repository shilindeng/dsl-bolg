import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, requestLoginCode, verifyLoginCode } from '../api/client';
import SEO from '../components/SEO';
import TurnstileWidget from '../components/TurnstileWidget';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

export default function Login() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { setSession } = useAuth();
    const [mode, setMode] = useState<'reader' | 'admin'>('reader');
    const [readerEmail, setReaderEmail] = useState('');
    const [readerCode, setReaderCode] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [readerTurnstileToken, setReaderTurnstileToken] = useState('');
    const [adminTurnstileToken, setAdminTurnstileToken] = useState('');

    const handleAdminSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);

        try {
            const result = await login({ email: adminEmail, password, turnstileToken: adminTurnstileToken || undefined });
            setSession(result);
            showToast('管理员登录成功。', 'success');
            navigate('/admin/dashboard');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '登录失败。', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestCode = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        try {
            const result = await requestLoginCode({
                email: readerEmail,
                turnstileToken: readerTurnstileToken || undefined,
            });
            setCodeSent(true);
            showToast(result.previewCode ? `验证码已发送（开发预览：${result.previewCode}）` : '验证码已发送，请检查邮箱。', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '验证码发送失败。', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        try {
            const result = await verifyLoginCode({ email: readerEmail, code: readerCode });
            setSession(result);
            showToast('登录成功。', 'success');
            navigate('/account');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '验证码校验失败。', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <SEO title="登录" description="管理员登录与读者邮箱验证码登录入口。" />

            <section className="section login-section">
                <div className="container login-grid">
                    <div className="feature-panel accent-panel">
                        <div className="eyebrow">Access</div>
                        <h1 className="section-title">登录 DSL Blog</h1>
                        <p className="lead">
                            读者使用邮箱验证码进入会员中心，管理员继续使用密码登录控制台。
                        </p>
                        <div className="hero-metrics">
                            <div className="metric-card">
                                <span className="muted mono">READER</span>
                                <strong>邮箱验证码登录</strong>
                            </div>
                            <div className="metric-card">
                                <span className="muted mono">ADMIN</span>
                                <strong>密码 + Turnstile</strong>
                            </div>
                        </div>
                    </div>

                    <div className="login-card">
                        <div className="login-mode-switch">
                            <button type="button" className={`chip ${mode === 'reader' ? 'is-active' : ''}`} onClick={() => setMode('reader')}>读者登录</button>
                            <button type="button" className={`chip ${mode === 'admin' ? 'is-active' : ''}`} onClick={() => setMode('admin')}>管理员</button>
                        </div>

                        {mode === 'reader' ? (
                            <form onSubmit={codeSent ? handleVerifyCode : handleRequestCode} className="comment-form" data-testid="reader-login-form">
                                <div className="eyebrow">邮箱验证码</div>
                                <label className="form-field">
                                    <span className="form-label">邮箱</span>
                                    <input
                                        className="form-input"
                                        type="email"
                                        value={readerEmail}
                                        onChange={(event) => setReaderEmail(event.target.value)}
                                        required
                                    />
                                </label>
                                {codeSent ? (
                                    <label className="form-field">
                                        <span className="form-label">验证码</span>
                                        <input
                                            className="form-input mono"
                                            value={readerCode}
                                            onChange={(event) => setReaderCode(event.target.value)}
                                            placeholder="6 位验证码"
                                            required
                                        />
                                    </label>
                                ) : (
                                    <TurnstileWidget siteKey={turnstileSiteKey} onToken={setReaderTurnstileToken} />
                                )}
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? '处理中...' : codeSent ? '验证并登录' : '发送验证码'}
                                </button>
                                {codeSent ? <button type="button" className="btn btn-ghost" onClick={() => setCodeSent(false)}>重新发送</button> : null}
                            </form>
                        ) : (
                            <form onSubmit={handleAdminSubmit} className="comment-form" data-testid="admin-login-form">
                                <div className="eyebrow">管理员入口</div>
                                <label className="form-field">
                                    <span className="form-label">邮箱</span>
                                    <input
                                        className="form-input"
                                        data-testid="login-email-input"
                                        type="email"
                                        value={adminEmail}
                                        onChange={(event) => setAdminEmail(event.target.value)}
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

                                <TurnstileWidget siteKey={turnstileSiteKey} onToken={setAdminTurnstileToken} />

                                <button type="submit" className="btn btn-primary" data-testid="login-submit-button" disabled={loading}>
                                    {loading ? '验证中...' : '进入控制台'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
