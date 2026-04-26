import { Head } from '@inertiajs/react';

import AuthLoginPanel from '../components/organisms/AuthLoginPanel';

export default function Welcome({ canLoginWithGoogle }) {
    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#FDFDFC] dark:bg-[#0a0a0a] text-[#1b1b18] dark:text-[#EDEDEC]">
            <Head title="Money Tracker — Iniciar sesión" />
            <aside className="flex flex-1 flex-col justify-center border-b border-black/10 px-6 py-12 dark:border-white/10 lg:w-1/2 lg:border-b-0 lg:border-r lg:px-12 lg:py-16">
                <div className="mx-auto max-w-md text-center lg:text-left">
                    <h1 className="text-3xl font-semibold tracking-tight mb-3 lg:text-4xl">Money Tracker</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-balance text-base leading-relaxed">
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
