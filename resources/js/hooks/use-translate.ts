import { usePage } from '@inertiajs/react';
import { useCallback } from 'react';

export type TranslationTree = Record<string, unknown>;

function getNested(obj: TranslationTree | undefined, path: string): string | undefined {
    const keys = path.split('.');
    let current: unknown = obj;
    for (const key of keys) {
        if (current === null || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, key)) {
            return undefined;
        }
        current = (current as Record<string, unknown>)[key];
    }

    return typeof current === 'string' ? current : undefined;
}

export function useTranslate(): {
    t: (key: string, replacements?: Record<string, string | number>) => string;
    locale: string;
} {
    const { translations, locale } = usePage<{
        translations: TranslationTree;
        locale: string;
    }>().props;

    const t = useCallback(
        (key: string, replacements?: Record<string, string | number>) => {
            let str = getNested(translations, key) ?? key;
            if (replacements !== undefined) {
                for (const [placeholder, value] of Object.entries(replacements)) {
                    str = str.replaceAll(`:${placeholder}`, String(value));
                }
            }

            return str;
        },
        [translations],
    );

    return { t, locale };
}
