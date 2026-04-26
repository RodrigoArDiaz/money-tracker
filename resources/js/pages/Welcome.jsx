import { Link, usePage } from '@inertiajs/react';

import Alert from '../components/atoms/Alert';

export default function Welcome() {
    const { auth, flash } = usePage().props;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFC] dark:bg-[#0a0a0a] text-[#1b1b18] dark:text-[#EDEDEC] px-4">
            <div className="text-center p-8 max-w-lg">
                <h1 className="text-2xl font-semibold mb-2">Laravel + Inertia + React</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Listo para desarrollar.</p>

                {flash?.success && (
                    <Alert variant="success" role="status" className="mb-4">
                        {flash.success}
                    </Alert>
                )}

                {auth?.user ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Sesión como{' '}
                        <span className="font-medium text-[#1b1b18] dark:text-[#EDEDEC]">{auth.user.name}</span>
                    </p>
                ) : null}

                <div className="flex flex-wrap items-center justify-center gap-3">
                    {auth?.user ? (
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="inline-flex items-center rounded-lg border border-black/20 dark:border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-[#1b1b18] dark:text-[#EDEDEC] hover:bg-black/[0.04] dark:hover:bg-white/10"
                        >
                            Cerrar sesión
                        </Link>
                    ) : (
                        <Link
                            href="/register"
                            className="inline-flex items-center rounded-lg bg-[#1b1b18] dark:bg-[#EDEDEC] text-[#EDEDEC] dark:text-[#1b1b18] px-4 py-2 text-sm font-medium hover:opacity-90"
                        >
                            Registrarse
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
