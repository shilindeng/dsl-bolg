import { useState, useEffect } from 'react';

export default function Footer() {
    const [uptime, setUptime] = useState(0);

    useEffect(() => {
        // Mock uptime counter
        const start = Date.now();
        const interval = setInterval(() => {
            setUptime(Math.floor((Date.now() - start + 1000000000) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <footer style={{
            padding: 'var(--space-2xl) 0',
            borderTop: '1px solid var(--border-dim)',
            marginTop: 'var(--space-3xl)',
            background: 'var(--bg-secondary)',
            fontFamily: 'var(--font-mono)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Decorative Scanline */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '1px',
                background: 'var(--accent-cyan)',
                boxShadow: 'var(--glow-cyan)',
                opacity: 0.3,
            }} />

            <div className="container">
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 'var(--space-lg)',
                    marginBottom: 'var(--space-xl)',
                }}>
                    <div>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            marginBottom: 'var(--space-sm)',
                            fontFamily: 'var(--font-display)',
                            letterSpacing: '0.05em'
                        }}>
                            DSL_BLOG <span style={{ color: 'var(--accent-pink)' }}>v2.0</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '300px' }}>
                            // 系统状态: 在线<br />
                            // Vibe Coding: 已启用<br />
                            // 审美: 最大化
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-xl)' }}>
                        <div>
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-purple)', marginBottom: 'var(--space-md)' }}>[ 导航 ]</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {['首页', '博客', '项目', '关于'].map((item, i) => {
                                    const path = ['/', '/blog', '/projects', '/about'][i];
                                    return (
                                        <a key={item} href={path}
                                            style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
                                            className="hover-glitch"
                                        >
                                            &gt; {item}
                                        </a>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-purple)', marginBottom: 'var(--space-md)' }}>[ 网络 ]</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>&gt; GitHub</a>
                                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>&gt; Twitter</a>
                                <a href="mailto:hello@example.com" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>&gt; Email</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{
                    borderTop: '1px dashed var(--border-dim)',
                    paddingTop: 'var(--space-lg)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--space-md)',
                    opacity: 0.7,
                    fontSize: '0.75rem',
                }}>
                    <div>
                        © {new Date().getFullYear()} DSL System. 所有协议已安全连接。
                    </div>
                    <div>
                        系统运行时间: <span style={{ color: 'var(--accent-cyan)' }}>{uptime}</span>s
                    </div>
                </div>
            </div>
        </footer>
    );
}
