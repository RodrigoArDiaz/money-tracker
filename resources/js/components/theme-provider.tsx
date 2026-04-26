import * as React from 'react';

/** Debe coincidir con el script inline en `resources/views/app.blade.php`. */
export const THEME_STORAGE_KEY = 'money-tracker-theme';

export type Theme = 'light' | 'dark' | 'system';

type ThemeContextValue = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStoredTheme(): Theme {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
    }

    return 'system';
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
    return theme === 'system' ? getSystemTheme() : theme;
}

function applyDomTheme(resolved: 'light' | 'dark'): void {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.style.colorScheme = resolved === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }): React.ReactElement {
    const [theme, setThemeState] = React.useState<Theme>(() => readStoredTheme());
    const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>(() => resolveTheme(readStoredTheme()));

    React.useEffect(() => {
        applyDomTheme(resolvedTheme);
    }, [resolvedTheme]);

    React.useEffect(() => {
        if (theme !== 'system') {
            return;
        }
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (): void => {
            setResolvedTheme(getSystemTheme());
        };
        media.addEventListener('change', onChange);

        return () => media.removeEventListener('change', onChange);
    }, [theme]);

    const setTheme = React.useCallback((next: Theme) => {
        localStorage.setItem(THEME_STORAGE_KEY, next);
        setThemeState(next);
        const resolved = resolveTheme(next);
        setResolvedTheme(resolved);
        applyDomTheme(resolved);
    }, []);

    const value = React.useMemo(
        () => ({
            theme,
            setTheme,
            resolvedTheme,
        }),
        [theme, setTheme, resolvedTheme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const context = React.useContext(ThemeContext);
    if (context === null) {
        throw new Error('useTheme debe usarse dentro de ThemeProvider.');
    }

    return context;
}
