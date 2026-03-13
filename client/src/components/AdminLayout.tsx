import { Suspense, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { siteConfig } from '../config/site';
import { useAuth } from '../hooks/useAuth';
import CommandPalette from './CommandPalette';
import ScrollManager from './ScrollManager';
import SiteIcon from './SiteIcon';
import ThemeToggle from './ThemeToggle';

type AdminNavItem = {
    to: string;
    label: string;
    icon: Parameters<typeof SiteIcon>[0]['name'];
    description: string;
};

const navItems: AdminNavItem[] = [
    { to: '/admin/dashboard', label: '总控台', icon: 'grid', description: '数据、审核与运营状态' },
    { to: '/admin/homepage', label: '首页编排', icon: 'home', description: '运营位与模块配置' },
    { to: '/admin/newsletter', label: 'Newsletter', icon: 'inbox', description: '订阅者与 issue' },
    { to: '/admin/series', label: '专栏', icon: 'link', description: '专栏与章节顺序' },
    { to: '/editor', label: '写文章', icon: 'pen', description: '内容编辑器' },
];

function AdminLoadingFallback() {
    return (
        <div className="admin-loading">
            <div className="empty-state">正在加载后台页面...</div>
        </div>
    );
}

export default function AdminLayout() {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    const activePath = location.pathname;
    const activeTitle = useMemo(() => {
        const match = navItems.find((item) => activePath === item.to || activePath.startsWith(`${item.to}/`));
        return match?.label || '后台';
    }, [activePath]);

    const accountLabel = user?.name || user?.email || '管理员';

    return (
        <div className={`admin-app ${open ? 'is-nav-open' : ''}`}>
            <ScrollManager />

            <header className="admin-topbar">
                <div className="admin-topbar-inner">
                    <Link to="/admin/dashboard" className="admin-brand" aria-label="返回后台总控台">
                        <span className="admin-brand-mark mono">{siteConfig.shortName}</span>
                        <div className="admin-brand-copy">
                            <strong>{siteConfig.name}</strong>
                            <span>{activeTitle}</span>
                        </div>
                    </Link>

                    <div className="admin-topbar-actions">
                        <button
                            type="button"
                            className="action-chip admin-command desktop-only"
                            onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
                        >
                            <SiteIcon name="search" size={14} />
                            <span>快速检索</span>
                            <kbd>Ctrl K</kbd>
                        </button>

                        <Link to="/" className="action-chip desktop-only" title="回到公开站">
                            <SiteIcon name="external" size={14} />
                            <span>查看站点</span>
                        </Link>

                        <ThemeToggle />

                        <button type="button" className="action-chip desktop-only" onClick={() => void logout()} title="退出登录">
                            <SiteIcon name="close" size={14} />
                            <span>退出</span>
                        </button>

                        <button
                            type="button"
                            className="icon-button admin-mobile-toggle"
                            aria-label={open ? '关闭后台导航' : '打开后台导航'}
                            aria-expanded={open}
                            onClick={() => setOpen((value) => !value)}
                        >
                            <SiteIcon name={open ? 'close' : 'menu'} size={16} />
                        </button>
                    </div>
                </div>
            </header>

            {open ? <div className="admin-backdrop" onClick={() => setOpen(false)} /> : null}

            <div className="admin-layout">
                <aside className={`feature-panel admin-sidebar ${open ? 'is-open' : ''}`} aria-label="后台导航">
                    <div className="admin-nav-head">
                        <span className="eyebrow">Workbench</span>
                        <p className="muted">把运营动作收进一套稳定的工作台布局里。</p>
                    </div>

                    <nav className="admin-nav">
                        {navItems.map((item) => {
                            const active = activePath === item.to || activePath.startsWith(`${item.to}/`);
                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`admin-nav-link ${active ? 'is-active' : ''}`}
                                    title={item.description}
                                >
                                    <div className="admin-nav-link-copy">
                                        <SiteIcon name={item.icon} size={15} />
                                        <span>{item.label}</span>
                                    </div>
                                    <SiteIcon name="chevron-right" size={15} />
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="admin-sidebar-footer">
                        <div className="admin-user-chip">
                            <SiteIcon name="user" size={14} />
                            <span>{accountLabel}</span>
                        </div>
                        <div className="admin-sidebar-actions">
                            <Link to="/" className="btn btn-secondary">
                                <SiteIcon name="external" size={14} />
                                <span>回到站点</span>
                            </Link>
                            <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
                                <SiteIcon name="close" size={14} />
                                <span>退出</span>
                            </button>
                        </div>
                    </div>
                </aside>

                <main className="admin-main" aria-label="后台内容区">
                    <Suspense fallback={<AdminLoadingFallback />}>
                        <Outlet />
                    </Suspense>
                </main>
            </div>

            <CommandPalette isAdmin />
        </div>
    );
}

