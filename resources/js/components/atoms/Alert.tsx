import type { ReactNode } from 'react';

type AlertVariant = 'danger' | 'success';

type AlertProps = {
    variant?: AlertVariant;
    children: ReactNode;
    className?: string;
};

const variantClasses: Record<AlertVariant, string> = {
    danger: 'border-destructive/30 bg-destructive/10 text-destructive',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
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
