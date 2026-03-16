import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { siteConfig } from '../config/site';
import { useAuth } from '../hooks/useAuth';
import { resolveAvatarUrl } from '../lib/avatars';
import SiteIcon from './SiteIcon';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
    isAdmin: boolean;
    isAuthenticated: boolean;
}

export default function Navbar({ isAdmin, isAuthenticated }: NavbarProps) {
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const drawerRef = useRef<HTMLDivElement | null>(null);
    const mobileToggleRef = useRef<HTMLButtonElement | null>(null);
    const { user, logout } = useAuth();

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 36);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const getFocusable = () => {
            const root = drawerRef.current;
            if (!root) {
                return [] as HTMLElement[];
            }

            const focusableSelector = [
                'a[href]',
                'button:not([disabled])',
                'input:not([disabled])',
                'select:not([disabled])',
                'textarea:not([disabled])',
                '[tabindex]:not([tabindex=\"-1\"])',
            ].join(',');

            return Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)).filter((item) => item.getClientRects().length > 0);
        };

        getFocusable()[0]?.focus();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false);
                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            const items = getFocusable();
            if (items.length === 0) {
                return;
            }

            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement as HTMLElement | null;

            if (event.shiftKey) {
                if (!active || active === first) {
                    event.preventDefault();
                    last.focus();
                }
                return;
            }

            if (active === last) {
                event.preventDefault();
                first.focus();
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
            mobileToggleRef.current?.focus();
        };
    }, [open]);

    const navLinks = useMemo(
        () =>
            siteConfig.navigation.map((item) => {
                const active = item.to === '/' ? location.pathname === item.to : location.pathname.startsWith(item.to);

                return (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={`site-nav-link ${active ? 'is-active' : ''}`}
                        title={item.description}
                    >
                        <SiteIcon name={item.icon} size={15} />
                        <span>{item.label}</span>
                    </Link>
                );
            }),
        [location.pathname],
    );

    const accountLabel = user?.name || '账户';

    const isHome = location.pathname === '/';

    return (
        <header
            className={[
                'site-nav',
                open ? 'is-open' : '',
                isScrolled ? 'is-scrolled' : '',
                isHome ? 'is-home' : 'is-subpage',
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <div className="container site-nav-inner">
                <Link to="/" className="site-nav-brand" aria-label="返回首页">
                    <span className="brand-mark mono">{siteConfig.shortName}</span>
                    <div className="brand-copy">
                        <strong>{siteConfig.name}</strong>
                        <span>{siteConfig.author.role}</span>
                    </div>
                </Link>

                <nav className="site-nav-links" aria-label="主导航" data-testid="primary-nav">
                    {navLinks}
                </nav>

                <div className="site-nav-actions">
                    <button
                        type="button"
                        className="action-chip desktop-only nav-command"
                        onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
                    >
                        <SiteIcon name="search" size={14} />
                        <span>快速检索</span>
                        <kbd>Ctrl K</kbd>
                    </button>

                    <span className="nav-status desktop-only">
                        <SiteIcon name="spark" size={14} />
                        <span>研究库在线</span>
                    </span>

                    {isAdmin ? (
                        <>
                            <Link to="/account" className="action-chip desktop-only">
                                <img className="nav-avatar" src={resolveAvatarUrl(user?.avatarUrl, user?.id)} alt={accountLabel} />
                                <span>{accountLabel}</span>
                            </Link>
                            <Link to="/editor" className="action-chip desktop-only">
                                <SiteIcon name="pen" size={14} />
                                <span>写文章</span>
                            </Link>
                            <Link to="/admin/series" className="action-chip desktop-only">
                                <SiteIcon name="link" size={14} />
                                <span>专栏</span>
                            </Link>
                            <Link to="/admin/dashboard" className="action-chip desktop-only">
                                <SiteIcon name="grid" size={14} />
                                <span>控制台</span>
                            </Link>
                        </>
                    ) : isAuthenticated ? (
                        <>
                            <Link to="/account" className="action-chip desktop-only">
                                <img className="nav-avatar" src={resolveAvatarUrl(user?.avatarUrl, user?.id)} alt={accountLabel} />
                                <span>{accountLabel}</span>
                            </Link>
                            <button type="button" className="action-chip desktop-only" onClick={() => void logout()}>
                                <SiteIcon name="close" size={14} />
                                <span>退出</span>
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="action-chip desktop-only">
                            <SiteIcon name="login" size={14} />
                            <span>登录</span>
                        </Link>
                    )}

                    <ThemeToggle />

                    <button
                        type="button"
                        className="icon-button mobile-only"
                        aria-label={open ? '关闭导航菜单' : '打开导航菜单'}
                        aria-controls="mobile-nav-drawer"
                        aria-expanded={open}
                        ref={mobileToggleRef}
                        onClick={() => setOpen((value) => !value)}
                    >
                        <SiteIcon name={open ? 'close' : 'menu'} size={16} />
                    </button>
                </div>
            </div>

            <div className={`nav-drawer-backdrop ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)} />

            {open ? (
                <div className="container nav-drawer-shell">
                    <div className="nav-drawer" id="mobile-nav-drawer" ref={drawerRef}>
                        <div className="drawer-head">
                            <span className="eyebrow">Navigation</span>
                            <p className="muted">从这里进入文章、项目与作者页。</p>
                        </div>

                        <nav className="drawer-links" aria-label="移动端导航">
                            {navLinks}
                        </nav>

                        <div className="drawer-actions">
                            {isAdmin ? (
                                <>
                                    <Link to="/account" className="action-chip">
                                        <img className="nav-avatar" src={resolveAvatarUrl(user?.avatarUrl, user?.id)} alt={accountLabel} />
                                        <span>{accountLabel}</span>
                                    </Link>
                                    <Link to="/editor" className="action-chip">
                                        <SiteIcon name="pen" size={14} />
                                        <span>写文章</span>
                                    </Link>
                                    <Link to="/admin/series" className="action-chip">
                                        <SiteIcon name="link" size={14} />
                                        <span>专栏</span>
                                    </Link>
                                    <Link to="/admin/dashboard" className="action-chip">
                                        <SiteIcon name="grid" size={14} />
                                        <span>控制台</span>
                                    </Link>
                                </>
                            ) : isAuthenticated ? (
                                <>
                                    <Link to="/account" className="action-chip">
                                        <img className="nav-avatar" src={resolveAvatarUrl(user?.avatarUrl, user?.id)} alt={accountLabel} />
                                        <span>{accountLabel}</span>
                                    </Link>
                                    <button type="button" className="action-chip" onClick={() => void logout()}>
                                        <SiteIcon name="close" size={14} />
                                        <span>退出登录</span>
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" className="action-chip">
                                    <SiteIcon name="login" size={14} />
                                    <span>登录</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </header>
    );
}
