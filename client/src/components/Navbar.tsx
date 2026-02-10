import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useState, useEffect } from 'react';

const navLinks = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/blog', label: '博客', icon: '📝' },
    { path: '/projects', label: '项目', icon: '🛠️' },
    { path: '/editor', label: '写文章', icon: '✍️' },
    { path: '/about', label: '关于', icon: '👤' },
];

export default function Navbar() {
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [location]);

    return (
        <nav className="navbar glass" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 'var(--navbar-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--space-xl)',
            zIndex: 1000,
            borderRadius: 0,
            borderBottom: scrolled ? '1px solid var(--border-glass)' : '1px solid transparent',
            backdropFilter: scrolled ? 'blur(20px)' : 'blur(10px)',
            transition: 'all var(--transition-base)',
        }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', textDecoration: 'none' }}>
                <span style={{ fontSize: '1.5rem' }}>⚡</span>
                <span className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>DSL Blog</span>
            </Link>

            {/* 桌面端导航 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }} className="nav-links-desktop">
                {navLinks.map(link => (
                    <Link
                        key={link.path}
                        to={link.path}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-xs)',
                            padding: 'var(--space-sm) var(--space-md)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            color: location.pathname === link.path ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            background: location.pathname === link.path ? 'var(--bg-glass)' : 'transparent',
                            transition: 'all var(--transition-fast)',
                            textDecoration: 'none',
                        }}
                    >
                        <span>{link.icon}</span>
                        <span>{link.label}</span>
                    </Link>
                ))}
                <ThemeToggle />
            </div>

            {/* 移动端菜单按钮 */}
            <button
                className="mobile-menu-btn"
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{
                    display: 'none',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                }}
            >
                {mobileOpen ? '✕' : '☰'}
            </button>

            {/* 移动端导航 */}
            {mobileOpen && (
                <div className="glass mobile-nav" style={{
                    position: 'absolute',
                    top: 'var(--navbar-height)',
                    left: 0,
                    right: 0,
                    padding: 'var(--space-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-sm)',
                    borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                    animation: 'fadeIn 0.2s ease',
                }}>
                    {navLinks.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-sm)',
                                padding: 'var(--space-md)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '1rem',
                                color: location.pathname === link.path ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                background: location.pathname === link.path ? 'var(--bg-glass)' : 'transparent',
                                textDecoration: 'none',
                            }}
                        >
                            <span>{link.icon}</span>
                            <span>{link.label}</span>
                        </Link>
                    ))}
                    <div style={{ padding: 'var(--space-sm)' }}>
                        <ThemeToggle />
                    </div>
                </div>
            )}

            <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
        </nav>
    );
}
