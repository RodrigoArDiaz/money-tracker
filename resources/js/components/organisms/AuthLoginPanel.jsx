import { Link, useForm, usePage } from '@inertiajs/react';

import { useTranslate } from '@/hooks/use-translate';
import Alert from '../atoms/Alert';
import AuthPanelDivider from '../atoms/AuthPanelDivider';
import PasswordInput from '../atoms/PasswordInput';
import PrimaryButton from '../atoms/PrimaryButton';
import TextInput from '../atoms/TextInput';
import FormField from '../molecules/FormField';
import GoogleOAuthLink from '../molecules/GoogleOAuthLink';

export default function AuthLoginPanel({ canLoginWithGoogle }) {
    const { t } = useTranslate();
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e) {
        e.preventDefault();
        post('/login');
    }

    return (
        <div className="mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-border bg-card/90 p-8 text-card-foreground shadow-sm backdrop-blur-sm">
                <h2 className="mb-1 text-center text-xl font-semibold">{t('auth.login_title')}</h2>
                <p className="mb-6 text-center text-sm text-muted-foreground">{t('auth.login_subtitle')}</p>

                {flash?.error && (
                    <Alert variant="danger" className="mb-4">
                        {flash.error}
                    </Alert>
                )}

                {flash?.success && (
                    <Alert variant="success" role="status" className="mb-4">
                        {flash.success}
                    </Alert>
                )}

                {canLoginWithGoogle && (
                    <GoogleOAuthLink href="/auth/google">{t('auth.continue_google')}</GoogleOAuthLink>
                )}

                <AuthPanelDivider>{t('auth.divider_email')}</AuthPanelDivider>

                <form onSubmit={submit} className="space-y-4">
                    <FormField label={t('auth.email')} htmlFor="email" error={errors.email}>
                        <TextInput
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </FormField>

                    <FormField label={t('auth.password')} htmlFor="password" error={errors.password}>
                        <PasswordInput
                            id="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="current-password"
                            required
                            toggleShowAriaLabel={t('register.show_password')}
                            toggleHideAriaLabel={t('register.hide_password')}
                        />
                    </FormField>

                    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-input"
                        />
                        {t('auth.remember')}
                    </label>

                    <PrimaryButton type="submit" disabled={processing}>
                        {processing ? t('auth.signing_in') : t('auth.sign_in')}
                    </PrimaryButton>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    {t('auth.no_account')}{' '}
                    <Link href="/register" className="font-medium text-foreground hover:underline">
                        {t('auth.register_link')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
