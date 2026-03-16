interface RouteSkeletonProps {
    variant?: 'route' | 'hero' | 'grid' | 'article' | 'admin';
    cards?: number;
}

function SkeletonLine({ short = false, tall = false }: { short?: boolean; tall?: boolean }) {
    return (
        <span
            className={[
                'skeleton-line',
                short ? 'is-short' : '',
                tall ? 'is-tall' : '',
            ]
                .filter(Boolean)
                .join(' ')}
        />
    );
}

function GridSkeleton({ cards = 6 }: { cards?: number }) {
    return (
        <div className="route-skeleton-grid" data-testid="grid-skeleton">
            {Array.from({ length: cards }).map((_, index) => (
                <article key={index} className="route-skeleton-card surface surface-glass">
                    <div className="skeleton-box skeleton-media" />
                    <div className="route-skeleton-copy">
                        <div className="route-skeleton-meta">
                            <span className="skeleton-pill" />
                            <span className="skeleton-pill is-soft" />
                        </div>
                        <SkeletonLine tall />
                        <SkeletonLine />
                        <SkeletonLine short />
                    </div>
                </article>
            ))}
        </div>
    );
}

export default function RouteSkeleton({ variant = 'route', cards = 6 }: RouteSkeletonProps) {
    if (variant === 'article') {
        return (
            <div className="container route-skeleton route-skeleton-article" data-testid="article-skeleton">
                <div className="route-skeleton-article-main">
                    <div className="surface surface-article route-skeleton-panel">
                        <div className="route-skeleton-meta">
                            <span className="skeleton-pill" />
                            <span className="skeleton-pill is-soft" />
                            <span className="skeleton-pill is-soft" />
                        </div>
                        <SkeletonLine tall />
                        <SkeletonLine />
                        <div className="skeleton-box skeleton-hero-media" />
                    </div>

                    <div className="surface surface-article route-skeleton-panel">
                        <SkeletonLine />
                        <SkeletonLine />
                        <SkeletonLine />
                        <SkeletonLine short />
                        <div className="skeleton-box skeleton-inline-media" />
                        <SkeletonLine />
                        <SkeletonLine />
                        <SkeletonLine short />
                    </div>
                </div>

                <aside className="route-skeleton-sidebar">
                    <div className="surface surface-workbench route-skeleton-panel">
                        <SkeletonLine short />
                        <SkeletonLine />
                        <SkeletonLine short />
                    </div>
                    <div className="surface surface-workbench route-skeleton-panel">
                        <SkeletonLine short />
                        <SkeletonLine />
                        <SkeletonLine />
                        <SkeletonLine short />
                    </div>
                </aside>
            </div>
        );
    }

    if (variant === 'grid') {
        return (
            <div className="container route-skeleton route-skeleton-grid-wrap">
                <div className="surface surface-glass route-skeleton-panel route-skeleton-hero-band">
                    <span className="skeleton-pill" />
                    <SkeletonLine tall />
                    <SkeletonLine />
                    <SkeletonLine short />
                </div>
                <GridSkeleton cards={cards} />
            </div>
        );
    }

    if (variant === 'hero') {
        return (
            <div className="container route-skeleton route-skeleton-hero" data-testid="hero-skeleton">
                <div className="surface surface-hero route-skeleton-panel route-skeleton-hero-stage">
                    <div className="route-skeleton-hero-copy">
                        <span className="skeleton-pill" />
                        <SkeletonLine tall />
                        <SkeletonLine />
                        <SkeletonLine short />
                        <div className="route-skeleton-meta">
                            <span className="skeleton-pill" />
                            <span className="skeleton-pill is-soft" />
                        </div>
                    </div>
                    <div className="surface surface-floating route-skeleton-floating-card">
                        <div className="skeleton-box skeleton-media" />
                        <SkeletonLine />
                        <SkeletonLine short />
                    </div>
                </div>
                <GridSkeleton cards={3} />
            </div>
        );
    }

    if (variant === 'admin') {
        return (
            <div className="route-skeleton route-skeleton-admin" data-testid="admin-skeleton">
                <div className="surface surface-workbench route-skeleton-panel">
                    <span className="skeleton-pill" />
                    <SkeletonLine tall />
                    <SkeletonLine />
                </div>
                <GridSkeleton cards={4} />
            </div>
        );
    }

    return (
        <div className="container route-skeleton route-skeleton-route" data-testid="route-skeleton">
            <div className="surface surface-glass route-skeleton-panel route-skeleton-hero-band">
                <span className="skeleton-pill" />
                <SkeletonLine tall />
                <SkeletonLine />
                <SkeletonLine short />
            </div>
            <GridSkeleton cards={cards} />
        </div>
    );
}
