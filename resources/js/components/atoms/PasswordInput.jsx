import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { inputWithTrailingActionClassName } from './inputStyles';

export default function PasswordInput({
    id,
    value,
    onChange,
    autoComplete = 'new-password',
    required = false,
    toggleShowAriaLabel,
    toggleHideAriaLabel,
}) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative">
            <input
                id={id}
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                className={inputWithTrailingActionClassName}
                autoComplete={autoComplete}
                required={required}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-gray-500 transition-colors hover:text-[#1b1b18] dark:text-gray-400 dark:hover:text-[#EDEDEC]"
                aria-label={visible ? toggleHideAriaLabel : toggleShowAriaLabel}
            >
                {visible ? (
                    <EyeOff className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                ) : (
                    <Eye className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                )}
            </button>
        </div>
    );
}
