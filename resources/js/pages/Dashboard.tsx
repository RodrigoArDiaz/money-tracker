import { Head, usePage } from '@inertiajs/react';

import Alert from '@/components/atoms/Alert';
import AppDashboardLayout from '@/components/layouts/AppDashboardLayout';
import { useTranslate } from '@/hooks/use-translate';

export default function Dashboard() {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const { t } = useTranslate();

    return (
        <AppDashboardLayout title={t('dashboard.title')}>
            <Head title={t('dashboard.head_title')} />
            {flash?.success ? (
                <Alert variant="success" role="status">
                    {flash.success}
                </Alert>
            ) : null}
            <section className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
                <h2 className="text-lg font-semibold tracking-tight">{t('dashboard.welcome_heading')}</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
                    {t('dashboard.welcome_text')}
                </p>
            </section>
        </AppDashboardLayout>
    );
}
