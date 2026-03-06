import { useEffect, useState } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt?: string;
}

export default function LazyImage({ src, alt, style, ...props }: LazyImageProps) {
    const [loaded, setLoaded] = useState(false);
    const [imageSource, setImageSource] = useState<string>('');

    useEffect(() => {
        const image = new Image();
        image.src = src;
        image.onload = () => {
            setImageSource(src);
            setLoaded(true);
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
            {!loaded ? (
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
            <img
                {...props}
                src={imageSource || src}
                alt={alt}
                loading="lazy"
                onLoad={() => setLoaded(true)}
                style={{
                    width: '100%',
                    display: 'block',
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 220ms ease',
                }}
            />
        </div>
    );
}
