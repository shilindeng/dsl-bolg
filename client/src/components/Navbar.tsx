import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import GlitchText from './GlitchText';

const navLinks = [
    { path: '/', label: '首页', icon: '~/' },
    { path: '/blog', label: '博客', icon: 'grep' },
    { path: '/projects', label: '项目', icon: './' },
    { path: '/editor', label: '编辑', icon: 'vi' },
    { path: '/about', label: '关于', icon: 'man' },
];

export default function Navbar() {
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // user state will update via listener
    };

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [location]);

    const navLinkStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        fontSize: '0.85rem',
        fontWeight: 600,
        textDecoration: 'none',
        position: 'relative' as const,
        clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 20%)',
        transition: 'all 0.2s ease',
        background: 'transparent',
        cursor: 'pointer'
    };

    return (
        <nav className="navbar" style={{
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
            background: scrolled ? 'rgba(5, 5, 16, 0.95)' : 'transparent',
            backdropFilter: scrolled ? 'blur(10px)' : 'none',
            borderBottom: '1px solid var(--border-dim)',
            transition: 'all 0.3s ease',
            fontFamily: 'var(--font-mono)',
        }}>
            {/* Top Glow Line */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, var(--accent-cyan), transparent)',
                opacity: 0.5,
            }} />

            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', textDecoration: 'none' }}>
                <span className="blinking-cursor" style={{ color: 'var(--accent-pink)', fontSize: '1.2rem' }}>&gt;_</span>
                <GlitchText
                    text="DSL_BLOG"
                    style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-primary)' }}
                />
            </Link>

            {/* Desktop Nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="nav-links-desktop">
                {navLinks.map(link => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                                background: isActive ? 'var(--accent-cyan)' : 'transparent',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                textDecoration: 'none',
                                position: 'relative',
                                clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 20%)',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                if (!isActive) {
                                    e.currentTarget.style.color = 'var(--accent-cyan)';
                                    e.currentTarget.style.textShadow = 'var(--glow-cyan)';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isActive) {
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                    e.currentTarget.style.textShadow = 'none';
                                }
                            }}
                        >
                            <span style={{ opacity: 0.5, fontSize: '0.8em' }}>{link.icon}</span>
                            <span>{link.label}</span>
                        </Link>
                    );
                })}

                {/* Auth Button */}
                {user ? (
                    <button
                        onClick={handleLogout}
                        style={{
                            ...navLinkStyle,
                            border: '1px solid var(--accent-pink)',
                            color: 'var(--accent-pink)',
                            marginLeft: '10px'
                        }}
                    >
                        <span>[ 登出 ]</span>
                    </button>
                ) : (
                    <Link
                        to="/login"
                        style={{
                            ...navLinkStyle,
                            border: '1px solid var(--accent-cyan)',
                            color: 'var(--accent-cyan)',
                            marginLeft: '10px'
                        }}
                    >
                        <span>[ 登录 ]</span>
                    </Link>
                )}

                <div style={{ marginLeft: 'var(--space-md)' }}>
                    <ThemeToggle />
                </div>
            </div>

            {/* Mobile Button */}
            <button
                className="mobile-menu-btn"
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{
                    display: 'none',
                    background: 'none',
                    border: '1px solid var(--accent-cyan)',
                    color: 'var(--accent-cyan)',
                    padding: '8px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                }}
            >
                {mobileOpen ? '[ CLOSE ]' : '[ MENU ]'}
            </button>

            {/* Mobile Nav */}
            {mobileOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'var(--navbar-height)',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-primary)',
                    borderBottom: '1px solid var(--border-bright)',
                    padding: 'var(--space-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    animation: 'scanline 0.3s ease-out forwards',
                }}>
                    {navLinks.map((link, i) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={{
                                display: 'block',
                                padding: '12px',
                                borderLeft: location.pathname === link.path ? '2px solid var(--accent-pink)' : '2px solid transparent',
                                color: location.pathname === link.path ? 'var(--accent-pink)' : 'var(--text-primary)',
                                background: 'rgba(255, 255, 255, 0.03)',
                                fontFamily: 'var(--font-mono)',
                                animation: `fade-in-up 0.3s ease forwards ${i * 0.05}s`,
                                opacity: 0,
                            }}
                        >
                            <span style={{ color: 'var(--accent-cyan)', marginRight: '10px' }}>&gt;</span>
                            {link.icon} {link.label}
                        </Link>
                    ))}
                    <div style={{ marginTop: 'var(--space-md)' }}>
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
