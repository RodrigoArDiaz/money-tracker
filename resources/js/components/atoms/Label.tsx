import type { ReactNode } from 'react';

type LabelProps = {
    children: ReactNode;
    htmlFor?: string;
    className?: string;
};

export default function Label({ children, htmlFor, className = '' }: LabelProps) {
    return (
        <label htmlFor={htmlFor} className={`block text-sm font-medium text-foreground ${className}`.trim()}>
            {children}
        </label>
    );
}
