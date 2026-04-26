import { cn } from '@/lib/utils';

export default function PrimaryButton({ type = 'submit', disabled = false, children, className = '', ...props }) {
    return (
        <button
            type={type}
            disabled={disabled}
            className={cn(
                'w-full rounded-lg bg-[#1b1b18] py-2.5 text-sm font-medium text-[#EDEDEC] transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-[#EDEDEC] dark:text-[#1b1b18]',
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}
