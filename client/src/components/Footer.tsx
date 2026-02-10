export default function Footer() {
    return (
        <footer style={{
            padding: 'var(--space-2xl) 0',
            borderTop: '1px solid var(--border-glass)',
            marginTop: 'var(--space-3xl)',
        }}>
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-md)',
            }}>
                <div>
                    <span className="gradient-text" style={{ fontWeight: 700 }}>DSL Blog</span>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 'var(--space-xs)' }}>
                        用代码构建未来 ⚡
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center' }}>
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                        style={{ color: 'var(--text-muted)', fontSize: '0.85rem', transition: 'color var(--transition-fast)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >GitHub</a>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                        style={{ color: 'var(--text-muted)', fontSize: '0.85rem', transition: 'color var(--transition-fast)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >Twitter</a>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', width: '100%', textAlign: 'center', marginTop: 'var(--space-md)' }}>
                    © {new Date().getFullYear()} DSL Blog. Vibe Coding with ❤️
                </p>
            </div>
        </footer>
    );
}
