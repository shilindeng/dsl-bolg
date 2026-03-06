import { useEffect, useState } from 'react';

export default function ReadingProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const scrollTop = window.scrollY;
            const scrollHeight = document.body.scrollHeight - window.innerHeight;
            setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
        };

        updateProgress();
        window.addEventListener('scroll', updateProgress, { passive: true });
        return () => window.removeEventListener('scroll', updateProgress);
    }, []);

    return (
        <div style={{ position: 'fixed', inset: '0 0 auto 0', zIndex: 1100, pointerEvents: 'none' }}>
            <div
                style={{
                    width: `${progress}%`,
                    height: 3,
                    background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))',
                    boxShadow: 'var(--shadow-glow)',
                }}
            />
        </div>
    );
}
