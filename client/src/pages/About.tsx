import SEO from '../components/SEO';
import SiteIcon from '../components/SiteIcon';
import { siteConfig } from '../config/site';

export default function About() {
    return (
        <>
            <SEO title="关于" description="关于 DSL、工作方法、能力边界，以及适合合作的项目类型。" />

            <section className="section page-compact-hero about-brand-hero">
                <div className="container about-brand-grid">
                    <div className="about-brand-copy">
                        <span className="eyebrow">About {siteConfig.author.name}</span>
                        <h1 className="section-title">{siteConfig.author.name}</h1>
                        <p className="section-copy">{siteConfig.author.bio}</p>

                        <div className="about-positioning-band">
                            <span className="meta-pill emphasis">
                                <SiteIcon name="compass" size={13} />
                                <span>{siteConfig.author.positioning}</span>
                            </span>
                            <span className="muted">{siteConfig.author.manifesto}</span>
                        </div>

                        <div className="hero-actions">
                            <a href={`mailto:${siteConfig.email}`} className="btn btn-primary">
                                <SiteIcon name="mail" size={14} />
                                <span>发邮件联系</span>
                            </a>
                            <a href={siteConfig.socialLinks.find((item) => item.label === 'GitHub')?.href || 'https://github.com/shilindeng'} target="_blank" rel="noreferrer" className="btn btn-secondary">
                                <SiteIcon name="github" size={14} />
                                <span>查看 GitHub</span>
                            </a>
                        </div>
                    </div>

                    <div className="about-brand-side">
                        <div className="feature-panel about-manifesto-card">
                            <span className="eyebrow">Professional Frame</span>
                            <h2 className="section-title compact-title">我更像“把内容系统做成产品的人”</h2>
                            <p className="section-copy">
                                写作、设计、前端实现、后台结构、自动化链路和上线维护，对我来说不是分散的技能点，而是一套共同服务于“专业表达”的系统能力。
                            </p>
                        </div>

                        <div className="stat-grid about-stat-grid">
                            {siteConfig.brandProofs.map((item) => (
                                <div key={item.label} className="stat-card">
                                    <SiteIcon name={item.icon} size={16} />
                                    <strong>{item.value}</strong>
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="section section-border about-capability-section">
                <div className="container about-capability-grid">
                    <article className="feature-panel">
                        <span className="eyebrow">核心能力</span>
                        <h2 className="section-title compact-title">我通常如何提供价值</h2>
                        <div className="about-capability-cards">
                            {siteConfig.homeCapabilityCards.map((item) => (
                                <article key={item.title} className="about-capability-card">
                                    <span className="meta-pill">
                                        <SiteIcon name={item.icon} size={13} />
                                        <span>{siteConfig.author.name}</span>
                                    </span>
                                    <strong>{item.title}</strong>
                                    <p>{item.description}</p>
                                </article>
                            ))}
                        </div>
                    </article>

                    <article className="feature-panel">
                        <span className="eyebrow">工作方法</span>
                        <h2 className="section-title compact-title">我怎么判断、怎么输出、怎么交付</h2>
                        <div className="list-block">
                            {siteConfig.principles.map((item) => (
                                <div key={item} className="list-item">
                                    <SiteIcon name="check" size={15} />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="list-block">
                            {siteConfig.aboutCapabilities.map((item) => (
                                <div key={item} className="list-item">
                                    <SiteIcon name="spark" size={15} />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </article>
                </div>
            </section>

            <section className="section about-collaboration-section">
                <div className="container split-feature">
                    <div className="feature-panel about-collaboration-panel">
                        <span className="eyebrow">适合合作的项目</span>
                        <h2 className="section-title compact-title">如果你要升级公开形象、内容系统或 AI 工作流，这些场景更适合找我</h2>
                        <div className="about-collaboration-list">
                            {siteConfig.collaborationTracks.map((item, index) => (
                                <article key={item.title} className="about-collaboration-item">
                                    <span className="badge">0{index + 1}</span>
                                    <div>
                                        <strong>{item.title}</strong>
                                        <p>{item.description}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                    <div className="feature-panel about-fit-panel">
                        <span className="eyebrow">合作判断</span>
                        <div className="list-block">
                            {siteConfig.collaborationFit.map((item) => (
                                <div key={item} className="list-item">
                                    <SiteIcon name="check" size={14} />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="list-block about-not-fit-list">
                            {siteConfig.collaborationNotFit.map((item) => (
                                <div key={item} className="list-item">
                                    <SiteIcon name="warning" size={14} />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="section section-border">
                <div className="container split-feature">
                    <div className="feature-panel">
                        <span className="eyebrow">当前重心</span>
                        <div className="list-block">
                            {siteConfig.currentFocus.map((item, index) => (
                                <div key={item} className="list-item">
                                    <span className="badge">0{index + 1}</span>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="feature-panel about-contact-panel">
                        <span className="eyebrow">联系与合作</span>
                        <h2 className="section-title compact-title">如果你已经知道问题是什么，沟通会非常高效</h2>
                        <div className="list-block">
                            <div className="list-item">
                                <SiteIcon name="mail" size={14} />
                                <span>{siteConfig.email}</span>
                            </div>
                            <div className="list-item">
                                <SiteIcon name="compass" size={14} />
                                <span>{siteConfig.author.location.city}，{siteConfig.author.location.country}</span>
                            </div>
                            <div className="list-item">
                                <SiteIcon name="user" size={14} />
                                <span>{siteConfig.author.role}</span>
                            </div>
                        </div>
                        <div className="hero-actions">
                            <a href={`mailto:${siteConfig.email}`} className="btn btn-primary">
                                <SiteIcon name="send" size={14} />
                                <span>发送合作需求</span>
                            </a>
                            <a href={siteConfig.socialLinks.find((item) => item.label === 'X')?.href || 'https://x.com/shilin9527'} target="_blank" rel="noreferrer" className="btn btn-ghost">
                                <SiteIcon name="x" size={14} />
                                <span>去 X 关注</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

