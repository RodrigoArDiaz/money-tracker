<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    /**
     * La pantalla de acceso vive en la ruta home (/); mantenemos /login como redirección por compatibilidad.
     */
    public function create(): RedirectResponse
    {
        return redirect()->route('home');
    }

    /**
     * Autentica con email y contraseña. Si el correo no está verificado, redirige al flujo de código.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        if (! Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => __('frontend.auth.invalid_credentials'),
            ]);
        }

        $request->session()->regenerate();

        $user = Auth::user();
        if ($user === null) {
            throw ValidationException::withMessages([
                'email' => __('frontend.auth.invalid_credentials'),
            ]);
        }

        if ($user->requiresEmailVerificationCode()) {
            return redirect()
                ->route('verification.code.show')
                ->with('success', __('frontend.flash.verify_email_prompt'));
        }

        return redirect()->intended(route('dashboard'));
    }
}
