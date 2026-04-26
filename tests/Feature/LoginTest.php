<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_home_shows_welcome_with_login_for_guests(): void
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Welcome'));
    }

    public function test_login_get_redirects_to_home(): void
    {
        $this->get(route('login'))->assertRedirect(route('home'));
    }

    public function test_user_can_login_with_verified_email_and_password(): void
    {
        User::factory()->create([
            'email' => 'verified@example.com',
            'password' => 'Password123!',
            'email_verified_at' => now(),
        ]);

        $response = $this->post(route('login'), [
            'email' => 'verified@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticated();
    }

    public function test_user_with_unverified_email_is_redirected_to_verification_after_login(): void
    {
        User::factory()->unverified()->create([
            'email' => 'pending@example.com',
            'password' => 'Password123!',
            'google_id' => null,
        ]);

        $response = $this->post(route('login'), [
            'email' => 'pending@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertRedirect(route('verification.code.show'));
        $this->assertAuthenticated();
    }

    public function test_unverified_user_with_google_id_logs_in_with_password_without_verification_redirect(): void
    {
        User::factory()->unverified()->create([
            'email' => 'hybrid@example.com',
            'password' => 'Password123!',
            'google_id' => 'google-hybrid',
        ]);

        $this->post(route('login'), [
            'email' => 'hybrid@example.com',
            'password' => 'Password123!',
        ])->assertRedirect(route('dashboard'));

        $this->assertAuthenticated();
    }

    public function test_invalid_credentials_are_rejected(): void
    {
        User::factory()->create([
            'email' => 'user@example.com',
            'password' => 'Password123!',
        ]);

        $this->post(route('login'), [
            'email' => 'user@example.com',
            'password' => 'WrongPassword123!',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_oauth_only_user_cannot_login_with_password(): void
    {
        User::factory()->create([
            'email' => 'oauth-only@example.com',
            'password' => null,
            'google_id' => 'google-123',
            'email_verified_at' => now(),
        ]);

        $this->post(route('login'), [
            'email' => 'oauth-only@example.com',
            'password' => 'AnyPassword123!',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_authenticated_verified_user_visiting_login_is_redirected_home(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('login'))
            ->assertRedirect(route('dashboard'));
    }

    public function test_authenticated_unverified_manual_user_visiting_login_is_redirected_to_verification(): void
    {
        $user = User::factory()->unverified()->create([
            'password' => 'Password123!',
            'google_id' => null,
        ]);

        $this->actingAs($user)
            ->get(route('login'))
            ->assertRedirect(route('verification.code.show'));
    }

    public function test_authenticated_unverified_user_with_google_id_visiting_login_goes_home(): void
    {
        $user = User::factory()->unverified()->create([
            'password' => 'Password123!',
            'google_id' => 'g-login-test',
        ]);

        $this->actingAs($user)
            ->get(route('login'))
            ->assertRedirect(route('dashboard'));
    }
}
