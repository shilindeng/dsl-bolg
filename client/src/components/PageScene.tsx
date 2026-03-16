import type { HTMLAttributes, ReactNode } from 'react';

type PageSceneTone = 'editorial' | 'workbench' | 'account';

interface PageSceneProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    tone?: PageSceneTone;
}

export default function PageScene({ children, className = '', tone = 'editorial', ...props }: PageSceneProps) {
    const classes = ['page-scene', `page-scene-${tone}`];

    if (className) {
        classes.push(className);
    }

    return (
        <div className={classes.join(' ')} {...props}>
            {children}
        </div>
    );
}
