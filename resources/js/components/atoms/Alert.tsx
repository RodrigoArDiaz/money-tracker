import type { ReactNode } from 'react';

type AlertVariant = 'danger' | 'success';

type AlertProps = {
    variant?: AlertVariant;
    children: ReactNode;
    className?: string;
};

const variantClasses: Record<AlertVariant, string> = {
    danger: 'border-destructive/30 bg-destructive/10 text-destructive',
    success:
        'border-theme-green-3/30 bg-theme-green-2/12 text-theme-green-5 dark:border-theme-green-3/35 dark:bg-theme-green-5/20 dark:text-theme-green-2',
};

export default function Alert({ variant = 'danger', children, className = '' }: AlertProps) {
    return (
        <div
            role="alert"
            className={`rounded-lg border px-3 py-2 text-sm ${variantClasses[variant]} ${className}`.trim()}
        >
            {children}
        </div>
    );
}
