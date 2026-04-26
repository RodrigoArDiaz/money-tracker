export default function Label({ htmlFor, children, className = '' }) {
    return (
        <label htmlFor={htmlFor} className={`block text-sm font-medium mb-1 ${className}`.trim()}>
            {children}
        </label>
    );
}
