import { useEffect, useState } from 'react';

interface LazyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src?: string | null;
    alt?: string;
    fallbackLabel?: string;
    fallbackKicker?: string;
}

export default function LazyImage({ src, alt, style, className, fallbackLabel, fallbackKicker = 'VISUAL', ...props }: LazyImageProps) {
    const safeSrc = src || '';
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(safeSrc ? 'loading' : 'error');
    const [imageSource, setImageSource] = useState<string>('');

    useEffect(() => {
        let active = true;

        if (!safeSrc) {
            setStatus('error');
            setImageSource('');
            return () => {
                active = false;
            };
        }

        setStatus('loading');
        setImageSource('');

        const image = new Image();
        image.src = safeSrc;
        image.onload = () => {
            if (!active) return;
            setImageSource(safeSrc);
            setStatus('loaded');
        };
        image.onerror = () => {
            if (!active) return;
            setImageSource('');
            setStatus('error');
        };

        return () => {
            active = false;
        };
    }, [safeSrc]);

    const label = fallbackLabel || alt || '视觉素材暂不可用';

    return (
        <div
            className={`lazy-image-shell ${className || ''} ${status === 'error' ? 'is-error' : ''}`.trim()}
            style={{
                position: 'relative',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.04)',
                ...style,
            }}
        >
            {status === 'loading' ? (
                <div
                    className="lazy-image-loading muted mono"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'grid',
                        placeItems: 'center',
                    }}
                >
                    loading asset...
                </div>
            ) : null}
            {status === 'error' ? (
                <div className="lazy-image-fallback">
                    <span className="lazy-image-kicker mono">{fallbackKicker}</span>
                    <strong>{label}</strong>
                    <span className="muted">资源缺失时自动切换为站点内建视觉占位。</span>
                </div>
            ) : (
                <img
                    {...props}
                    src={imageSource || safeSrc}
                    alt={alt}
                    loading="lazy"
                    onLoad={() => setStatus('loaded')}
                    onError={() => setStatus('error')}
                    style={{
                        width: '100%',
                        display: 'block',
                        opacity: status === 'loaded' ? 1 : 0,
                        transition: 'opacity 220ms ease',
                    }}
                />
            )}
        </div>
    );
}
