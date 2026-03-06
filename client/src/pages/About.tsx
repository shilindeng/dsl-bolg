import SEO from '../components/SEO';
import { siteConfig } from '../config/site';

export default function About() {
    return (
        <>
            <SEO title="关于" description="关于 DSL、工作方式，以及正在长期经营的技术与内容系统。" />

            <section className="section page-hero">
                <div className="container page-hero-shell">
                    <div>
                        <div className="eyebrow">关于 DSL</div>
                        <h1 className="section-title">{siteConfig.author.name}</h1>
                        <p className="lead">{siteConfig.author.summary}</p>
                    </div>
                    <div className="page-hero-badge mono">系统思维 / 界面表达 / AI 工作流</div>
                </div>
            </section>

            <section className="section">
                <div className="container editorial-grid">
                    <div className="feature-panel">
                        <div className="eyebrow">个人简介</div>
                        <h2 className="section-title">我在做什么</h2>
                        <p>{siteConfig.author.bio}</p>
                        <div className="metric-card">
                            <span className="muted mono">所在地</span>
                            <strong>{siteConfig.author.location.city}, {siteConfig.author.location.country}</strong>
                        </div>
                    </div>

                    <div className="feature-panel accent-panel">
                        <div className="eyebrow">工作方式</div>
                        <h2 className="section-title">我的方法</h2>
                        <div className="principle-list">
                            {siteConfig.principles.map((item) => (
                                <div key={item} className="metric-card">
                                    <strong>{item}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="section section-frame">
                <div className="container two-grid">
                    <div className="feature-panel">
                        <div className="eyebrow">能力侧重</div>
                        <h2 className="section-title">擅长解决的问题</h2>
                        <div className="principle-list">
                            {siteConfig.aboutCapabilities.map((item) => (
                                <div key={item} className="metric-card">
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="feature-panel">
                        <div className="eyebrow">当前重心</div>
                        <h2 className="section-title">最近持续打磨的方向</h2>
                        <div className="principle-list">
                            {siteConfig.currentFocus.map((item, index) => (
                                <div key={item} className="metric-card">
                                    <span className="muted mono">{String(index + 1).padStart(2, '0')}</span>
                                    <strong>{item}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
