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
                <Link to="/" className="site-nav-brand" aria-label="返回首页">
                    <span className="brand-mark mono">DSL</span>
                    <div className="brand-copy">
                        <strong>赛博编辑实验室</strong>
                        <span>{siteConfig.author.role}</span>
                    </div>
                </Link>

                <nav className="site-nav-links" aria-label="主导航">
                    {navLinks}
                </nav>

                <div className="site-nav-actions">
                    <span className="nav-status mono" aria-hidden="true">
                        站点在线 / WWW.SHILIN.TECH
                    </span>

                    <span className="command-hint nav-command" aria-hidden="true">
                        <kbd>Ctrl</kbd>
                        <kbd>K</kbd>
                    </span>

                    {isAdmin ? (
                        <>
                            <Link to="/editor" className="btn btn-ghost">写文章</Link>
                            <Link to="/admin/dashboard" className="btn btn-secondary">控制台</Link>
                        </>
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
                        <span className="mono">{open ? 'CLOSE' : 'MENU'}</span>
                    </button>
                </div>
            </div>

            {open ? (
                <div className="container">
                    <div className="menu-sheet">
                        <div className="menu-sheet-body">
                            {navLinks}
                            {isAdmin ? <Link to="/editor" className="site-nav-link">新建文章</Link> : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </header>
    );
}
