<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use Carbon\Carbon;
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
            'spent_on' => now()->toDateString(),
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
                'spent_on' => now()->toDateString(),
                'redirect_year' => now()->year,
                'redirect_month' => now()->month,
            ])
            ->assertRedirect(route('home', ['year' => now()->year, 'month' => now()->month]))
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
                'spent_on' => now()->toDateString(),
                'redirect_year' => now()->year,
                'redirect_month' => now()->month,
            ])
            ->assertRedirect(route('home', ['year' => now()->year, 'month' => now()->month]));

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
                'spent_on' => now()->toDateString(),
                'redirect_year' => now()->year,
                'redirect_month' => now()->month,
            ])
            ->assertRedirect(route('home', ['year' => now()->year, 'month' => now()->month]));

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
                'spent_on' => now()->toDateString(),
                'redirect_year' => now()->year,
                'redirect_month' => now()->month,
            ])
            ->assertSessionHasErrors('expense_category_id');

        $this->assertSame(0, Expense::query()->count());
    }

    #[Test]
    public function user_can_store_expense_with_custom_spent_on_date(): void
    {
        $this->artisan('default-expense-categories:sync');

        $user = User::factory()->create();
        $category = ExpenseCategory::query()->system()->firstOrFail();
        $spentOn = Carbon::now()->subDays(10)->toDateString();
        $year = (int) Carbon::parse($spentOn)->year;
        $month = (int) Carbon::parse($spentOn)->month;

        $this->actingAs($user)
            ->post(route('expenses.store'), [
                'expense_category_id' => $category->id,
                'description' => 'Past week',
                'amount' => 5,
                'spent_on' => $spentOn,
                'redirect_year' => $year,
                'redirect_month' => $month,
            ])
            ->assertRedirect(route('home', ['year' => $year, 'month' => $month]));

        $expense = Expense::query()->where('user_id', $user->id)->firstOrFail();
        $this->assertSame($spentOn, $expense->spent_on->toDateString());
    }

    #[Test]
    public function user_cannot_store_expense_with_future_spent_on(): void
    {
        $this->artisan('default-expense-categories:sync');

        $user = User::factory()->create();
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $this->actingAs($user)
            ->post(route('expenses.store'), [
                'expense_category_id' => $category->id,
                'amount' => 10,
                'spent_on' => Carbon::now()->addDay()->toDateString(),
                'redirect_year' => now()->year,
                'redirect_month' => now()->month,
            ])
            ->assertSessionHasErrors('spent_on');

        $this->assertSame(0, Expense::query()->count());
    }

    #[Test]
    public function user_cannot_store_expense_when_spent_on_month_mismatches_redirect_month(): void
    {
        $this->artisan('default-expense-categories:sync');

        $user = User::factory()->create();
        $category = ExpenseCategory::query()->system()->firstOrFail();
        $spentOn = Carbon::now()->subMonth()->startOfMonth()->addDays(4)->toDateString();

        $this->actingAs($user)
            ->post(route('expenses.store'), [
                'expense_category_id' => $category->id,
                'amount' => 10,
                'spent_on' => $spentOn,
                'redirect_year' => now()->year,
                'redirect_month' => now()->month,
            ])
            ->assertSessionHasErrors('spent_on');

        $this->assertSame(0, Expense::query()->count());
    }
}
