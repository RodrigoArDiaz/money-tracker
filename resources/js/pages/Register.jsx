import { Head, Link, useForm, usePage } from '@inertiajs/react';

import Alert from '../components/atoms/Alert';
import AuthPanelDivider from '../components/atoms/AuthPanelDivider';
import PasswordInput from '../components/atoms/PasswordInput';
import PrimaryButton from '../components/atoms/PrimaryButton';
import TextInput from '../components/atoms/TextInput';
import FormField from '../components/molecules/FormField';
import GoogleOAuthLink from '../components/molecules/GoogleOAuthLink';

export default function Register({ canRegisterWithGoogle }) {
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
        <div className="min-h-screen flex items-center justify-center bg-[#FDFDFC] dark:bg-[#0a0a0a] text-[#1b1b18] dark:text-[#EDEDEC] px-4 py-10">
            <Head title="Registro" />
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#161615] shadow-sm p-8">
                    <h1 className="text-xl font-semibold mb-1 text-center">Crear cuenta</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                        Regístrate con Google o con tu correo.
                    </p>

                    {flash?.error && (
                        <Alert variant="danger" className="mb-4">
                            {flash.error}
                        </Alert>
                    )}

                    {canRegisterWithGoogle && <GoogleOAuthLink href="/auth/google">Continuar con Google</GoogleOAuthLink>}

                    <AuthPanelDivider>o con email</AuthPanelDivider>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField label="Nombre" htmlFor="first_name" error={errors.first_name}>
                                <TextInput
                                    id="first_name"
                                    type="text"
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                    autoComplete="given-name"
                                    required
                                />
                            </FormField>
                            <FormField label="Apellido" htmlFor="last_name" error={errors.last_name}>
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

                        <FormField
                            label="Contraseña"
                            htmlFor="password"
                            error={errors.password}
                            hint="Mínimo 12 caracteres, con mayúsculas y minúsculas, al menos un número y un símbolo."
                        >
                            <PasswordInput
                                id="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="new-password"
                                required
                                toggleShowAriaLabel="Mostrar contraseña"
                                toggleHideAriaLabel="Ocultar contraseña"
                            />
                        </FormField>

                        <FormField
                            label="Confirmar contraseña"
                            htmlFor="password_confirmation"
                            error={errors.password_confirmation}
                        >
                            <PasswordInput
                                id="password_confirmation"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                                required
                                toggleShowAriaLabel="Mostrar confirmación de contraseña"
                                toggleHideAriaLabel="Ocultar confirmación de contraseña"
                            />
                        </FormField>

                        <PrimaryButton type="submit" disabled={processing}>
                            {processing ? 'Creando cuenta…' : 'Registrarse'}
                        </PrimaryButton>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        ¿Ya tenés cuenta?{' '}
                        <Link href="/" className="font-medium text-[#1b1b18] dark:text-[#EDEDEC] hover:underline">
                            Iniciar sesión
                        </Link>
                        {' · '}
                        <Link href="/" className="font-medium text-[#1b1b18] dark:text-[#EDEDEC] hover:underline">
                            Inicio
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
