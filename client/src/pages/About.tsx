export default function About() {
    const skills = [
        { name: 'JavaScript / TypeScript', level: 90 },
        { name: 'React / Next.js', level: 85 },
        { name: 'Node.js / Express', level: 80 },
        { name: 'Python', level: 75 },
        { name: 'SQL / Database', level: 70 },
        { name: 'AI / ML', level: 65 },
    ];

    const timeline = [
        { year: '2024', title: '开始 Vibe Coding 之旅', desc: '拥抱 AI 辅助编程，效率提升 10 倍' },
        { year: '2023', title: '全栈开发', desc: '深入 React 生态和 Node.js 后端开发' },
        { year: '2022', title: '前端进阶', desc: '学习 TypeScript、性能优化和架构设计' },
        { year: '2021', title: '编程起步', desc: '学习 HTML/CSS/JavaScript，踏入编程世界' },
    ];

    return (
        <div className="container" style={{ paddingTop: 'var(--space-3xl)', paddingBottom: 'var(--space-3xl)' }}>
            <div className="animate-fade-in-up" style={{ opacity: 0, marginBottom: 'var(--space-2xl)' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>
                    <span className="gradient-text">👤 关于我</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>一个热爱技术的 Vibe Coder</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-xl)',
            }} className="about-grid">
                {/* 介绍 */}
                <div className="glass-card animate-fade-in-up delay-1" style={{ opacity: 0, padding: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>🙋 自我介绍</h2>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
                        <p style={{ marginBottom: 'var(--space-md)' }}>
                            你好！我是 <strong style={{ color: 'var(--accent-primary)' }}>DSL</strong>，一个热爱编程和探索新技术的开发者。
                        </p>
                        <p style={{ marginBottom: 'var(--space-md)' }}>
                            我相信 <strong style={{ color: 'var(--accent-primary)' }}>Vibe Coding</strong> 代表着编程的未来——用想象力驱动创造，让 AI 成为最强大的伙伴。
                        </p>
                        <p>
                            这个博客记录了我在技术路上的学习、实践和思考。希望这些内容能对你有所帮助或启发。💡
                        </p>
                    </div>
                </div>

                {/* 技能 */}
                <div className="glass-card animate-fade-in-up delay-2" style={{ opacity: 0, padding: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>🧰 技能</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {skills.map(skill => (
                            <div key={skill.name}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{skill.name}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{skill.level}%</span>
                                </div>
                                <div style={{
                                    height: '6px',
                                    background: 'var(--bg-glass)',
                                    borderRadius: '3px',
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        width: `${skill.level}%`,
                                        height: '100%',
                                        background: 'var(--accent-gradient)',
                                        borderRadius: '3px',
                                        transition: 'width 1s ease',
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 时间线 */}
                <div className="glass-card animate-fade-in-up delay-3" style={{ opacity: 0, padding: 'var(--space-xl)', gridColumn: 'span 2' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>📅 历程</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                        {timeline.map((item, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                gap: 'var(--space-lg)',
                                alignItems: 'flex-start',
                                paddingLeft: 'var(--space-md)',
                                borderLeft: '2px solid var(--border-glass)',
                                position: 'relative',
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    left: '-6px',
                                    top: '4px',
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: 'var(--accent-gradient)',
                                    boxShadow: 'var(--accent-glow)',
                                }} />
                                <div>
                                    <span style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.8rem',
                                        color: 'var(--accent-primary)',
                                        fontWeight: 600,
                                    }}>{item.year}</span>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '4px 0' }}>{item.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 联系方式 */}
                <div className="glass-card animate-fade-in-up delay-4" style={{ opacity: 0, padding: 'var(--space-xl)', gridColumn: 'span 2', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>📬 联系我</h2>
                    <div style={{ display: 'flex', gap: 'var(--space-lg)', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: '0.9rem' }}>
                            📦 GitHub
                        </a>
                        <a href="mailto:hello@example.com" className="btn btn-ghost" style={{ fontSize: '0.9rem' }}>
                            ✉️ 邮箱
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: '0.9rem' }}>
                            🐦 Twitter
                        </a>
                    </div>
                </div>
            </div>

            <style>{`
        @media (max-width: 768px) {
          .about-grid {
            grid-template-columns: 1fr !important;
          }
          .about-grid > * {
            grid-column: span 1 !important;
          }
        }
      `}</style>
        </div>
    );
}
