import '../css/app.css';

import { AppToaster } from '@/components/AppToaster';
import { FlashToasts } from '@/components/FlashToasts';
import LocaleSync from '@/components/LocaleSync';
import { ThemeProvider } from '@/components/theme-provider';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

createInertiaApp({
    resolve: async (name) => {
        const jsxPages = import.meta.glob('./pages/**/*.jsx');
        const tsxPages = import.meta.glob('./pages/**/*.tsx');
        const load = jsxPages[`./pages/${name}.jsx`] ?? tsxPages[`./pages/${name}.tsx`];
        if (!load) {
            throw new Error(`Página no encontrada: ${name}`);
        }

        const pageModule = await load();
        const Page = pageModule.default;

        // No reasignar `pageModule.default`: en ESM es de solo lectura.
                return {
                    ...pageModule,
                    default: function InertiaPageShell(props) {
                        return (
                            <>
                                <LocaleSync />
                                <Page {...props} />
                            </>
                        );
                    },
                };
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
