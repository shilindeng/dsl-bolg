import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    label: string;
    icon: ReactNode;
    variant?: 'default' | 'subtle';
}

export default function IconButton({ label, icon, variant = 'default', className = '', ...props }: IconButtonProps) {
    const classes = ['icon-button'];
    if (variant === 'subtle') {
        classes.push('btn-ghost');
    }
    if (className) {
        classes.push(className);
    }

    return (
        <button type="button" aria-label={label} title={label} className={classes.join(' ')} {...props}>
            {icon}
        </button>
    );
}

