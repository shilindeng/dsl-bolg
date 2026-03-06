import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    z: number;
    speed: number;
    alpha: number;
    size: number;
}

const readParticlePalette = () => {
    const styles = getComputedStyle(document.documentElement);
    return {
        color: styles.getPropertyValue('--particle-color').trim() || 'rgba(103, 230, 255, 0.72)',
        glow: styles.getPropertyValue('--particle-glow').trim() || 'rgba(103, 230, 255, 0.2)',
        hazeA: styles.getPropertyValue('--particle-haze-a').trim() || 'rgba(103, 230, 255, 0.08)',
        hazeB: styles.getPropertyValue('--particle-haze-b').trim() || 'rgba(123, 140, 255, 0.14)',
    };
};

const withAlpha = (value: string, alpha: number) => {
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (!match) {
        return value;
    }

    const parts = match[1].split(',').slice(0, 3).map((item) => item.trim());
    return `rgba(${parts.join(', ')}, ${alpha})`;
};

export default function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (!canvas || mediaQuery.matches) {
            return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        let animationFrame = 0;
        let width = 0;
        let height = 0;
        let pointerX = 0;
        let pointerY = 0;
        let palette = readParticlePalette();
        const particleCount = 34;
        const depth = 900;
        const particles: Particle[] = [];

        const observer = new MutationObserver(() => {
            palette = readParticlePalette();
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        const resetParticle = (particle: Particle, fresh = false) => {
            particle.x = Math.random() * width - width / 2;
            particle.y = Math.random() * height - height / 2;
            particle.z = fresh ? Math.random() * depth : depth;
            particle.speed = 0.8 + Math.random() * 1.6;
            particle.alpha = 0.08 + Math.random() * 0.2;
            particle.size = 0.45 + Math.random() * 1.4;
        };

        const resize = () => {
            width = canvas.clientWidth || window.innerWidth;
            height = canvas.clientHeight || window.innerHeight;
            canvas.width = width * window.devicePixelRatio;
            canvas.height = height * window.devicePixelRatio;
            context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

            if (!particles.length) {
                for (let index = 0; index < particleCount; index += 1) {
                    const particle = { x: 0, y: 0, z: 0, speed: 0, alpha: 0, size: 0 };
                    resetParticle(particle, true);
                    particles.push(particle);
                }
            }
        };

        const render = () => {
            context.clearRect(0, 0, width, height);

            const gradient = context.createRadialGradient(width * 0.5, height * 0.3, 0, width * 0.5, height * 0.5, height * 0.85);
            gradient.addColorStop(0, palette.hazeA);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            context.fillStyle = gradient;
            context.fillRect(0, 0, width, height);

            const centerX = width / 2;
            const centerY = height / 2;

            particles.forEach((particle) => {
                particle.z -= particle.speed;
                if (particle.z <= 1) {
                    resetParticle(particle);
                }

                const perspective = depth / particle.z;
                const screenX = centerX + particle.x * perspective + pointerX * 10 * (1 - particle.z / depth);
                const screenY = centerY + particle.y * perspective + pointerY * 8 * (1 - particle.z / depth);
                const radius = particle.size * perspective;

                if (screenX < -40 || screenX > width + 40 || screenY < -40 || screenY > height + 40) {
                    resetParticle(particle);
                    return;
                }

                context.beginPath();
                context.fillStyle = withAlpha(palette.color, particle.alpha);
                context.shadowBlur = 10;
                context.shadowColor = palette.glow;
                context.arc(screenX, screenY, Math.max(0.35, radius), 0, Math.PI * 2);
                context.fill();
                context.shadowBlur = 0;
            });

            animationFrame = window.requestAnimationFrame(render);
        };

        const handlePointer = (event: PointerEvent) => {
            pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
            pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
        };

        resize();
        render();

        window.addEventListener('resize', resize);
        window.addEventListener('pointermove', handlePointer, { passive: true });

        return () => {
            observer.disconnect();
            window.cancelAnimationFrame(animationFrame);
            window.removeEventListener('resize', resize);
            window.removeEventListener('pointermove', handlePointer);
        };
    }, []);

    return (
        <div data-testid="hero-particles" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div className="particle-haze" />
            <canvas
                ref={canvasRef}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.54 }}
            />
        </div>
    );
}
