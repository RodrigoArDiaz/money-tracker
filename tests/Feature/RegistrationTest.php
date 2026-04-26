<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
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
        $response = $this->post(route('register'), [
            'first_name' => 'Ana',
            'last_name' => 'García',
            'email' => 'ana@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertRedirect(route('home'));
        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'ana@example.com',
            'first_name' => 'Ana',
            'last_name' => 'García',
        ]);
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
}
