import type { ReactNode } from 'react';

type AuthPanelDividerProps = {
    children: ReactNode;
    panelBgClass?: string;
};

export default function AuthPanelDivider({ children, panelBgClass = 'bg-white dark:bg-[#161615]' }: AuthPanelDividerProps) {
    return (
        <div className="relative my-4 flex items-center">
            <div className="flex-1 border-t border-black/10 dark:border-white/10" />
            <span className={`mx-3 px-2 text-xs text-muted-foreground ${panelBgClass}`}>{children}</span>
            <div className="flex-1 border-t border-black/10 dark:border-white/10" />
        </div>
    );
}
