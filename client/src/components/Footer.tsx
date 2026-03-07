import { Link } from 'react-router-dom';
import { siteConfig } from '../config/site';

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="container site-footer-grid">
                <section className="footer-intro">
                    <div className="eyebrow">站点尾声</div>
                    <div className="footer-heading">
                        <h2>{siteConfig.name}</h2>
                        <p className="muted">{siteConfig.author.summary}</p>
                    </div>
                    <div className="footer-badges">
                        <span className="chip mono">内容 / 界面 / 工程</span>
                        <span className="chip mono">长期维护</span>
                        <span className="chip mono">上海基准时区</span>
                    </div>
                </section>

                <section className="footer-stack">
                    <strong className="mono">导航</strong>
                    {siteConfig.navigation.map((item) => (
                        <Link key={item.to} to={item.to} className="footer-link">
                            {item.label}
                        </Link>
                    ))}
                </section>

                <section className="footer-stack">
                    <strong className="mono">链接</strong>
                    {siteConfig.socialLinks.map((item) => (
                        item.href.startsWith('/') && item.router !== false ? (
                            <Link key={item.label} to={item.href} className="footer-link">
                                {item.label}
                            </Link>
                        ) : (
                            <a
                                key={item.label}
                                href={item.href}
                                className="footer-link"
                                target={item.external ? '_blank' : undefined}
                                rel="noreferrer"
                            >
                                {item.label}
                            </a>
                        )
                    ))}
                    <a className="footer-link" href="/sitemap.xml">站点地图</a>
                </section>
            </div>
        </footer>
    );
}
