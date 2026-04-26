<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Mail;
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

    public function test_google_callback_creates_verified_user_and_redirects_home(): void
    {
        Mail::fake();

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

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'luis@example.com',
            'google_id' => 'google-test-id',
            'first_name' => 'Luis',
            'last_name' => 'Pérez',
        ]);

        $this->assertNotNull(User::where('email', 'luis@example.com')->first()->email_verified_at);
        Mail::assertNothingSent();
    }

    public function test_google_callback_existing_verified_user_goes_home(): void
    {
        Mail::fake();

        User::factory()->create([
            'email' => 'verified-google@example.com',
            'google_id' => null,
        ]);

        $socialUser = (new SocialiteUser)->map([
            'id' => 'google-verified-id',
            'nickname' => null,
            'name' => 'Verificado',
            'email' => 'verified-google@example.com',
            'avatar' => null,
        ])->setRaw([
            'given_name' => 'Verificado',
            'family_name' => 'User',
        ]);

        Socialite::fake('google', $socialUser);

        $this->get(route('auth.google.callback'))
            ->assertRedirect(route('dashboard'));

        $this->assertDatabaseHas('users', [
            'email' => 'verified-google@example.com',
            'google_id' => 'google-verified-id',
        ]);

        $this->assertNotNull(User::where('email', 'verified-google@example.com')->first()->email_verified_at);
        Mail::assertNothingSent();
    }

    public function test_google_callback_verifies_previously_manual_unverified_user(): void
    {
        Mail::fake();

        User::factory()->unverified()->create([
            'email' => 'pending@example.com',
            'password' => 'Password123!',
            'google_id' => null,
        ]);

        $socialUser = (new SocialiteUser)->map([
            'id' => 'google-pending-id',
            'nickname' => null,
            'name' => 'Pending User',
            'email' => 'pending@example.com',
            'avatar' => null,
        ])->setRaw([
            'given_name' => 'Pending',
            'family_name' => 'User',
        ]);

        Socialite::fake('google', $socialUser);

        $this->get(route('auth.google.callback'))
            ->assertRedirect(route('dashboard'));

        $user = User::where('email', 'pending@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->email_verified_at);
        $this->assertSame('google-pending-id', $user->google_id);
        Mail::assertNothingSent();
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
