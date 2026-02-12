import TypewriterText from '../components/TypewriterText';
import ScrollReveal from '../components/ScrollReveal';
import BentoCard from '../components/BentoCard';

export default function About() {
    const skills = [
        { name: 'JavaScript / TypeScript', level: 95 },
        { name: 'React / Next.js', level: 90 },
        { name: 'Node.js', level: 85 },
        { name: 'Python', level: 80 },
        { name: 'UI / UX Design', level: 75 },
        { name: 'Vibe Coding', level: 100 },
    ];

    const timeline = [
        { year: '2026', event: 'Mastered Full-Stack Vibe Coding' },
        { year: '2025', event: 'Launched DSL Personal System' },
        { year: '2026', event: '精通全栈氛围编程' },
        { year: '2025', event: '发布 DSL 个人系统' },
        { year: '2024', event: '深入探索 AI 智能体' },
        { year: '2023', event: '开启 Web 开发之旅' },
    ];

    return (
        <div className="container" style={{ paddingTop: 'var(--space-3xl)', paddingBottom: 'var(--space-3xl)' }}>

            {/* Header */}
            <div className="animate-fade-in-up" style={{ marginBottom: 'var(--space-3xl)', textAlign: 'center' }}>
                <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'var(--bg-tertiary)',
                    border: '2px solid var(--accent-cyan)',
                    margin: '0 auto var(--space-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    boxShadow: '0 0 30px rgba(0,255,200,0.2)'
                }}>
                    <span style={{ fontSize: '3rem' }}>⚡</span>
                </div>
                <h1 style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>
                    <TypewriterText text="USER: DSL" speed={100} delay={500} />
                </h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontFamily: 'var(--font-mono)' }}>
                    全栈开发者 | AI 爱好者 | 赛博朋克架构师
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: 'var(--space-lg)',
            }}>

                {/* Intro Card */}
                <BentoCard span={2} style={{ gridColumn: 'span 7' }} title="生物数据">
                    <ScrollReveal>
                        <p style={{ marginBottom: 'var(--space-md)', fontSize: '1.1rem', lineHeight: 1.8 }}>
                            Hello World. 我是一名热衷于构建沉浸式网络体验的开发者。
                            我的使命是将代码与艺术融合，创造出有生命力的数字环境。
                        </p>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            当我不写代码时，我会在 AI 的前沿探索，定制我的终端，
                            或者沉浸在科幻美学中。
                        </p>
                        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-md)' }}>
                            <a href="mailto:hello@example.com" className="btn btn-primary">联系我</a>
                        </div>
                    </ScrollReveal>
                </BentoCard>

                {/* System Stats (Neofetch style) */}
                <BentoCard span={1} style={{ gridColumn: 'span 5' }} title="系统信息">
                    <ScrollReveal delay={0.2}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--accent-purple)' }}>操作系统:</span> <span>Windows 11 (Custom)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--accent-purple)' }}>终端:</span> <span>PowerShell 7</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--accent-purple)' }}>编辑器:</span> <span>VS Code</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--accent-purple)' }}>主题:</span> <span>Cyberpunk 2077</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--accent-purple)' }}>运行时间:</span> <span>99.9%</span>
                            </div>

                            <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                                <div style={{ width: '20px', height: '20px', background: 'var(--bg-primary)' }} />
                                <div style={{ width: '20px', height: '20px', background: 'var(--accent-cyan)' }} />
                                <div style={{ width: '20px', height: '20px', background: 'var(--accent-purple)' }} />
                                <div style={{ width: '20px', height: '20px', background: 'var(--accent-pink)' }} />
                                <div style={{ width: '20px', height: '20px', background: 'var(--text-primary)' }} />
                            </div>
                        </div>
                    </ScrollReveal>
                </BentoCard>

                {/* Skills */}
                <div style={{ gridColumn: 'span 12', marginTop: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-lg)', borderLeft: '4px solid var(--accent-cyan)', paddingLeft: '1rem' }}>
                        技能矩阵
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
                        {skills.map((skill, i) => (
                            <div key={skill.name} className="cyber-card" style={{ padding: 'var(--space-md)', border: 'none', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
                                    <span>{skill.name}</span>
                                    <span style={{ color: 'var(--accent-cyan)' }}>{skill.level}%</span>
                                </div>
                                <div style={{ height: '6px', background: 'var(--border-dim)', width: '100%', position: 'relative' }}>
                                    <ScrollReveal delay={i * 0.1}>
                                        <div style={{
                                            position: 'absolute', top: 0, left: 0, height: '100%',
                                            width: `${skill.level}%`,
                                            background: 'var(--accent-gradient, linear-gradient(90deg, var(--accent-cyan), var(--accent-purple)))',
                                            boxShadow: 'var(--glow-cyan)'
                                        }} />
                                    </ScrollReveal>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline */}
                <div style={{ gridColumn: 'span 12', marginTop: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-lg)', borderLeft: '4px solid var(--accent-pink)', paddingLeft: '1rem' }}>
                        变更日志 (时间线)
                    </h2>
                    <div style={{ position: 'relative', paddingLeft: '20px' }}>
                        <div style={{ position: 'absolute', left: '0', top: '0', bottom: '0', width: '2px', background: 'var(--border-dim)' }} />

                        {timeline.map((item, i) => (
                            <ScrollReveal key={i} delay={i * 0.1} style={{ marginBottom: 'var(--space-lg)', position: 'relative' }}>
                                <div style={{
                                    position: 'absolute', left: '-24px', top: '6px',
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    background: i === 0 ? 'var(--accent-pink)' : 'var(--bg-tertiary)',
                                    border: '2px solid var(--accent-pink)'
                                }} />
                                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-pink)', fontSize: '0.9rem' }}>
                                    {item.year}
                                </div>
                                <div style={{ fontSize: '1.1rem' }}>
                                    {item.event}
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>

            </div>
            <style>{`
                @media (max-width: 768px) {
                    .container > div:nth-child(2) > div {
                        grid-column: span 12 !important;
                    }
                }
            `}</style>
        </div>
    );
}
