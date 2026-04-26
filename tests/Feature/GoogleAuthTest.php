<?php

namespace Tests\Feature;

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
    }
}
