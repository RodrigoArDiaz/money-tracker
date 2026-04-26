import { Head, Link, useForm, usePage } from '@inertiajs/react';

import Alert from '../components/atoms/Alert';
import FieldError from '../components/atoms/FieldError';
import Label from '../components/atoms/Label';
import PrimaryButton from '../components/atoms/PrimaryButton';
import TextInput from '../components/atoms/TextInput';

export default function VerifyEmail({ email }) {
    const { flash } = usePage().props;
    const verifyForm = useForm({ code: '' });
    const resendForm = useForm({});

    function submitVerify(e) {
        e.preventDefault();
        verifyForm.post('/email/verify');
    }

    function submitResend(e) {
        e.preventDefault();
        resendForm.post('/email/verification-notification');
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFDFC] dark:bg-[#0a0a0a] text-[#1b1b18] dark:text-[#EDEDEC] px-4 py-10">
            <Head title="Verificar correo" />
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#161615] shadow-sm p-8">
                    <h1 className="text-xl font-semibold mb-1 text-center">Verificá tu correo</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                        Enviamos un código de 6 dígitos a <span className="font-medium text-[#1b1b18] dark:text-[#EDEDEC]">{email}</span>.
                    </p>

                    {flash?.success && (
                        <Alert variant="success" role="status" className="mb-4">
                            {flash.success}
                        </Alert>
                    )}

                    <form onSubmit={submitVerify} className="space-y-4">
                        <div>
                            <Label htmlFor="code">Código</Label>
                            <TextInput
                                id="code"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                value={verifyForm.data.code}
                                onChange={(e) => verifyForm.setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="text-center text-lg tracking-[0.5em] font-mono"
                                required
                            />
                            <FieldError message={verifyForm.errors.code} />
                        </div>

                        <PrimaryButton type="submit" disabled={verifyForm.processing}>
                            {verifyForm.processing ? 'Verificando…' : 'Verificar'}
                        </PrimaryButton>
                    </form>

                    <form onSubmit={submitResend} className="mt-4">
                        <button
                            type="submit"
                            disabled={resendForm.processing}
                            className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-[#1b1b18] dark:hover:text-[#EDEDEC] disabled:opacity-50"
                        >
                            {resendForm.processing ? 'Enviando…' : 'Reenviar código'}
                        </button>
                        <FieldError message={resendForm.errors.resend} />
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        <Link href="/" className="font-medium text-[#1b1b18] dark:text-[#EDEDEC] hover:underline">
                            Volver al inicio
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
