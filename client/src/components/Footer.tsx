import { Link } from 'react-router-dom';
import { siteConfig } from '../config/site';
import NewsletterSignup from './NewsletterSignup';
import SiteIcon from './SiteIcon';

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="container site-footer-grid">
                <section className="footer-intro">
                    <span className="eyebrow">Research Notes</span>
                    <h2>{siteConfig.name}</h2>
                    <p>{siteConfig.author.summary}</p>
                    <div className="footer-badges">
                        <span className="chip">
                            <SiteIcon name="pen" size={13} />
                            <span>研究</span>
                        </span>
                        <span className="chip">
                            <SiteIcon name="grid" size={13} />
                            <span>结构</span>
                        </span>
                        <span className="chip">
                            <SiteIcon name="code" size={13} />
                            <span>实现</span>
                        </span>
                    </div>
                </section>

                <section className="footer-stack">
                    <strong>导航</strong>
                    {siteConfig.navigation.map((item) => (
                        <Link key={item.to} to={item.to} className="footer-link" title={item.description}>
                            <SiteIcon name={item.icon} size={14} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </section>

                <section className="footer-stack">
                    <strong>链接</strong>
                    {siteConfig.socialLinks.map((item) =>
                        item.href.startsWith('/') && item.router !== false ? (
                            <Link key={item.label} to={item.href} className="footer-link" title={item.description}>
                                <SiteIcon name={item.icon} size={14} />
                                <span>{item.label}</span>
                            </Link>
                        ) : (
                            <a
                                key={item.label}
                                href={item.href}
                                className="footer-link"
                                title={item.description}
                                target={item.external ? '_blank' : undefined}
                                rel={item.external ? 'noreferrer' : undefined}
                            >
                                <SiteIcon name={item.icon} size={14} />
                                <span>{item.label}</span>
                            </a>
                        ),
                    )}
                </section>

                <section className="footer-stack footer-subscribe">
                    <strong>订阅更新</strong>
                    <p>接收新的长文、项目复盘和工作流迭代记录。</p>
                    <NewsletterSignup source="footer" compact />
                </section>
            </div>
        </footer>
    );
}
