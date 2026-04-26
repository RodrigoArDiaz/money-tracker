import { router, usePage } from '@inertiajs/react';
import { Languages } from 'lucide-react';
import * as React from 'react';

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

type LocaleSwitcherProps = {
    align?: 'start' | 'center' | 'end';
};

export default function LocaleSwitcher({ align = 'end' }: LocaleSwitcherProps): React.ReactElement {
    const { t, locale } = useTranslate();
    const available = usePage<{ available_locales?: string[] }>().props.available_locales ?? ['es', 'en'];

    function setLocale(next: string): void {
        if (next === locale) {
            return;
        }
        router.post('/locale', { locale: next }, { preserveScroll: true });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    aria-label={t('locale.switch_aria')}
                >
                    <Languages />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-44">
                <DropdownMenuLabel>{t('locale.menu_label')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={locale} onValueChange={setLocale}>
                    {available.includes('es') ? (
                        <DropdownMenuRadioItem value="es" className="gap-2">
                            {t('locale.es')}
                        </DropdownMenuRadioItem>
                    ) : null}
                    {available.includes('en') ? (
                        <DropdownMenuRadioItem value="en" className="gap-2">
                            {t('locale.en')}
                        </DropdownMenuRadioItem>
                    ) : null}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
