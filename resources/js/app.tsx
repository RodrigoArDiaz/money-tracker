import '../css/app.css';

import { AppToaster } from '@/components/AppToaster';
import { FlashToasts } from '@/components/FlashToasts';
import LocaleSync from '@/components/LocaleSync';
import { ThemeProvider } from '@/components/theme-provider';
import { createInertiaApp } from '@inertiajs/react';
import type { ComponentType } from 'react';
import type { ResolvedComponent } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

type InertiaPageModule = {
    default: ComponentType<Record<string, unknown>>;
} & Record<string, unknown>;

createInertiaApp({
    resolve: async (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx');
        const load = pages[`./pages/${name}.tsx`];
        if (!load) {
            throw new Error(`Página no encontrada: ${name}`);
        }

        const pageModule = (await load()) as InertiaPageModule;
        const Page = pageModule.default;

        const shell: ResolvedComponent = function InertiaPageShell(props) {
            return (
                <>
                    <LocaleSync />
                    <Page {...props} />
                </>
            );
        };

        /** El resolver CSR tipado solo lista `ReactComponent | Promise<ReactComponent>`; el runtime acepta el namespace del import dinámico (p. ej. `layout`). */
        return {
            ...pageModule,
            default: shell,
        } as unknown as ResolvedComponent;
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <ThemeProvider>
                <AppToaster />
                <FlashToasts />
                <App {...props} />
            </ThemeProvider>,
        );
    },
});
