import { useEffect, useState } from 'react';

export default function ReadingProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const currentProgress = window.scrollY;
            const scrollHeight = document.body.scrollHeight - window.innerHeight;
            if (scrollHeight) {
                setProgress(Number((currentProgress / scrollHeight).toFixed(2)) * 100);
            }
        };

        window.addEventListener('scroll', updateProgress);
        return () => window.removeEventListener('scroll', updateProgress);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '2px',
            zIndex: 9999,
            background: 'transparent',
            pointerEvents: 'none',
        }}>
            <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'var(--accent-pink)',
                boxShadow: '0 0 10px var(--accent-pink)',
                transition: 'width 0.1s ease-out',
            }} />
        </div>
    );
}
