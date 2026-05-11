import { Link, usePage } from '@inertiajs/react';
import { CalendarClock, Landmark, LayoutDashboard, PieChart, Repeat, Tags } from 'lucide-react';
import * as React from 'react';

import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

/** Bottom taskbar on small screens. Mantener altura acorde a `--mobile-bottom-nav-height` en `resources/css/app.css`. */
export default function MobileBottomNav() {
    const { url } = usePage();
    const { t } = useTranslate();
    const pathOnly = url.split('?')[0] ?? '';

    const isUpcomingRecurring = pathOnly === '/upcoming-expenses/recurring';
    const isFinancingPlans = pathOnly === '/financing-plans';
    const isUpcomingPlanned = pathOnly === '/upcoming-expenses';
    const isHome = pathOnly === '/' || pathOnly === '';

    const items = [
        {
            href: '/',
            label: t('dashboard.nav_home'),
            icon: LayoutDashboard,
            isActive: isHome,
        },
        {
            href: '/upcoming-expenses',
            label: t('upcoming_expenses.nav_label'),
            icon: CalendarClock,
            isActive: isUpcomingPlanned,
        },
        {
            href: '/upcoming-expenses/recurring',
            label: t('upcoming_expenses.recurring.nav_sublabel'),
            icon: Repeat,
            isActive: isUpcomingRecurring,
        },
        {
            href: '/financing-plans',
            label: t('financing_plans.nav_sublabel'),
            icon: Landmark,
            isActive: isFinancingPlans,
        },
        {
            href: '/expense-categories',
            label: t('expense_categories.nav_label'),
            icon: Tags,
            isActive: pathOnly.startsWith('/expense-categories'),
        },
        {
            href: '/charts',
            label: t('layout.charts_nav'),
            icon: PieChart,
            isActive: pathOnly.startsWith('/charts'),
        },
    ] as const;

    return (
        <nav
            className={cn(
                'fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/95 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md sm:hidden',
            )}
            aria-label={t('layout.mobile_bottom_nav_aria')}
        >
            <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-0.5 px-1">
                {items.map(({ href, label, icon: Icon, isActive }) => (
                    <Link
                        key={href}
                        href={href}
                        className={cn(
                            'flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-0.5 text-[0.65rem] font-medium leading-none transition-colors',
                            isActive
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        <Icon className={cn('size-6 shrink-0', isActive && 'text-primary')} aria-hidden />
                        <span className="line-clamp-2 max-h-8 w-full text-center text-[0.6rem] leading-tight">
                            {label}
                        </span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
