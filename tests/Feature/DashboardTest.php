<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_guest_is_redirected_from_dashboard(): void
    {
        $this->get(route('dashboard'))->assertRedirect(route('home'));
    }

    public function test_authenticated_user_legacy_dashboard_redirects_to_home(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertRedirect(route('home'));
    }

    public function test_authenticated_user_can_view_home(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Home'));
    }

    public function test_unverified_manual_user_is_redirected_from_home_to_verification(): void
    {
        $user = User::factory()->unverified()->create([
            'password' => 'Password123!',
            'google_id' => null,
        ]);

        $this->actingAs($user)
            ->get(route('home'))
            ->assertRedirect(route('verification.code.show'));
    }
}
