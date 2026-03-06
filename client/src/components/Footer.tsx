import { Link } from 'react-router-dom';
import { siteConfig } from '../config/site';

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="container site-footer-grid">
                <section className="footer-intro">
                    <div className="eyebrow">Transmission Footer</div>
                    <div className="footer-heading">
                        <h2>{siteConfig.name}</h2>
                        <p className="muted">{siteConfig.author.summary}</p>
                    </div>
                    <div className="footer-badges">
                        <span className="chip mono">CYBER / EDITORIAL / ENGINEERING</span>
                        <span className="chip mono">BASED IN SHANGHAI</span>
                    </div>
                </section>

                <section className="footer-stack">
                    <strong className="mono">Navigation</strong>
                    {siteConfig.navigation.map((item) => (
                        <Link key={item.to} to={item.to} className="footer-link">
                            {item.label}
                        </Link>
                    ))}
                </section>

                <section className="footer-stack">
                    <strong className="mono">Links</strong>
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
                    <a className="footer-link" href="/sitemap.xml">Sitemap</a>
                </section>
            </div>
        </footer>
    );
}
