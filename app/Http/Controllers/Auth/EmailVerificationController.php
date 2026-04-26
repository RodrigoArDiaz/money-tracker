<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\VerifyEmailCodeRequest;
use App\Services\Auth\EmailVerificationCodeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationController extends Controller
{
    /**
     * Formulario para ingresar el código enviado por correo.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        if ($user === null) {
            return redirect()->route('home');
        }
        if ($user->hasVerifiedEmail()) {
            return redirect()->route('dashboard');
        }

        if (! $user->requiresEmailVerificationCode()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('VerifyEmail', [
            'email' => $user->email,
        ]);
    }

    /**
     * Comprueba el código y marca el correo como verificado.
     */
    public function store(VerifyEmailCodeRequest $request, EmailVerificationCodeService $service): RedirectResponse
    {
        $user = $request->user();
        if ($user === null || ! $user->requiresEmailVerificationCode()) {
            return $user === null
                ? redirect()->route('home')
                : redirect()->route('dashboard');
        }

        $service->verify($user, $request->validated('code'));

        return redirect()->route('dashboard')->with('success', 'Correo verificado correctamente.');
    }

    /**
     * Reenvía un código nuevo (con cooldown entre envíos).
     */
    public function resend(Request $request, EmailVerificationCodeService $service): RedirectResponse
    {
        $user = $request->user();
        if ($user === null) {
            return redirect()->route('home');
        }

        if ($user->hasVerifiedEmail() || ! $user->requiresEmailVerificationCode()) {
            return redirect()->route('dashboard');
        }

        try {
            $service->resend($user);
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'Te enviamos un código nuevo.');
    }
}
