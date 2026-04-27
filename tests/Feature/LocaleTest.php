<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class LocaleTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_guest_can_switch_locale_via_session(): void
    {
        $this->from(route('home'))
            ->post(route('locale.update'), ['locale' => 'en'])
            ->assertRedirect();

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('locale', 'en'));
    }

    public function test_authenticated_user_locale_persists_to_profile(): void
    {
        $user = User::factory()->create([
            'preferred_locale' => 'es',
        ]);

        $this->actingAs($user)
            ->from(route('home'))
            ->post(route('locale.update'), ['locale' => 'en'])
            ->assertRedirect();

        $user->refresh();
        $this->assertSame('en', $user->preferred_locale);

        $this->actingAs($user)
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('locale', 'en'));
    }

    public function test_invalid_locale_is_rejected(): void
    {
        $this->post(route('locale.update'), ['locale' => 'fr'])
            ->assertSessionHasErrors('locale');
    }
}
