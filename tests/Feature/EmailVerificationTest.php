<?php

namespace Tests\Feature;

use App\Mail\VerificationCodeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_verify_page_redirects_when_already_verified(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('verification.code.show'))
            ->assertRedirect(route('home'));
    }

    public function test_user_can_verify_email_with_code_from_mail(): void
    {
        Mail::fake();

        $this->post(route('register'), [
            'first_name' => 'Ana',
            'last_name' => 'García',
            'email' => 'ana-verify@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertRedirect(route('verification.code.show'));

        $this->assertAuthenticated();

        $user = User::where('email', 'ana-verify@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNull($user->email_verified_at);

        Mail::assertSent(VerificationCodeMail::class);

        /** @var VerificationCodeMail $mailable */
        $mailable = Mail::sent(VerificationCodeMail::class)->first();
        $this->assertMatchesRegularExpression('/^[0-9]{6}$/', $mailable->plainCode);

        $this->post(route('verification.code.verify'), [
            'code' => $mailable->plainCode,
        ])->assertRedirect(route('home'));

        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
        $this->assertNull($user->email_verification_code_hash);
    }

    public function test_wrong_code_returns_validation_error(): void
    {
        Mail::fake();

        $this->post(route('register'), [
            'first_name' => 'Bo',
            'last_name' => 'Test',
            'email' => 'bo@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $this->post(route('verification.code.verify'), [
            'code' => '000000',
        ])->assertSessionHasErrors('code');
    }

    public function test_resend_within_cooldown_fails(): void
    {
        Mail::fake();

        $this->post(route('register'), [
            'first_name' => 'Co',
            'last_name' => 'Test',
            'email' => 'co@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        Mail::assertSent(VerificationCodeMail::class, 1);

        $this->actingAs(User::where('email', 'co@example.com')->first());
        $this->post(route('verification.code.resend'))->assertSessionHasErrors('resend');

        Mail::assertSent(VerificationCodeMail::class, 1);
    }

    public function test_resend_after_cooldown_sends_new_mail(): void
    {
        Mail::fake();

        $this->post(route('register'), [
            'first_name' => 'Do',
            'last_name' => 'Test',
            'email' => 'do@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $this->actingAs(User::where('email', 'do@example.com')->first());

        $this->travel(61)->seconds();

        $this->post(route('verification.code.resend'))->assertRedirect();

        Mail::assertSent(VerificationCodeMail::class, 2);
    }
}
