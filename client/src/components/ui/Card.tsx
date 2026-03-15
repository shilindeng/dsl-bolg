import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    variant?: 'panel' | 'plain';
}

export default function Card({ children, className = '', variant = 'panel', ...props }: CardProps) {
    const classes = [];

    if (variant === 'panel') {
        classes.push('feature-panel');
    }

    if (className) {
        classes.push(className);
    }

    return (
        <div className={classes.join(' ')} {...props}>
            {children}
        </div>
    );
}

