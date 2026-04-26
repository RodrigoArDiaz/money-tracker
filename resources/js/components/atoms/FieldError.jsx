export default function FieldError({ message }) {
    if (!message) {
        return null;
    }

    return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{message}</p>;
}
