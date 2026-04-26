<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use Throwable;

class GoogleAuthController extends Controller
{
    /**
     * Redirige al flujo OAuth de Google.
     */
    public function redirect(): RedirectResponse|\Symfony\Component\HttpFoundation\RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Recibe el callback de Google y autentica o crea el usuario.
     */
    public function callback(): RedirectResponse
    {
        try {
            $socialUser = Socialite::driver('google')->user();
        } catch (InvalidStateException|Throwable) {
            return redirect()
                ->route('register')
                ->with('error', 'La sesión de Google expiró o fue rechazada. Intenta de nuevo.');
        }

        $email = $socialUser->getEmail();
        if (! $email) {
            return redirect()
                ->route('register')
                ->with('error', 'Google no devolvió un correo. No se puede crear la cuenta.');
        }

        $raw = $socialUser->user ?? [];
        $firstName = $raw['given_name'] ?? null;
        $lastName = $raw['family_name'] ?? null;
        if (! $firstName && ! $lastName && $socialUser->getName()) {
            $parts = preg_split('/\s+/', trim($socialUser->getName()), 2, PREG_SPLIT_NO_EMPTY);
            $firstName = $parts[0] ?? '';
            $lastName = $parts[1] ?? '';
        }
        $firstName = $firstName ?: (explode('@', $email)[0] ?? 'Usuario');
        $lastName = $lastName ?? '';

        $user = User::firstOrNew(['email' => $email]);
        $user->google_id = $socialUser->getId();

        if (! $user->exists) {
            $user->first_name = $firstName;
            $user->last_name = $lastName;
            $user->password = null;
            $user->email_verified_at = now();
        } else {
            $user->email_verified_at = $user->email_verified_at ?? now();
        }

        $user->save();

        Auth::login($user, remember: true);

        return redirect()
            ->route('home')
            ->with('success', 'Sesión iniciada con Google.');
    }
}
