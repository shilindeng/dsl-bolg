import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            showToast(error.message, 'error');
            setLoading(false);
        } else {
            showToast('Welcome back, Netrunner.', 'success');
            // Store session token manually for legacy api client if needed, 
            // but we should update client.ts to use supabase.auth.getSession()
            navigate('/blog');
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '80vh',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: 'var(--space-xl)',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 0 20px rgba(0, 255, 242, 0.1)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Cyberpunk decoration */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)',
                    animation: 'scanline 2s linear infinite'
                }} />

                <h1 className="gradient-text" style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                    SYSTEM ACCESS
                </h1>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--text-secondary)' }}>
                            IDENTITY (EMAIL)
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={inputStyle}
                            placeholder="user@net.com"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--text-secondary)' }}>
                            passcode
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={inputStyle}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'AUTHENTICATING...' : 'JACK IN'}
                    </button>
                </form>

                <div style={{ marginTop: 'var(--space-md)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Unauthorized access is a federal crime.
                </div>
            </div>

            <style>{`
                @keyframes scanline {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}

const inputStyle = {
    width: '100%',
    padding: 'var(--space-sm)',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    outline: 'none',
    transition: 'all 0.3s ease'
};
