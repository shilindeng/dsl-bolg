import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';

interface ScrollRevealProps {
    children: ReactNode;
    threshold?: number;
    delay?: number;
    className?: string;
    style?: CSSProperties;
}

export default function ScrollReveal({
    children,
    threshold = 0.1,
    delay = 0,
    className = '',
    style
}: ScrollRevealProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold }
        );

        if (ref.current) observer.observe(ref.current);

        return () => observer.disconnect();
    }, [threshold]);

    return (
        <div
            ref={ref}
            className={`${className} ${isVisible ? 'animate-fade-in-up' : ''}`}
            style={{
                opacity: 0,
                animationDelay: `${delay}s`,
                animationFillMode: 'forwards',
                ...style
            }}
        >
            {children}
        </div>
    );
}
