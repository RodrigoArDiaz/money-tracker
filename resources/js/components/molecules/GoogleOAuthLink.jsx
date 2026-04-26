import { Globe } from 'lucide-react';

export default function GoogleOAuthLink({ href, children }) {
    return (
        <a
            href={href}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-[#1a1a18] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5"
        >
            <Globe className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
            {children}
        </a>
    );
}
