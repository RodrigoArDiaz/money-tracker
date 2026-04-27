import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { inputBaseClassName } from './inputStyles';

const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(
    { className = '', ...props },
    ref,
) {
    return <input ref={ref} className={`${inputBaseClassName} ${className}`.trim()} {...props} />;
});

export default TextInput;
