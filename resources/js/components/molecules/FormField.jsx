import FieldError from '../atoms/FieldError';
import Label from '../atoms/Label';

export default function FormField({ label, htmlFor, error, hint, children }) {
    return (
        <div>
            <Label htmlFor={htmlFor}>{label}</Label>
            {hint ? (
                <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-500">{hint}</p>
            ) : null}
            {children}
            <FieldError message={error} />
        </div>
    );
}
