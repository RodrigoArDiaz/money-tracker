import { Head, Link, useForm, usePage } from '@inertiajs/react';

import LocaleSwitcher from '@/components/molecules/LocaleSwitcher';
import ThemeMenu from '@/components/molecules/ThemeMenu';
import { useTranslate } from '@/hooks/use-translate';
import Alert from '../components/atoms/Alert';
import AuthPanelDivider from '../components/atoms/AuthPanelDivider';
import PasswordInput from '../components/atoms/PasswordInput';
import PrimaryButton from '../components/atoms/PrimaryButton';
import TextInput from '../components/atoms/TextInput';
import FormField from '../components/molecules/FormField';
import GoogleOAuthLink from '../components/molecules/GoogleOAuthLink';

export default function Register({ canRegisterWithGoogle }) {
    const { t } = useTranslate();
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        post('/register');
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
            <div className="fixed right-4 top-4 z-50 flex items-center gap-1">
                <LocaleSwitcher align="end" />
                <ThemeMenu align="end" />
            </div>
            <Head title={t('register.head_title')} />
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-border bg-card/90 p-8 text-card-foreground shadow-sm backdrop-blur-sm">
                    <h1 className="text-xl font-semibold mb-1 text-center">{t('register.title')}</h1>
                    <p className="text-sm text-muted-foreground text-center mb-6">{t('register.subtitle')}</p>

                    {flash?.error && (
                        <Alert variant="danger" className="mb-4">
                            {flash.error}
                        </Alert>
                    )}

                    {canRegisterWithGoogle && (
                        <GoogleOAuthLink href="/auth/google">{t('auth.continue_google')}</GoogleOAuthLink>
                    )}

                    <AuthPanelDivider>{t('auth.divider_email')}</AuthPanelDivider>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField label={t('register.first_name')} htmlFor="first_name" error={errors.first_name}>
                                <TextInput
                                    id="first_name"
                                    type="text"
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                    autoComplete="given-name"
                                    required
                                />
                            </FormField>
                            <FormField label={t('register.last_name')} htmlFor="last_name" error={errors.last_name}>
                                <TextInput
                                    id="last_name"
                                    type="text"
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                    autoComplete="family-name"
                                    required
                                />
                            </FormField>
                        </div>

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

                        <FormField
                            label={t('auth.password')}
                            htmlFor="password"
                            error={errors.password}
                            hint={t('register.password_hint')}
                        >
                            <PasswordInput
                                id="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="new-password"
                                required
                                toggleShowAriaLabel={t('register.show_password')}
                                toggleHideAriaLabel={t('register.hide_password')}
                            />
                        </FormField>

                        <FormField
                            label={t('register.password_confirm')}
                            htmlFor="password_confirmation"
                            error={errors.password_confirmation}
                        >
                            <PasswordInput
                                id="password_confirmation"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                                required
                                toggleShowAriaLabel={t('register.show_password_confirm')}
                                toggleHideAriaLabel={t('register.hide_password_confirm')}
                            />
                        </FormField>

                        <PrimaryButton type="submit" disabled={processing}>
                            {processing ? t('register.submitting') : t('register.submit')}
                        </PrimaryButton>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        {t('register.has_account')}{' '}
                        <Link href="/" className="font-medium text-foreground hover:underline">
                            {t('register.sign_in_link')}
                        </Link>
                        {' · '}
                        <Link href="/" className="font-medium text-foreground hover:underline">
                            {t('register.home_link')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
