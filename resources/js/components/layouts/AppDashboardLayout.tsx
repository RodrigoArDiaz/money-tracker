import { Link, router, usePage } from '@inertiajs/react';
import { LayoutDashboard, LogOut, Wallet } from 'lucide-react';
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
    SidebarProvider,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import ThemeMenu from '@/components/molecules/ThemeMenu';
import { TooltipProvider } from '@/components/ui/tooltip';
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

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="border-b border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Wallet className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Money Tracker</span>
                                    <span className="truncate text-xs text-sidebar-foreground/70">Panel</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navegación</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={url.startsWith('/dashboard')}
                                    tooltip="Inicio"
                                >
                                    <Link href="/dashboard">
                                        <LayoutDashboard />
                                        <span>Inicio</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarSeparator />
            <SidebarFooter className="p-2">
                <p className="px-2 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                    Más secciones próximamente.
                </p>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}

function UserMenu({ user }: { user: AuthUser }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 gap-2 rounded-lg px-2">
                    <Avatar className="size-8">
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
                    Cerrar sesión
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
    title?: string;
}) {
    const { auth } = usePage<{ auth: { user: AuthUser | null } }>().props;
    const user = auth.user;

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
                        <div className="flex flex-1 flex-col gap-0.5">
                            <h1 className="text-sm font-semibold tracking-tight md:text-base">{title ?? 'Panel'}</h1>
                        </div>
                        <div className="flex items-center gap-1">
                            <ThemeMenu align="end" />
                            {user ? <UserMenu user={user} /> : null}
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
                </SidebarInset>
            </TooltipProvider>
        </SidebarProvider>
    );
}
