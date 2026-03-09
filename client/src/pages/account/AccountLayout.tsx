import { Link, Outlet, useLocation } from 'react-router-dom';
import SEO from '../../components/SEO';
import { useAuth } from '../../hooks/useAuth';

const accountNav = [
    { to: '/account', label: '账户资料', exact: true },
    { to: '/account/comments', label: '我的评论' },
    { to: '/account/bookmarks', label: '我的收藏' },
    { to: '/account/history', label: '阅读历史' },
];

export default function AccountLayout() {
    const location = useLocation();
    const { user, logout } = useAuth();

    return (
        <>
            <SEO title="会员中心" description="管理账户资料、收藏、评论和阅读历史。" />
            <section className="section account-shell">
                <div className="container account-layout">
                    <aside className="account-sidebar">
                        <div className="feature-panel">
                            <div className="eyebrow">Member</div>
                            <h1 className="section-title">{user?.name || '会员中心'}</h1>
                            <p className="muted">{user?.email}</p>
                            <div className="account-nav">
                                {accountNav.map((item) => {
                                    const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
                                    return (
                                        <Link key={item.to} to={item.to} className={`account-nav-link ${active ? 'is-active' : ''}`}>
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                            <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
                                退出登录
                            </button>
                        </div>
                    </aside>
                    <div className="account-content">
                        <Outlet />
                    </div>
                </div>
            </section>
        </>
    );
}
