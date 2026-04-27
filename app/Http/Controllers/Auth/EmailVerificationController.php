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
            return redirect()->route('home');
        }

        if (! $user->requiresEmailVerificationCode()) {
            return redirect()->route('home');
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
            return redirect()->route('home');
        }

        $service->verify($user, $request->validated('code'));

        return redirect()->route('home')->with('success', __('frontend.flash.email_verified'));
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
            return redirect()->route('home');
        }

        try {
            $service->resend($user);
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', __('frontend.flash.verification_code_resent'));
    }
}
