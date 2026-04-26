import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

createInertiaApp({
    resolve: (name) => {
        const jsxPages = import.meta.glob('./pages/**/*.jsx');
        const tsxPages = import.meta.glob('./pages/**/*.tsx');
        const load = jsxPages[`./pages/${name}.jsx`] ?? tsxPages[`./pages/${name}.tsx`];
        if (!load) {
            throw new Error(`Página no encontrada: ${name}`);
        }

        return load();
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});
