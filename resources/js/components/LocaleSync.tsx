import { usePage } from '@inertiajs/react';
import * as React from 'react';

/**
 * Mantiene <html lang> alineado con el locale de Laravel en navegaciones Inertia
 * y desalienta la traducción automática del navegador (junto con translate="no" en Blade).
 */
export default function LocaleSync(): null {
    const { locale } = usePage<{ locale: string }>().props;

    React.useEffect(() => {
        const tag = locale.includes('_') ? locale.replace('_', '-') : locale;
        document.documentElement.lang = tag;
        document.documentElement.setAttribute('translate', 'no');
    }, [locale]);

    return null;
}
