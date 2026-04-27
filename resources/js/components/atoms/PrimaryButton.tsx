import type { ButtonHTMLAttributes, ReactNode } from 'react';

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
};

export default function PrimaryButton({
    type = 'submit',
    disabled = false,
    children,
    className = '',
    ...props
}: PrimaryButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled}
            className={`inline-flex items-center justify-center rounded-lg bg-[#1b1b18] px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50 dark:bg-[#eeeeec] dark:text-[#1C1C1A] dark:hover:bg-white ${className}`.trim()}
            {...props}
        >
            {children}
        </button>
    );
}
