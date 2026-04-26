import { forwardRef } from 'react';

import { inputBaseClassName } from './inputStyles';

const TextInput = forwardRef(function TextInput({ className = '', ...props }, ref) {
    return <input ref={ref} className={`${inputBaseClassName} ${className}`.trim()} {...props} />;
});

export default TextInput;
