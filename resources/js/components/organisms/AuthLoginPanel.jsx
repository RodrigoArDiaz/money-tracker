import { Link, useForm, usePage } from '@inertiajs/react';

import Alert from '../atoms/Alert';
import AuthPanelDivider from '../atoms/AuthPanelDivider';
import PasswordInput from '../atoms/PasswordInput';
import PrimaryButton from '../atoms/PrimaryButton';
import TextInput from '../atoms/TextInput';
import FormField from '../molecules/FormField';
import GoogleOAuthLink from '../molecules/GoogleOAuthLink';

export default function AuthLoginPanel({ canLoginWithGoogle }) {
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
        <div className="w-full max-w-md mx-auto">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#161615] shadow-sm p-8">
                <h2 className="text-xl font-semibold mb-1 text-center">Iniciar sesión</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                    Entrá con Google o con tu correo y contraseña.
                </p>

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

                {canLoginWithGoogle && <GoogleOAuthLink href="/auth/google">Continuar con Google</GoogleOAuthLink>}

                <AuthPanelDivider>o con email</AuthPanelDivider>

                <form onSubmit={submit} className="space-y-4">
                    <FormField label="Correo electrónico" htmlFor="email" error={errors.email}>
                        <TextInput
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </FormField>

                    <FormField label="Contraseña" htmlFor="password" error={errors.password}>
                        <PasswordInput
                            id="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="current-password"
                            required
                            toggleShowAriaLabel="Mostrar contraseña"
                            toggleHideAriaLabel="Ocultar contraseña"
                        />
                    </FormField>

                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-black/20 dark:border-white/20"
                        />
                        Recordarme en este dispositivo
                    </label>

                    <PrimaryButton type="submit" disabled={processing}>
                        {processing ? 'Entrando…' : 'Entrar'}
                    </PrimaryButton>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    ¿No tenés cuenta?{' '}
                    <Link href="/register" className="font-medium text-[#1b1b18] dark:text-[#EDEDEC] hover:underline">
                        Registrarse
                    </Link>
                </p>
            </div>
        </div>
    );
}
