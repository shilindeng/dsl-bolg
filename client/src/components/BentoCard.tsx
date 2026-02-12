import type { ReactNode } from 'react';

interface BentoCardProps {
    children: ReactNode;
    span?: 1 | 2;
    rowSpan?: 1 | 2;
    className?: string;
    style?: React.CSSProperties;
    delay?: number;
    title?: string; // Optional title for header bar
}

export default function BentoCard({
    children,
    span = 1,
    rowSpan = 1,
    className = '',
    style,
    delay = 0,
    title
}: BentoCardProps) {
    return (
        <div
            className={`cyber-card animate-fade-in-up ${className}`}
            style={{
                gridColumn: `span ${span}`,
                gridRow: `span ${rowSpan}`,
                animationDelay: `${delay}s`,
                opacity: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                ...style,
            }}
        >
            {/* Terminal Header Bar */}
            <div className="cyber-header-bar">
                <div className="cyber-dot active" />
                <div className="cyber-dot" />
                <div className="cyber-dot" />
                {title && (
                    <span style={{
                        marginLeft: '10px',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase'
                    }}>
                        {title}
                    </span>
                )}
            </div>

            <div style={{ padding: 'var(--space-xl)', flex: 1, position: 'relative' }}>
                {children}
            </div>

            {/* Corner Accents */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '10px',
                height: '10px',
                borderBottom: '2px solid var(--accent-cyan)',
                borderRight: '2px solid var(--accent-cyan)',
                opacity: 0.5,
            }} />
        </div>
    );
}
