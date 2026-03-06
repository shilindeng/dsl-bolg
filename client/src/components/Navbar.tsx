import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { siteConfig } from '../config/site';

interface NavbarProps {
    isAdmin: boolean;
}

export default function Navbar({ isAdmin }: NavbarProps) {
    const location = useLocation();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    const navLinks = siteConfig.navigation.map((item) => {
        const active = item.to === '/' ? location.pathname === item.to : location.pathname.startsWith(item.to);
        return (
            <Link key={item.to} to={item.to} className={`site-nav-link ${active ? 'is-active' : ''}`}>
                {item.label}
            </Link>
        );
    });

    return (
        <header className="site-nav">
            <div className="container site-nav-inner">
                <Link to="/" style={{ display: 'grid', gap: '0.15rem' }}>
                    <strong className="mono" style={{ letterSpacing: '0.12em' }}>{siteConfig.shortName}_BLOG</strong>
                    <span className="muted" style={{ fontSize: '0.85rem' }}>
                        Personal brand, long-form writing, selective projects
                    </span>
                </Link>

                <nav className="site-nav-links" aria-label="主导航">
                    {navLinks}
                </nav>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="command-hint" aria-hidden="true">
                        <kbd>⌘</kbd>
                        <kbd>K</kbd>
                    </span>

                    {isAdmin ? (
                        <Link to="/admin/dashboard" className="btn btn-secondary">控制台</Link>
                    ) : (
                        <Link to="/login" className="btn btn-ghost">登录</Link>
                    )}

                    <ThemeToggle />

                    <button
                        type="button"
                        className="icon-button mobile-only"
                        aria-label="切换移动端菜单"
                        onClick={() => setOpen((value) => !value)}
                    >
                        <span className="mono">{open ? '×' : '≡'}</span>
                    </button>
                </div>
            </div>

            {open ? (
                <div className="container">
                    <div className="panel menu-sheet">
                        <div className="panel-body" style={{ display: 'grid', gap: '0.4rem' }}>
                            {navLinks}
                            {isAdmin ? <Link to="/editor" className="site-nav-link is-active">新建文章</Link> : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </header>
    );
}
