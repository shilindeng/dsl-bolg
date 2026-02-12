import { useState, useEffect } from 'react';

interface TypewriterTextProps {
    text: string;
    speed?: number;
    delay?: number;
    cursor?: boolean;
    onComplete?: () => void;
    className?: string;
    style?: React.CSSProperties;
}

export default function TypewriterText({
    text,
    speed = 50,
    delay = 0,
    cursor = true,
    onComplete,
    className = '',
    style
}: TypewriterTextProps) {
    const [displayedText, setDisplayedText] = useState('');
    const [isStarted, setIsStarted] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        const startTimeout = setTimeout(() => setIsStarted(true), delay);
        return () => clearTimeout(startTimeout);
    }, [delay]);

    useEffect(() => {
        if (!isStarted) return;

        let index = 0;
        const interval = setInterval(() => {
            if (index < text.length) {
                setDisplayedText(text.slice(0, index + 1));
                index++;
            } else {
                clearInterval(interval);
                setIsComplete(true);
                if (onComplete) onComplete();
            }
        }, speed);

        return () => clearInterval(interval);
    }, [isStarted, text, speed, onComplete]);

    return (
        <span className={className} style={{ fontFamily: 'var(--font-mono)', ...style }}>
            {displayedText}
            {cursor && !isComplete && (
                <span style={{
                    display: 'inline-block',
                    width: '0.6em',
                    height: '1.2em',
                    background: 'var(--accent-cyan)',
                    verticalAlign: 'middle',
                    marginLeft: '2px',
                    animation: 'blink 1s step-end infinite'
                }} />
            )}
            {cursor && isComplete && (
                <span style={{
                    display: 'inline-block',
                    width: '0.6em',
                    height: '1.2em',
                    background: 'var(--accent-cyan)',
                    verticalAlign: 'middle',
                    marginLeft: '2px',
                    opacity: 0.5,
                    animation: 'blink 1.5s step-end infinite'
                }} />
            )}
        </span>
    );
}
