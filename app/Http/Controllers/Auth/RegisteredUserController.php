<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterUserRequest;
use App\Models\User;
use App\Services\Auth\EmailVerificationCodeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Muestra el formulario de registro.
     */
    public function create(): Response
    {
        return Inertia::render('Register', [
            'canRegisterWithGoogle' => filled(config('services.google.client_id'))
                && filled(config('services.google.client_secret')),
        ]);
    }

    /**
     * Registra un usuario con email y contraseña.
     */
    public function store(RegisterUserRequest $request, EmailVerificationCodeService $verification): RedirectResponse
    {
        $user = User::create($request->validated());

        Auth::login($user);

        $verification->sendInitialCode($user);

        return redirect()
            ->route('verification.code.show')
            ->with('success', 'Te enviamos un código de 6 dígitos a tu correo. Ingresalo para verificar tu cuenta.');
    }
}
