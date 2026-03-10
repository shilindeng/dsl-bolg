import { useState } from 'react';
import { subscribeNewsletter } from '../api/client';
import { useToast } from '../hooks/useToast';
import SiteIcon from './SiteIcon';
import TurnstileWidget from './TurnstileWidget';

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

interface NewsletterSignupProps {
    source?: string;
    compact?: boolean;
}

export default function NewsletterSignup({ source = 'website', compact = false }: NewsletterSignupProps) {
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!email.trim()) {
            showToast('请输入订阅邮箱。', 'error');
            return;
        }

        setLoading(true);
        try {
            await subscribeNewsletter({
                email: email.trim(),
                source,
                turnstileToken: turnstileToken || undefined,
            });
            showToast('订阅请求已提交，请前往邮箱确认。', 'success');
            setEmail('');
            setTurnstileToken('');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '订阅失败。', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className={`newsletter-form ${compact ? 'is-compact' : ''}`} onSubmit={handleSubmit}>
            <label className="form-field newsletter-field">
                <span className="form-label">邮箱订阅</span>
                <div className="input-with-icon">
                    <SiteIcon name="mail" size={15} />
                    <input
                        className="form-input"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="name@example.com"
                        required
                    />
                </div>
            </label>

            <TurnstileWidget siteKey={turnstileSiteKey} onToken={setTurnstileToken} />

            <button type="submit" className="btn btn-primary" disabled={loading}>
                <SiteIcon name={loading ? 'spark' : 'send'} size={15} />
                <span>{loading ? '提交中' : '订阅更新'}</span>
            </button>
        </form>
    );
}
