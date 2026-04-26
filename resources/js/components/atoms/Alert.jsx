const variants = {
    danger:
        'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200',
    success:
        'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200',
};

export default function Alert({ variant = 'danger', children, role = 'alert', className = '' }) {
    return (
        <div
            className={`rounded-lg border px-3 py-2 text-sm ${variants[variant] ?? variants.danger} ${className}`.trim()}
            role={role}
        >
            {children}
        </div>
    );
}
