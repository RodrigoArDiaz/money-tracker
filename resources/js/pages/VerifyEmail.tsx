import type { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import FullscreenToggle from '@/components/molecules/FullscreenToggle';
import LocaleSwitcher from '@/components/molecules/LocaleSwitcher';
import ThemeMenu from '@/components/molecules/ThemeMenu';
import FieldError from '@/components/atoms/FieldError';
import Label from '@/components/atoms/Label';
import PrimaryButton from '@/components/atoms/PrimaryButton';
import TextInput from '@/components/atoms/TextInput';
import { useTranslate } from '@/hooks/use-translate';

type VerifyEmailProps = {
    email: string;
};

export default function VerifyEmail({ email }: VerifyEmailProps) {
    const { t } = useTranslate();
    const verifyForm = useForm({ code: '' });
    const resendForm = useForm({});

    function submitVerify(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        verifyForm.post('/email/verify');
    }

    function submitResend(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        resendForm.post('/email/verification-notification');
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
            <div className="fixed right-4 top-4 z-50 flex items-center gap-1">
                <LocaleSwitcher align="end" />
                <FullscreenToggle />
                <ThemeMenu align="end" />
            </div>
            <Head title={t('verify_email.head_title')} />
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-border bg-card/90 p-8 text-card-foreground shadow-sm backdrop-blur-sm">
                    <h1 className="mb-1 text-center text-xl font-semibold">{t('verify_email.title')}</h1>
                    <p className="mb-6 text-center text-sm text-muted-foreground">
                        {t('verify_email.intro')} <span className="font-medium text-foreground">{email}</span>.
                    </p>

                    <form onSubmit={submitVerify} className="space-y-4">
                        <div>
                            <Label htmlFor="code">{t('verify_email.code_label')}</Label>
                            <TextInput
                                id="code"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                value={verifyForm.data.code}
                                onChange={(e) =>
                                    verifyForm.setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))
                                }
                                className="text-center font-mono text-lg tracking-[0.5em]"
                                required
                            />
                            <FieldError message={verifyForm.errors.code} />
                        </div>

                        <PrimaryButton type="submit" disabled={verifyForm.processing}>
                            {verifyForm.processing ? t('verify_email.verifying') : t('verify_email.verify')}
                        </PrimaryButton>
                    </form>

                    <form onSubmit={submitResend} className="mt-4">
                        <button
                            type="submit"
                            disabled={resendForm.processing}
                            className="w-full text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                            {resendForm.processing ? t('verify_email.sending') : t('verify_email.resend')}
                        </button>
                        <FieldError message={(resendForm.errors as { resend?: string }).resend} />
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        <Link href="/" className="font-medium text-foreground hover:underline">
                            {t('verify_email.back_home')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
