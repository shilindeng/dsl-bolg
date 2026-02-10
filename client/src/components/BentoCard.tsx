import type { ReactNode } from 'react';

interface BentoCardProps {
    children: ReactNode;
    span?: 1 | 2;
    rowSpan?: 1 | 2;
    className?: string;
    style?: React.CSSProperties;
    delay?: number;
}

export default function BentoCard({ children, span = 1, rowSpan = 1, className = '', style, delay = 0 }: BentoCardProps) {
    return (
        <div
            className={`glass-card animate-fade-in-up ${className}`}
            style={{
                gridColumn: `span ${span}`,
                gridRow: `span ${rowSpan}`,
                padding: 'var(--space-xl)',
                animationDelay: `${delay}s`,
                opacity: 0,
                overflow: 'hidden',
                position: 'relative',
                ...style,
            }}
        >
            {children}
        </div>
    );
}
