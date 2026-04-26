<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    /**
     * Muestra el formulario de inicio de sesión.
     */
    public function create(): Response
    {
        return Inertia::render('Login', [
            'canLoginWithGoogle' => filled(config('services.google.client_id'))
                && filled(config('services.google.client_secret')),
        ]);
    }

    /**
     * Autentica con email y contraseña. Si el correo no está verificado, redirige al flujo de código.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        if (! Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => 'Credenciales incorrectas.',
            ]);
        }

        $request->session()->regenerate();

        $user = Auth::user();
        if ($user === null) {
            throw ValidationException::withMessages([
                'email' => 'Credenciales incorrectas.',
            ]);
        }

        if ($user->requiresEmailVerificationCode()) {
            return redirect()
                ->route('verification.code.show')
                ->with('success', 'Verificá tu correo con el código que te enviamos para continuar.');
        }

        return redirect()->intended(route('home'));
    }
}
