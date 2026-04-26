<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterUserRequest;
use App\Models\User;
use App\Services\Auth\EmailVerificationCodeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
        $user = User::create(array_merge($request->validated(), [
            'preferred_locale' => $this->resolveInitialLocale($request),
        ]));

        Auth::login($user);

        $verification->sendInitialCode($user);

        return redirect()
            ->route('verification.code.show')
            ->with('success', __('frontend.flash.register_success'));
    }

    /**
     * @return non-falsy-string
     */
    private function resolveInitialLocale(Request $request): string
    {
        $supported = config('locales.supported', ['es', 'en']);
        $sessionLocale = $request->session()->get('locale');
        if (is_string($sessionLocale) && in_array($sessionLocale, $supported, true)) {
            return $sessionLocale;
        }

        return config('locales.default', config('app.locale'));
    }
}
