import { Head } from '@inertiajs/react';

import ThemeMenu from '@/components/molecules/ThemeMenu';
import AuthLoginPanel from '../components/organisms/AuthLoginPanel';

export default function Welcome({ canLoginWithGoogle }) {
    return (
        <div className="relative min-h-screen flex flex-col bg-background text-foreground lg:flex-row">
            <div className="fixed right-4 top-4 z-50">
                <ThemeMenu align="end" />
            </div>
            <Head title="Money Tracker — Iniciar sesión" />
            <aside className="flex flex-1 flex-col justify-center border-b border-border px-6 py-12 lg:w-1/2 lg:border-b-0 lg:border-r lg:px-12 lg:py-16">
                <div className="mx-auto max-w-md text-center lg:text-left">
                    <h1 className="text-3xl font-semibold tracking-tight mb-3 lg:text-4xl">Money Tracker</h1>
                    <p className="text-muted-foreground text-balance text-base leading-relaxed">
                        Gestioná tus gastos diarios con claridad: registrá cada movimiento, revisá el resumen y mantené el
                        rumbo de tus finanzas.
                    </p>
                </div>
            </aside>
            <main className="flex flex-1 flex-col justify-center px-4 py-10 lg:w-1/2 lg:px-8 lg:py-16">
                <AuthLoginPanel canLoginWithGoogle={canLoginWithGoogle} />
            </main>
        </div>
    );
}
