import { useEffect, useState } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt?: string;
}

export default function LazyImage({ src, alt, className, style, ...props }: LazyImageProps) {
    const [loaded, setLoaded] = useState(false);
    const [imageSource, setImageSource] = useState('');
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setLoaded(false);
        setFailed(false);
        setImageSource('');

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
        <div className="lazy-image-shell" style={style}>
            {!loaded && !failed ? <div className="lazy-image-skeleton" aria-hidden="true" /> : null}

            {failed ? (
                <div className="lazy-image-fallback">
                    <span className="lazy-image-kicker mono">visual fallback</span>
                    <strong>{alt || '素材暂时不可用'}</strong>
                    <p className="muted">当前使用占位视觉，避免直接暴露异常资源。</p>
                </div>
            ) : (
                <img
                    {...props}
                    src={imageSource || src}
                    alt={alt}
                    loading="lazy"
                    className={className}
                    onLoad={() => setLoaded(true)}
                    onError={() => setFailed(true)}
                    style={{
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 220ms ease',
                    }}
                />
            )}
        </div>
    );
}
