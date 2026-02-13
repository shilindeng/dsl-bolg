import { useState, useEffect } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt?: string;
    blurColor?: string;
}

export default function LazyImage({ src, alt, blurColor = 'var(--bg-secondary)', className, style, ...props }: LazyImageProps) {
    const [loaded, setLoaded] = useState(false);
    const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);

    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            setImgSrc(src);
            setLoaded(true);
        };
    }, [src]);

    return (
        <div style={{
            position: 'relative',
            overflow: 'hidden',
            background: !loaded ? blurColor : 'transparent',
            transition: 'background 0.3s ease',
            ...style
        }} className={className}>
            <img
                {...props}
                src={imgSrc || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'} // Transparent placeholder
                alt={alt}
                loading="lazy"
                onLoad={() => setLoaded(true)}
                style={{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 0.5s ease-in-out',
                    filter: loaded ? 'none' : 'blur(10px)',
                    transform: loaded ? 'scale(1)' : 'scale(1.05)',
                }}
            />
            {/* Cyberpunk Loading Overlay */}
            {!loaded && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.8rem',
                    letterSpacing: '0.1em',
                    pointerEvents: 'none'
                }}>
                    LOADING_ASSET...
                </div>
            )}
        </div>
    );
}
