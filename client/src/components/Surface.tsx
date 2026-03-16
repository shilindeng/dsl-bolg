import type { HTMLAttributes, ReactNode } from 'react';

type SurfaceTone = 'glass' | 'hero' | 'floating' | 'article' | 'workbench';

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    tone?: SurfaceTone;
}

export default function Surface({ children, className = '', tone = 'glass', ...props }: SurfaceProps) {
    const classes = ['surface', `surface-${tone}`];

    if (className) {
        classes.push(className);
    }

    return (
        <div className={classes.join(' ')} {...props}>
            {children}
        </div>
    );
}
