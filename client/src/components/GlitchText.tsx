import { useState, useEffect } from 'react';

interface GlitchTextProps {
    text: string;
    as?: 'h1' | 'h2' | 'h3' | 'span' | 'div' | 'p';
    className?: string;
    style?: React.CSSProperties;
}

export default function GlitchText({ text, as: Component = 'span', className = '', style }: GlitchTextProps) {
    return (
        <Component
            className={`glitch-text ${className}`}
            data-text={text}
            style={style}
        >
            {text}
        </Component>
    );
}
