type FieldErrorProps = {
    message?: string | string[] | null;
};

export default function FieldError({ message }: FieldErrorProps) {
    if (!message) {
        return null;
    }

    const text = Array.isArray(message) ? message[0] : message;

    return <p className="text-sm text-destructive">{text}</p>;
}
