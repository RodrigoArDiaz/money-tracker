import { Link, router, usePage } from '@inertiajs/react';
import { CalendarClock, LayoutDashboard, LogOut, PieChart, Tags, Wallet } from 'lucide-react';
import * as React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import FullscreenToggle from '@/components/molecules/FullscreenToggle';
import LocaleSwitcher from '@/components/molecules/LocaleSwitcher';
import MobileBottomNav from '@/components/molecules/MobileBottomNav';
import ThemeMenu from '@/components/molecules/ThemeMenu';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useTranslate } from '@/hooks/use-translate';
import { dashboardHeaderTitleFromPath } from '@/lib/dashboard-header-title';
import { mobileMainContentBottomPaddingClass } from '@/lib/mobile-dashboard-ui';
import { cn } from '@/lib/utils';

type AuthUser = {
    name: string;
    email: string;
};

function initialsFromName(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return '?';
    }
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function AppSidebar() {
    const { url } = usePage();
    const { t } = useTranslate();
    const pathOnly = url.split('?')[0] ?? '';
    const isUpcomingRecurring = pathOnly === '/upcoming-expenses/recurring';
    const isFinancingPlans = pathOnly === '/financing-plans';
    const isUpcomingPlanned = pathOnly === '/upcoming-expenses';
    const isUpcomingSectionActive = isUpcomingPlanned || isUpcomingRecurring || isFinancingPlans;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="border-b border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Wallet className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Money Tracker</span>
                                    {/* <span className="truncate text-xs text-sidebar-foreground/70">{t('layout.panel')}</span> */}
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="group-data-[collapsible=icon]:overflow-y-auto">
                <SidebarGroup>
                    <SidebarGroupLabel>{t('layout.nav_section')}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1">
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={url === '/' || url === ''}
                                    tooltip={t('layout.home_tooltip')}
                                >
                                    <Link href="/">
                                        <LayoutDashboard />
                                        <span>{t('dashboard.nav_home')}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isUpcomingSectionActive}
                                    tooltip={t('upcoming_expenses.nav_label')}
                                >
                                    <Link href="/upcoming-expenses">
                                        <CalendarClock />
                                        <span>{t('upcoming_expenses.nav_label')}</span>
                                    </Link>
                                </SidebarMenuButton>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isUpcomingRecurring} size="sm">
                                            <Link href="/upcoming-expenses/recurring">
                                                <span>{t('upcoming_expenses.recurring.nav_sublabel')}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isFinancingPlans} size="sm">
                                            <Link href="/financing-plans">
                                                <span>{t('financing_plans.nav_sublabel')}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={url.startsWith('/expense-categories')}
                                    tooltip={t('expense_categories.nav_label')}
                                >
                                    <Link href="/expense-categories">
                                        <Tags />
                                        <span>{t('expense_categories.nav_label')}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={url.startsWith('/charts')}
                                    tooltip={t('layout.charts_nav_tooltip')}
                                >
                                    <Link href="/charts">
                                        <PieChart />
                                        <span>{t('layout.charts_nav')}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarSeparator />
            <SidebarFooter className="p-2">
                {/* <p className="px-2 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                    {t('layout.footer_hint')}
                </p> */}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}

function UserMenu({ user }: { user: AuthUser }) {
    const { t } = useTranslate();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 gap-2 rounded-lg px-2">
                    <Avatar className="size-6">
                        <AvatarFallback className="text-xs">{initialsFromName(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-[10rem] truncate text-sm font-medium md:inline">{user.name}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    variant="destructive"
                    onSelect={(event) => {
                        event.preventDefault();
                        router.post('/logout');
                    }}
                >
                    <LogOut className="size-4" />
                    {t('layout.sign_out')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function AppDashboardLayout({
    children,
    title,
}: {
    children: React.ReactNode;
    /** When set, overrides the title derived from the current route. */
    title?: React.ReactNode;
}) {
    const page = usePage<{ auth: { user: AuthUser | null } }>();
    const user = page.props.auth.user;
    const pathOnly = page.url.split('?')[0] ?? '';
    const { t } = useTranslate();
    const headerTitle =
        title !== undefined && title !== null ? title : dashboardHeaderTitleFromPath(pathOnly, t);

    return (
        <SidebarProvider>
            <TooltipProvider>
                <AppSidebar />
                <SidebarInset>
                    <header
                        className={cn(
                            'flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm md:h-16',
                        )}
                    >
                        <SidebarTrigger className="-ml-1" />
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <div className="min-w-0 text-sm font-semibold tracking-tight md:text-base">
                                {headerTitle}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <LocaleSwitcher align="end" />
                            <FullscreenToggle />
                            <ThemeMenu align="end" />
                            {user ? <UserMenu user={user} /> : null}
                        </div>
                    </header>
                    <div
                        className={cn(
                            'flex flex-1 flex-col gap-4 p-4 md:p-6',
                            mobileMainContentBottomPaddingClass,
                        )}
                    >
                        {children}
                    </div>
                    <MobileBottomNav />
                </SidebarInset>
            </TooltipProvider>
        </SidebarProvider>
    );
}
