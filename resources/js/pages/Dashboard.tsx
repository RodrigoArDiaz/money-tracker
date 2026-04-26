import { Head } from '@inertiajs/react';

import AppDashboardLayout from '@/components/layouts/AppDashboardLayout';
import { useTranslate } from '@/hooks/use-translate';

export default function Dashboard() {
    const { t } = useTranslate();

    return (
        <AppDashboardLayout title={t('dashboard.title')}>
            <Head title={t('dashboard.head_title')} />
            <section className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
                <h2 className="text-lg font-semibold tracking-tight">{t('dashboard.welcome_heading')}</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
                    {t('dashboard.welcome_text')}
                </p>
            </section>
        </AppDashboardLayout>
    );
}
