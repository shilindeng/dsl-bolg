import SEO from '../components/SEO';
import { siteConfig } from '../config/site';

export default function About() {
    const capabilities = [
        '把个人站、内容站和品牌站整合成一套长期资产系统。',
        '在风格化视觉里保持内容可读性和专业感。',
        '把 AI 工作流真正接入研发、写作和迭代节奏。',
        '从界面到部署，保持项目可以长期维护。',
    ];

    return (
        <>
            <SEO title="关于" description="关于 DSL、工作方式与长期关注的问题域。" />

            <section className="section">
                <div className="container split-grid">
                    <div className="panel">
                        <div className="panel-body" style={{ display: 'grid', gap: '1rem' }}>
                            <div className="eyebrow">About DSL</div>
                            <h1 className="section-title">{siteConfig.author.name}</h1>
                            <p className="lead">{siteConfig.author.summary}</p>
                            <p style={{ margin: 0 }}>{siteConfig.author.bio}</p>
                            <div className="metric-card">
                                <span className="muted mono">Location</span>
                                <strong>{siteConfig.author.location.city}, {siteConfig.author.location.country}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-body" style={{ display: 'grid', gap: '1rem' }}>
                            <div className="eyebrow">Working Method</div>
                            <h2 style={{ fontSize: '1.8rem' }}>我如何做事</h2>
                            <div style={{ display: 'grid', gap: '0.85rem' }}>
                                {siteConfig.principles.map((item) => (
                                    <div key={item} className="metric-card">
                                        <strong>{item}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section-tight">
                <div className="container two-grid">
                    <div className="panel">
                        <div className="panel-body" style={{ display: 'grid', gap: '1rem' }}>
                            <div className="eyebrow">Capability</div>
                            <h2 style={{ fontSize: '1.8rem' }}>擅长解决的问题</h2>
                            <div style={{ display: 'grid', gap: '0.85rem' }}>
                                {capabilities.map((item) => (
                                    <div key={item} className="metric-card">
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-body" style={{ display: 'grid', gap: '1rem' }}>
                            <div className="eyebrow">Current Focus</div>
                            <h2 style={{ fontSize: '1.8rem' }}>最近在持续打磨的方向</h2>
                            <div className="metric-card">
                                <span className="muted mono">01</span>
                                <strong>个人品牌博客的专业化表达</strong>
                            </div>
                            <div className="metric-card">
                                <span className="muted mono">02</span>
                                <strong>AI 参与开发与写作的可复用工作流</strong>
                            </div>
                            <div className="metric-card">
                                <span className="muted mono">03</span>
                                <strong>高辨识度但不牺牲可读性的界面系统</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
