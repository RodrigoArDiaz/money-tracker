<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ExpenseStoreTest extends TestCase
{
    use LazilyRefreshDatabase;

    #[Test]
    public function guest_cannot_store_expense(): void
    {
        $this->post(route('expenses.store'), [
            'expense_category_id' => 1,
            'description' => 'Test',
            'amount' => 10,
        ])->assertRedirect(route('home'));
    }

    #[Test]
    public function user_can_store_expense_with_system_category(): void
    {
        $this->artisan('default-expense-categories:sync');

        $user = User::factory()->create();
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $this->actingAs($user)
            ->post(route('expenses.store'), [
                'expense_category_id' => $category->id,
                'description' => 'Almuerzo',
                'amount' => 12.5,
            ])
            ->assertRedirect(route('home'))
            ->assertSessionHas('success', __('frontend.expenses.flash.created'));

        $expense = Expense::query()->where('user_id', $user->id)->firstOrFail();
        $this->assertSame($category->id, $expense->expense_category_id);
        $this->assertSame('Almuerzo', $expense->description);
        $this->assertSame('12.50', $expense->amount);
        $this->assertTrue(now()->isSameDay($expense->spent_on));
    }

    #[Test]
    public function user_can_store_expense_with_own_category(): void
    {
        $this->artisan('default-expense-categories:sync');

        $user = User::factory()->create();
        $category = ExpenseCategory::factory()->for($user, 'user')->create();

        $this->actingAs($user)
            ->post(route('expenses.store'), [
                'expense_category_id' => $category->id,
                'description' => 'Taxi',
                'amount' => 8,
            ])
            ->assertRedirect(route('home'));

        $this->assertSame(1, Expense::query()->where('user_id', $user->id)->count());
    }

    #[Test]
    public function user_can_store_expense_without_description(): void
    {
        $this->artisan('default-expense-categories:sync');

        $user = User::factory()->create();
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $this->actingAs($user)
            ->post(route('expenses.store'), [
                'expense_category_id' => $category->id,
                'amount' => 25,
            ])
            ->assertRedirect(route('home'));

        $expense = Expense::query()->where('user_id', $user->id)->firstOrFail();
        $this->assertSame('', $expense->description);
        $this->assertSame('25.00', $expense->amount);
    }

    #[Test]
    public function user_cannot_store_expense_with_another_users_category(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $category = ExpenseCategory::factory()->for($owner, 'user')->create();

        $this->actingAs($intruder)
            ->post(route('expenses.store'), [
                'expense_category_id' => $category->id,
                'description' => 'X',
                'amount' => 10,
            ])
            ->assertSessionHasErrors('expense_category_id');

        $this->assertSame(0, Expense::query()->count());
    }
}
