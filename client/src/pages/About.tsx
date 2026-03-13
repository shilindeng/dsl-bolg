import SEO from '../components/SEO';
import SiteIcon from '../components/SiteIcon';
import { siteConfig } from '../config/site';

export default function About() {
    return (
        <>
            <SEO title="关于" description="关于 DSL、工作方法，以及正在长期经营的内容与项目系统。" />

            <section className="section page-compact-hero">
                <div className="container page-compact-grid">
                    <div>
                        <span className="eyebrow">关于 {siteConfig.author.name}</span>
                        <h1 className="section-title">{siteConfig.author.name}</h1>
                        <p className="section-copy">{siteConfig.author.bio}</p>
                    </div>

                    <div className="stat-grid about-stat-grid">
                        <div className="stat-card">
                            <SiteIcon name="compass" size={16} />
                            <strong>{siteConfig.author.location.city}，{siteConfig.author.location.country}</strong>
                            <span>以{siteConfig.author.location.city}为基准城市进行长期创作与开发。</span>
                        </div>
                        <div className="stat-card">
                            <SiteIcon name="user" size={16} />
                            <strong>{siteConfig.author.role}</strong>
                            <span>内容、产品与工程放在同一套表达里经营。</span>
                        </div>
                        <div className="stat-card">
                            <SiteIcon name="mail" size={16} />
                            <strong>{siteConfig.email}</strong>
                            <span>适合聊内容系统、设计系统、AI 工作流与独立项目。</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section section-border">
                <div className="container two-column-grid">
                    <article className="feature-panel">
                        <span className="eyebrow">工作方式</span>
                        <h2 className="section-title compact-title">我的方法</h2>
                        <div className="list-block">
                            {siteConfig.principles.map((item) => (
                                <div key={item} className="list-item">
                                    <SiteIcon name="check" size={15} />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="feature-panel">
                        <span className="eyebrow">擅长问题</span>
                        <h2 className="section-title compact-title">我通常解决什么</h2>
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

            <section className="section">
                <div className="container split-feature">
                    <div className="feature-panel">
                        <span className="eyebrow">当前重心</span>
                        <div className="section-head">
                            <div>
                                <h2 className="section-title compact-title">最近持续打磨的方向</h2>
                                <p className="section-copy">这三条主线，决定了公开站接下来几轮迭代的边界。</p>
                            </div>
                        </div>

                        <div className="stat-grid">
                            {siteConfig.currentFocus.map((item, index) => (
                                <div key={item} className="stat-card">
                                    <span className="badge">0{index + 1}</span>
                                    <strong>{item}</strong>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="feature-panel">
                        <span className="eyebrow">合作方式</span>
                        <div className="list-block">
                            <div className="list-item">
                                <SiteIcon name="check" size={14} />
                                <span>适合阶段性咨询、体验整改、内容系统搭建与前后端落地。</span>
                            </div>
                            <div className="list-item">
                                <SiteIcon name="check" size={14} />
                                <span>优先处理结构清晰、目标明确、能被长期经营的项目。</span>
                            </div>
                            <div className="list-item">
                                <SiteIcon name="check" size={14} />
                                <span>如果你已经有产品或内容基础，我更适合做“系统升级”而不是从零陪跑。</span>
                            </div>
                        </div>
                        <a href={`mailto:${siteConfig.email}`} className="btn btn-primary">
                            <SiteIcon name="mail" size={14} />
                            <span>直接联系</span>
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}
