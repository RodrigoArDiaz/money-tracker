import type { ReactNode } from 'react';
import { Globe } from 'lucide-react';

type GoogleOAuthLinkProps = {
    href: string;
    children: ReactNode;
};

export default function GoogleOAuthLink({ href, children }: GoogleOAuthLinkProps) {
    return (
        <a
            href={href}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
        >
            <Globe className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
            {children}
        </a>
    );
}
