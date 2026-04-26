import { Monitor, Moon, Sun } from 'lucide-react';
import * as React from 'react';

import { type Theme, useTheme } from '@/components/theme-provider';
import { useTranslate } from '@/hooks/use-translate';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ThemeMenuProps = {
    align?: 'start' | 'center' | 'end';
};

export default function ThemeMenu({ align = 'end' }: ThemeMenuProps): React.ReactElement {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { t } = useTranslate();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    aria-label={t('theme.switch_aria')}
                >
                    {resolvedTheme === 'dark' ? <Moon /> : <Sun />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-48">
                <DropdownMenuLabel>{t('theme.appearance')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={(value) => setTheme(value as Theme)}
                >
                    <DropdownMenuRadioItem value="light" className="gap-2">
                        <Sun className="size-4" />
                        {t('theme.light')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark" className="gap-2">
                        <Moon className="size-4" />
                        {t('theme.dark')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system" className="gap-2">
                        <Monitor className="size-4" />
                        {t('theme.system')}
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
