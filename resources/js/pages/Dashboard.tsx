import { Head, usePage } from '@inertiajs/react';

import Alert from '@/components/atoms/Alert';
import AppDashboardLayout from '@/components/layouts/AppDashboardLayout';

export default function Dashboard() {
    const { flash } = usePage<{ flash: { success?: string } }>().props;

    return (
        <AppDashboardLayout title="Inicio">
            <Head title="Panel — Money Tracker" />
            {flash?.success ? (
                <Alert variant="success" role="status">
                    {flash.success}
                </Alert>
            ) : null}
            <section className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
                <h2 className="text-lg font-semibold tracking-tight">Bienvenido</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
                    Este es tu panel principal. Desde aquí podrás ver el resumen de tus finanzas cuando añadamos las
                    siguientes funciones.
                </p>
            </section>
        </AppDashboardLayout>
    );
}
