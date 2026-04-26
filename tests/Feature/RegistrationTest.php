<?php

namespace Tests\Feature;

use App\Mail\VerificationCodeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_register_page_displays(): void
    {
        $response = $this->get(route('register'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Register'));
    }

    public function test_user_can_register_with_password(): void
    {
        Mail::fake();

        $response = $this->post(route('register'), [
            'first_name' => 'Ana',
            'last_name' => 'García',
            'email' => 'ana@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertRedirect(route('verification.code.show'));
        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'ana@example.com',
            'first_name' => 'Ana',
            'last_name' => 'García',
        ]);

        $user = User::where('email', 'ana@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNull($user->email_verified_at);
        Mail::assertSent(VerificationCodeMail::class);
    }

    public function test_registration_requires_valid_email(): void
    {
        $this->post(route('register'), [
            'first_name' => 'Ana',
            'last_name' => 'García',
            'email' => 'not-an-email',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertSessionHasErrors('email');
    }

    public function test_registration_rejects_weak_password(): void
    {
        $this->post(route('register'), [
            'first_name' => 'Ana',
            'last_name' => 'García',
            'email' => 'ana2@example.com',
            'password' => 'solo-minusculas',
            'password_confirmation' => 'solo-minusculas',
        ])->assertSessionHasErrors('password');
    }

    public function test_registration_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->post(route('register'), [
            'first_name' => 'Ana',
            'last_name' => 'García',
            'email' => 'taken@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertSessionHasErrors('email');
    }

    public function test_registration_rejects_password_confirmation_mismatch(): void
    {
        $this->post(route('register'), [
            'first_name' => 'Ana',
            'last_name' => 'García',
            'email' => 'mismatch@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password124!',
        ])->assertSessionHasErrors('password');
    }
}
