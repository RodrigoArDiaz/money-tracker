<?php

namespace Tests\Feature;

use App\Enums\UpcomingExpensePaymentStatus;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\UpcomingExpense;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ExpenseUpdateDeleteTest extends TestCase
{
    use LazilyRefreshDatabase;

    #[Test]
    public function user_can_update_own_expense(): void
    {
        $this->artisan('default-expense-categories:sync');

        $user = User::factory()->create();
        $categoryA = ExpenseCategory::query()->system()->firstOrFail();
        $categoryB = ExpenseCategory::query()->system()->skip(1)->firstOrFail();

        $expense = Expense::factory()->forUserAndCategory($user, $categoryA)->create([
            'description' => 'Antes',
            'amount' => 10,
            'spent_on' => now()->toDateString(),
        ]);

        $this->actingAs($user)
            ->put(route('expenses.update', $expense), [
                'expense_category_id' => $categoryB->id,
                'description' => 'Después',
                'amount' => 22.5,
            ])
            ->assertRedirect(route('home', ['year' => now()->year, 'month' => now()->month]))
            ->assertSessionHas('success', __('frontend.expenses.flash.updated'));

        $expense->refresh();
        $this->assertSame($categoryB->id, $expense->expense_category_id);
        $this->assertSame('Después', $expense->description);
        $this->assertSame('22.50', $expense->amount);
    }

    #[Test]
    public function user_can_update_expense_with_empty_description(): void
    {
        $this->artisan('default-expense-categories:sync');

        $user = User::factory()->create();
        $category = ExpenseCategory::query()->system()->firstOrFail();
        $expense = Expense::factory()->forUserAndCategory($user, $category)->create([
            'description' => 'Nota',
            'amount' => 5,
            'spent_on' => now()->toDateString(),
        ]);

        $this->actingAs($user)
            ->put(route('expenses.update', $expense), [
                'expense_category_id' => $category->id,
                'amount' => 5,
            ])
            ->assertRedirect(route('home', ['year' => now()->year, 'month' => now()->month]));

        $this->assertSame('', $expense->fresh()->description);
    }

    #[Test]
    public function user_cannot_update_another_users_expense(): void
    {
        $this->artisan('default-expense-categories:sync');

        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $category = ExpenseCategory::query()->system()->firstOrFail();
        $expense = Expense::factory()->forUserAndCategory($owner, $category)->create([
            'spent_on' => now()->toDateString(),
        ]);

        $this->actingAs($intruder)
            ->put(route('expenses.update', $expense), [
                'expense_category_id' => $category->id,
                'description' => 'X',
                'amount' => 99,
            ])
            ->assertNotFound();
    }

    #[Test]
    public function user_can_delete_own_expense(): void
    {
        $this->artisan('default-expense-categories:sync');

        $user = User::factory()->create();
        $category = ExpenseCategory::query()->system()->firstOrFail();
        $expense = Expense::factory()->forUserAndCategory($user, $category)->create([
            'spent_on' => now()->toDateString(),
        ]);

        $this->actingAs($user)
            ->delete(route('expenses.destroy', $expense))
            ->assertRedirect(route('home', ['year' => now()->year, 'month' => now()->month]))
            ->assertSessionHas('success', __('frontend.expenses.flash.deleted'));

        $this->assertNull(Expense::query()->find($expense->id));
    }

    #[Test]
    public function user_cannot_delete_another_users_expense(): void
    {
        $this->artisan('default-expense-categories:sync');

        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $category = ExpenseCategory::query()->system()->firstOrFail();
        $expense = Expense::factory()->forUserAndCategory($owner, $category)->create([
            'spent_on' => now()->toDateString(),
        ]);

        $this->actingAs($intruder)
            ->delete(route('expenses.destroy', $expense))
            ->assertNotFound();

        $this->assertNotNull(Expense::query()->find($expense->id));
    }

    #[Test]
    public function user_cannot_update_expense_linked_to_upcoming_plan(): void
    {
        $this->artisan('default-expense-categories:sync');

        $user = User::factory()->create();
        $categoryA = ExpenseCategory::query()->system()->firstOrFail();
        $categoryB = ExpenseCategory::query()->system()->skip(1)->firstOrFail();

        $upcoming = UpcomingExpense::factory()->forUser($user)->create([
            'payment_status' => UpcomingExpensePaymentStatus::Paid,
        ]);

        $expense = Expense::factory()->forUserAndCategory($user, $categoryA)->create([
            'description' => 'Desde plan',
            'amount' => 10,
            'spent_on' => now()->toDateString(),
            'upcoming_expense_id' => $upcoming->id,
        ]);

        $this->actingAs($user)
            ->put(route('expenses.update', $expense), [
                'expense_category_id' => $categoryB->id,
                'description' => 'Cambio',
                'amount' => 22.5,
            ])
            ->assertForbidden();

        $expense->refresh();
        $this->assertSame('Desde plan', $expense->description);
    }

    #[Test]
    public function user_cannot_delete_expense_linked_to_upcoming_plan(): void
    {
        $this->artisan('default-expense-categories:sync');

        $user = User::factory()->create();
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $upcoming = UpcomingExpense::factory()->forUser($user)->create([
            'payment_status' => UpcomingExpensePaymentStatus::Paid,
        ]);

        $expense = Expense::factory()->forUserAndCategory($user, $category)->create([
            'spent_on' => now()->toDateString(),
            'upcoming_expense_id' => $upcoming->id,
        ]);

        $this->actingAs($user)
            ->delete(route('expenses.destroy', $expense))
            ->assertForbidden();

        $this->assertNotNull(Expense::query()->find($expense->id));
    }
}
