export default function PrimaryButton({ type = 'submit', disabled = false, children, className = '', ...props }) {
    return (
        <button
            type={type}
            disabled={disabled}
            className={`w-full rounded-lg bg-[#1b1b18] dark:bg-[#EDEDEC] text-[#EDEDEC] dark:text-[#1b1b18] py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity ${className}`.trim()}
            {...props}
        >
            {children}
        </button>
    );
}
