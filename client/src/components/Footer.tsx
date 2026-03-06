import { Link } from 'react-router-dom';
import { siteConfig } from '../config/site';

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="container site-footer-grid">
                <section style={{ display: 'grid', gap: '1rem' }}>
                    <div className="eyebrow">Digital Signature</div>
                    <div style={{ display: 'grid', gap: '0.6rem' }}>
                        <h2 style={{ fontSize: '1.8rem' }}>{siteConfig.name}</h2>
                        <p className="muted" style={{ margin: 0, maxWidth: '56ch' }}>
                            {siteConfig.author.summary}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {siteConfig.socialLinks.map((item) => (
                            item.href.startsWith('/') && item.router !== false ? (
                                <Link key={item.label} className="btn btn-secondary" to={item.href}>
                                    {item.label}
                                </Link>
                            ) : (
                                <a key={item.label} className="btn btn-secondary" href={item.href} target={item.external ? '_blank' : undefined} rel="noreferrer">
                                    {item.label}
                                </a>
                            )
                        ))}
                    </div>
                </section>

                <section style={{ display: 'grid', gap: '0.75rem' }}>
                    <strong className="mono">Navigation</strong>
                    {siteConfig.navigation.map((item) => (
                        <Link key={item.to} to={item.to} className="muted">
                            {item.label}
                        </Link>
                    ))}
                </section>

                <section style={{ display: 'grid', gap: '0.75rem' }}>
                    <strong className="mono">System</strong>
                    <a className="muted" href={siteConfig.rssPath}>RSS Feed</a>
                    <a className="muted" href="/sitemap.xml">Sitemap</a>
                    <span className="muted">Built for long-term publishing</span>
                </section>
            </div>
        </footer>
    );
}
