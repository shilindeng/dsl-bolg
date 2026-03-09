import { useEffect, useState } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt?: string;
}

export default function LazyImage({ src, alt, style, ...props }: LazyImageProps) {
    const [loaded, setLoaded] = useState(false);
    const [imageSource, setImageSource] = useState<string>('');
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setLoaded(false);
        setFailed(false);
        const image = new Image();
        image.src = src;
        image.onload = () => {
            setImageSource(src);
            setLoaded(true);
        };
        image.onerror = () => {
            setFailed(true);
            setLoaded(false);
        };
    }, [src]);

    return (
        <div
            style={{
                position: 'relative',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.04)',
                ...style,
                }}
            >
            {!loaded && !failed ? (
                <div
                    className="muted mono"
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
            {failed ? (
                <div
                    className="image-fallback"
                    style={{
                        minHeight: 160,
                        display: 'grid',
                        placeItems: 'center',
                        padding: '1rem',
                        textAlign: 'center',
                    }}
                >
                    <div className="muted">
                        <strong style={{ display: 'block', marginBottom: 8 }}>资源不可用</strong>
                        <span>{alt || '图片资源加载失败，已切换到内建占位。'}</span>
                    </div>
                </div>
            ) : (
                <img
                    {...props}
                    src={imageSource || src}
                    alt={alt}
                    loading="lazy"
                    onLoad={() => setLoaded(true)}
                    onError={() => setFailed(true)}
                    style={{
                        width: '100%',
                        display: 'block',
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 220ms ease',
                    }}
                />
            )}
        </div>
    );
}
