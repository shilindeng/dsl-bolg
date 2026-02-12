import { useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

export default function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        // Matrix Rain Conf
        const fontSize = 14;
        const columns = Math.floor(width / fontSize);
        const drops: number[] = new Array(columns).fill(1);
        const chars = '01日二三四五六七八九ABCDEF';

        const drawMatrix = () => {
            ctx.fillStyle = 'rgba(5, 5, 16, 0.05)'; // Fade effect
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = theme === 'dark' ? '#00ffc8' : '#00b890'; // Neon Cyan
            ctx.font = `${fontSize}px 'IBM Plex Mono'`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];

                // Randomly brighter characters
                if (Math.random() > 0.95) {
                    ctx.fillStyle = '#fff';
                } else {
                    ctx.fillStyle = theme === 'dark' ? '#00ffc8' : '#00b890';
                }

                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const drawGrid = () => {
            // Perspective Grid (Drawing once or overlaid? Matrix rain looks better alone or with subtle grid)
            // Let's stick to Matrix rain as the primary effect, but maybe add a static grid overlay in CSS
        };

        const animate = () => {
            drawMatrix();
            animationId = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        animate();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
        };
    }, [theme]);

    return (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
            {/* Perspective Grid Background (CSS) */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: `
                    linear-gradient(transparent 95%, var(--border-dim) 95%),
                    linear-gradient(90deg, transparent 95%, var(--border-dim) 95%)
                `,
                backgroundSize: '40px 40px',
                transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(2)',
                opacity: 0.15,
                pointerEvents: 'none',
            }} />

            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0.15, // Subtle rain
                    pointerEvents: 'none',
                }}
            />
        </div>
    );
}
