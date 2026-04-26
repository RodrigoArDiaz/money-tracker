<?php

namespace App\Services\Auth;

use App\Mail\VerificationCodeMail;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Throwable;

class EmailVerificationCodeService
{
    public const CODE_LENGTH = 6;

    public const CODE_TTL_MINUTES = 15;

    public const MAX_ATTEMPTS = 5;

    public const LOCK_MINUTES = 30;

    public const RESEND_COOLDOWN_SECONDS = 60;

    /**
     * Genera un código numérico criptográficamente seguro, lo guarda con hash (bcrypt) y envía el correo.
     * No usar para reenvíos con cooldown; usar {@see resend()}.
     */
    public function sendInitialCode(User $user): void
    {
        if ($user->hasVerifiedEmail()) {
            return;
        }

        $this->deliverNewCode($user);
    }

    /**
     * Reenvía código respetando cooldown entre envíos.
     *
     * @throws ValidationException
     */
    public function resend(User $user): void
    {
        if ($user->hasVerifiedEmail()) {
            return;
        }

        if ($user->email_verification_sent_at !== null
            && $user->email_verification_sent_at->gt(now()->subSeconds(self::RESEND_COOLDOWN_SECONDS))) {
            throw ValidationException::withMessages([
                'resend' => __('frontend.verification_service.resend_wait'),
            ]);
        }

        $this->deliverNewCode($user);
    }

    /**
     * Verifica el código. Mensajes genéricos para no filtrar si el error es por expiración o por valor incorrecto.
     */
    public function verify(User $user, string $code): void
    {
        if ($user->hasVerifiedEmail()) {
            return;
        }

        if ($user->email_verification_locked_until !== null && $user->email_verification_locked_until->isFuture()) {
            throw ValidationException::withMessages([
                'code' => __('frontend.verification_service.code_locked'),
            ]);
        }

        if ($user->email_verification_code_hash === null || $user->email_verification_code_expires_at === null) {
            $this->registerFailedAttempt($user);
            throw ValidationException::withMessages([
                'code' => __('frontend.verification_service.code_invalid'),
            ]);
        }

        if ($user->email_verification_code_expires_at->isPast()) {
            $this->registerFailedAttempt($user);
            throw ValidationException::withMessages([
                'code' => __('frontend.verification_service.code_invalid'),
            ]);
        }

        if (! Hash::check($code, $user->email_verification_code_hash)) {
            $this->registerFailedAttempt($user);
            throw ValidationException::withMessages([
                'code' => __('frontend.verification_service.code_invalid'),
            ]);
        }

        $user->forceFill([
            'email_verified_at' => now(),
            'email_verification_code_hash' => null,
            'email_verification_code_expires_at' => null,
            'email_verification_failed_attempts' => 0,
            'email_verification_locked_until' => null,
        ])->save();
    }

    private function deliverNewCode(User $user): void
    {
        $plain = $this->generateNumericCode();

        $user->forceFill([
            'email_verification_code_hash' => Hash::make($plain),
            'email_verification_code_expires_at' => now()->addMinutes(self::CODE_TTL_MINUTES),
            'email_verification_sent_at' => now(),
            'email_verification_failed_attempts' => 0,
            'email_verification_locked_until' => null,
        ])->save();

        try {
            Mail::to($user->email)->send(new VerificationCodeMail(
                $plain,
                $user->first_name,
                self::CODE_TTL_MINUTES,
            ));
        } catch (Throwable $e) {
            $user->forceFill([
                'email_verification_code_hash' => null,
                'email_verification_code_expires_at' => null,
            ])->save();

            throw $e;
        }
    }

    private function generateNumericCode(): string
    {
        $max = 10 ** self::CODE_LENGTH;

        return str_pad((string) random_int(0, $max - 1), self::CODE_LENGTH, '0', STR_PAD_LEFT);
    }

    private function registerFailedAttempt(User $user): void
    {
        $attempts = $user->email_verification_failed_attempts + 1;

        $attributes = ['email_verification_failed_attempts' => $attempts];

        if ($attempts >= self::MAX_ATTEMPTS) {
            $attributes['email_verification_locked_until'] = now()->addMinutes(self::LOCK_MINUTES);
        }

        $user->forceFill($attributes)->save();
    }
}
