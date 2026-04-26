<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_google_redirect_route_works(): void
    {
        Socialite::fake('google');

        $response = $this->get(route('auth.google'));

        $response->assertRedirect();
    }

    public function test_google_callback_creates_and_logs_in_user(): void
    {
        $socialUser = (new SocialiteUser)->map([
            'id' => 'google-test-id',
            'nickname' => null,
            'name' => 'Luis Pérez',
            'email' => 'luis@example.com',
            'avatar' => null,
        ])->setRaw([
            'given_name' => 'Luis',
            'family_name' => 'Pérez',
        ]);

        Socialite::fake('google', $socialUser);

        $response = $this->get(route('auth.google.callback'));

        $response->assertRedirect(route('home'));
        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'luis@example.com',
            'google_id' => 'google-test-id',
            'first_name' => 'Luis',
            'last_name' => 'Pérez',
        ]);

        $this->assertNotNull(User::where('email', 'luis@example.com')->first()->email_verified_at);
    }

    public function test_google_callback_without_email_redirects_to_register(): void
    {
        $socialUser = (new SocialiteUser)->map([
            'id' => 'google-no-mail',
            'nickname' => null,
            'name' => 'Sin Mail',
            'email' => null,
            'avatar' => null,
        ])->setRaw([]);

        Socialite::fake('google', $socialUser);

        $this->get(route('auth.google.callback'))
            ->assertRedirect(route('register'));

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['google_id' => 'google-no-mail']);
    }
}
