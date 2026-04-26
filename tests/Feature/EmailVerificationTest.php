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

    public function test_unverified_manual_user_visiting_home_is_redirected_to_verification(): void
    {
        $user = User::factory()->unverified()->create([
            'password' => 'Password123!',
            'google_id' => null,
        ]);

        $this->actingAs($user)
            ->get(route('home'))
            ->assertRedirect(route('verification.code.show'));
    }

    public function test_unverified_user_with_google_id_is_not_forced_to_code_verification(): void
    {
        $user = User::factory()->unverified()->create([
            'password' => 'Password123!',
            'google_id' => 'google-xyz',
        ]);

        $this->actingAs($user)
            ->get(route('home'))
            ->assertOk();
    }

    public function test_guest_cannot_access_verify_routes(): void
    {
        $this->get(route('verification.code.show'))->assertRedirect(route('home'));

        $this->post(route('verification.code.verify'), ['code' => '123456'])->assertRedirect(route('home'));

        $this->post(route('verification.code.resend'))->assertRedirect(route('home'));
    }

    public function test_verify_rejects_invalid_code_format(): void
    {
        Mail::fake();

        $this->post(route('register'), [
            'first_name' => 'E1',
            'last_name' => 'Test',
            'email' => 'e1@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $this->post(route('verification.code.verify'), [
            'code' => '12345',
        ])->assertSessionHasErrors('code');

        $this->post(route('verification.code.verify'), [
            'code' => 'abcdef',
        ])->assertSessionHasErrors('code');
    }

    public function test_verify_rejects_expired_code(): void
    {
        Mail::fake();

        $this->post(route('register'), [
            'first_name' => 'E2',
            'last_name' => 'Test',
            'email' => 'e2@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        /** @var VerificationCodeMail $mailable */
        $mailable = Mail::sent(VerificationCodeMail::class)->first();
        $code = $mailable->plainCode;

        $this->travel(16)->minutes();

        $this->post(route('verification.code.verify'), [
            'code' => $code,
        ])->assertSessionHasErrors('code');

        $this->assertDatabaseHas('users', [
            'email' => 'e2@example.com',
            'email_verified_at' => null,
        ]);
    }

    public function test_verify_locks_after_max_failed_attempts(): void
    {
        Mail::fake();

        $this->post(route('register'), [
            'first_name' => 'E3',
            'last_name' => 'Test',
            'email' => 'e3@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->post(route('verification.code.verify'), [
                'code' => '000000',
            ])->assertSessionHasErrors('code');
        }

        $response = $this->post(route('verification.code.verify'), [
            'code' => '000000',
        ]);

        $response->assertSessionHasErrors('code');
        $messages = session('errors')->get('code');
        $this->assertIsArray($messages);
        $this->assertStringContainsString('Demasiados intentos', $messages[0]);
    }

    public function test_verify_redirects_home_when_already_verified(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('verification.code.verify'), [
            'code' => '123456',
        ])->assertRedirect(route('home'));
    }

    public function test_resend_redirects_home_when_already_verified(): void
    {
        Mail::fake();

        $user = User::factory()->create();

        $this->actingAs($user)->post(route('verification.code.resend'))->assertRedirect(route('home'));

        Mail::assertNothingSent();
    }
}
