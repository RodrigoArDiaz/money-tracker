<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use App\Support\ExpenseCategoryIcons;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ExpenseCategoryAbmTest extends TestCase
{
    use LazilyRefreshDatabase;

    #[Test]
    public function guest_cannot_access_expense_categories_index(): void
    {
        $this->get('/expense-categories')->assertRedirect(route('home'));
    }

    #[Test]
    public function authenticated_user_can_list_create_update_and_delete_empty_category(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/expense-categories')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('ExpenseCategories/Index')
                ->has('categories', fn ($c) => $c->toArray() === [])
                ->has('defaultExpenseCategories', fn ($c) => $c->toArray() === [])
                ->has('expenseCategoryIconNames', count(ExpenseCategoryIcons::names())));

        $this->actingAs($user)
            ->post('/expense-categories', ['name' => 'Comida', 'icon' => 'Tag'])
            ->assertRedirect(route('expense-categories.index'))
            ->assertSessionHas('success', __('frontend.expense_categories.flash.created'));

        $category = ExpenseCategory::query()->where('user_id', $user->id)->firstOrFail();
        $this->assertSame('Comida', $category->name);
        $this->assertSame('Tag', $category->icon);

        $this->actingAs($user)
            ->put("/expense-categories/{$category->id}", ['name' => 'Comida actualizada', 'icon' => 'Wallet'])
            ->assertRedirect(route('expense-categories.index'))
            ->assertSessionHas('success', __('frontend.expense_categories.flash.updated'));

        $category->refresh();
        $this->assertSame('Comida actualizada', $category->name);
        $this->assertSame('Wallet', $category->icon);

        $this->actingAs($user)
            ->delete("/expense-categories/{$category->id}")
            ->assertRedirect(route('expense-categories.index'))
            ->assertSessionHas('success', __('frontend.expense_categories.flash.deleted'));

        $this->assertNull(ExpenseCategory::query()->find($category->id));
    }

    #[Test]
    public function user_cannot_delete_category_with_expenses(): void
    {
        $user = User::factory()->create();
        $category = ExpenseCategory::factory()->for($user, 'user')->create(['name' => 'Transporte']);
        Expense::factory()->forUserAndCategory($user, $category)->create();

        $this->actingAs($user)
            ->from(route('expense-categories.index'))
            ->delete("/expense-categories/{$category->id}")
            ->assertRedirect(route('expense-categories.index'))
            ->assertSessionHas('error', __('frontend.expense_categories.flash.delete_blocked_has_expenses'));

        $this->assertNotNull($category->fresh());
    }

    #[Test]
    public function user_cannot_edit_another_users_category(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $category = ExpenseCategory::factory()->for($owner, 'user')->create();

        $this->actingAs($intruder)
            ->put("/expense-categories/{$category->id}", ['name' => 'Robo', 'icon' => 'Tag'])
            ->assertForbidden();
    }

    #[Test]
    public function duplicate_name_per_user_is_rejected_on_create(): void
    {
        $user = User::factory()->create();
        ExpenseCategory::factory()->for($user, 'user')->create(['name' => 'Duplicado']);

        $this->actingAs($user)
            ->post('/expense-categories', ['name' => 'Duplicado', 'icon' => 'Tag'])
            ->assertSessionHasErrors('name');
    }

    #[Test]
    public function invalid_icon_is_rejected_on_create(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/expense-categories', ['name' => 'Test', 'icon' => 'NotLucideIcon'])
            ->assertSessionHasErrors('icon');
    }

    #[Test]
    public function index_lists_categories_in_alphabetical_order_by_name(): void
    {
        $user = User::factory()->create();
        ExpenseCategory::factory()->for($user, 'user')->create(['name' => 'zebra']);
        ExpenseCategory::factory()->for($user, 'user')->create(['name' => 'Alpha']);
        ExpenseCategory::factory()->for($user, 'user')->create(['name' => 'beta']);

        $this->actingAs($user)
            ->get('/expense-categories')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('ExpenseCategories/Index')
                ->where('categories', fn ($categories) => collect($categories)->pluck('name')->all() === ['Alpha', 'beta', 'zebra']));
    }
}
