import { Head, Link, usePage } from '@inertiajs/react';

import Alert from '../components/atoms/Alert';
import AuthLoginPanel from '../components/organisms/AuthLoginPanel';

export default function Welcome({ canLoginWithGoogle }) {
    const { auth, flash } = usePage().props;

    if (auth?.user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFC] dark:bg-[#0a0a0a] text-[#1b1b18] dark:text-[#EDEDEC] px-4">
                <Head title="Money Tracker" />
                <div className="text-center p-8 max-w-lg">
                    <h1 className="text-3xl font-semibold tracking-tight mb-2">Money Tracker</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-balance">
                        Llevá el control de tus gastos del día a día: registrá movimientos, mirá el resumen y mantené tus
                        finanzas claras.
                    </p>

                    {flash?.success && (
                        <Alert variant="success" role="status" className="mb-4">
                            {flash.success}
                        </Alert>
                    )}

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Sesión como{' '}
                        <span className="font-medium text-[#1b1b18] dark:text-[#EDEDEC]">{auth.user.name}</span>
                    </p>

                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="inline-flex items-center rounded-lg border border-black/20 dark:border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-[#1b1b18] dark:text-[#EDEDEC] hover:bg-black/[0.04] dark:hover:bg-white/10"
                    >
                        Cerrar sesión
                    </Link>
                </div>
            </div>
        );
    }

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
