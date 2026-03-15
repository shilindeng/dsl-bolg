import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    loading?: boolean;
    icon?: ReactNode;
}

export default function Button({
    variant = 'primary',
    loading = false,
    icon,
    className = '',
    disabled,
    children,
    ...props
}: ButtonProps) {
    const classes = ['btn'];

    if (variant === 'primary') classes.push('btn-primary');
    if (variant === 'secondary') classes.push('btn-secondary');
    if (variant === 'ghost') classes.push('btn-ghost');

    if (className) classes.push(className);

    return (
        <button
            type="button"
            className={classes.join(' ')}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            {...props}
        >
            {icon}
            {children}
        </button>
    );
}

