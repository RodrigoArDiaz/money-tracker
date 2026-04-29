<?php

namespace Tests\Feature;

use App\Enums\UpcomingExpenseKind;
use App\Enums\UpcomingExpensePaymentStatus;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\UpcomingExpense;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class UpcomingExpensesTest extends TestCase
{
    use LazilyRefreshDatabase;

    #[Test]
    public function guest_is_redirected_from_upcoming_expenses_index(): void
    {
        $this->get(route('upcoming-expenses.index'))
            ->assertRedirect(route('home'));
    }

    #[Test]
    public function authenticated_user_sees_upcoming_expenses_page(): void
    {
        $this->travelTo(Carbon::parse('2026-04-01 12:00:00', 'UTC'));

        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('upcoming-expenses.index', ['year' => 2026, 'month' => 7]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('UpcomingExpenses')
                ->where('viewYear', 2026)
                ->where('viewMonth', 7)
                ->has('myCategories')
                ->has('defaultCategories')
                ->where('total_amount', '0.00')
                ->where('unpaid_total', '0.00')
                ->has('expenses', 0)
                ->where('can_mark_planned_expenses_paid', false));

        $this->travelBack();
    }

    #[Test]
    public function user_can_store_upcoming_expense_and_totals_reflect_amounts(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-05-10 12:00:00', 'UTC'));

        $user = User::factory()->create();

        /** @var ExpenseCategory $category */
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $response = $this->actingAs($user)->post(route('upcoming-expenses.store'), [
            'year' => 2026,
            'month' => 8,
            'description' => 'Alquiler',
            'note' => 'Recordatorio',
            'amount' => '150.50',
            'kind' => UpcomingExpenseKind::Fixed->value,
            'expense_category_id' => $category->id,
            'redirect_year' => 2026,
            'redirect_month' => 8,
        ]);

        $response->assertRedirect(route('upcoming-expenses.index', ['year' => 2026, 'month' => 8]));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('upcoming_expenses', [
            'user_id' => $user->id,
            'year' => 2026,
            'month' => 8,
            'expense_category_id' => $category->id,
            'description' => 'Alquiler',
            'amount' => '150.50',
            'kind' => UpcomingExpenseKind::Fixed->value,
            'payment_status' => UpcomingExpensePaymentStatus::Unpaid->value,
        ]);

        $this->actingAs($user)
            ->get(route('upcoming-expenses.index', ['year' => 2026, 'month' => 8]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('total_amount', '150.50')
                ->where('unpaid_total', '150.50'));

        $this->travelBack();
    }

    #[Test]
    public function user_can_update_payment_status_and_unpaid_total_changes(): void
    {
        $this->travelTo(Carbon::parse('2026-04-15 12:00:00', 'UTC'));

        $user = User::factory()->create();

        $expense = UpcomingExpense::factory()->forUser($user)->create([
            'year' => 2026,
            'month' => 3,
            'amount' => 40,
            'payment_status' => UpcomingExpensePaymentStatus::Unpaid,
        ]);

        $this->actingAs($user)->put(route('upcoming-expenses.update', $expense), [
            'expense_category_id' => $expense->expense_category_id,
            'description' => $expense->description,
            'note' => '',
            'amount' => '40.00',
            'kind' => UpcomingExpenseKind::Variable->value,
            'payment_status' => UpcomingExpensePaymentStatus::Paid->value,
            'redirect_year' => 2026,
            'redirect_month' => 3,
        ])->assertRedirect(route('upcoming-expenses.index', ['year' => 2026, 'month' => 3]));

        $this->actingAs($user)
            ->get(route('upcoming-expenses.index', ['year' => 2026, 'month' => 3]))
            ->assertInertia(fn ($page) => $page
                ->where('total_amount', '40.00')
                ->where('unpaid_total', '0.00'));

        $this->travelBack();
    }

    #[Test]
    public function user_cannot_update_another_users_upcoming_expense(): void
    {
        $this->travelTo(Carbon::parse('2026-04-15 12:00:00', 'UTC'));

        $owner = User::factory()->create();
        $other = User::factory()->create();

        $expense = UpcomingExpense::factory()->forUser($owner)->create([
            'year' => 2026,
            'month' => 1,
        ]);

        $this->actingAs($other)->put(route('upcoming-expenses.update', $expense), [
            'expense_category_id' => $expense->expense_category_id,
            'description' => 'Hack',
            'note' => '',
            'amount' => '1.00',
            'kind' => UpcomingExpenseKind::Fixed->value,
            'payment_status' => UpcomingExpensePaymentStatus::Paid->value,
            'redirect_year' => 2026,
            'redirect_month' => 1,
        ])->assertNotFound();

        $this->travelBack();
    }

    #[Test]
    public function user_can_delete_upcoming_expense(): void
    {
        $user = User::factory()->create();

        $expense = UpcomingExpense::factory()->forUser($user)->create([
            'year' => 2026,
            'month' => 11,
        ]);

        $this->actingAs($user)->delete(route('upcoming-expenses.destroy', $expense), [
            'redirect_year' => 2026,
            'redirect_month' => 11,
        ])->assertRedirect(route('upcoming-expenses.index', ['year' => 2026, 'month' => 11]));

        $this->assertDatabaseMissing('upcoming_expenses', ['id' => $expense->id]);
    }

    #[Test]
    public function marking_upcoming_as_paid_creates_expense_with_spent_on_matching_change_date(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-08-03 14:30:00', 'UTC'));

        $user = User::factory()->create();

        /** @var ExpenseCategory $category */
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $upcoming = UpcomingExpense::factory()->forUser($user)->create([
            'year' => 2026,
            'month' => 8,
            'payment_status' => UpcomingExpensePaymentStatus::Unpaid,
            'amount' => 25,
            'expense_category_id' => $category->id,
            'description' => 'Luz',
        ]);

        $this->actingAs($user)->put(route('upcoming-expenses.update', $upcoming), [
            'expense_category_id' => $category->id,
            'description' => $upcoming->description,
            'note' => '',
            'amount' => '25.00',
            'kind' => UpcomingExpenseKind::Fixed->value,
            'payment_status' => UpcomingExpensePaymentStatus::Paid->value,
            'redirect_year' => 2026,
            'redirect_month' => 8,
        ])->assertRedirect(route('upcoming-expenses.index', ['year' => 2026, 'month' => 8]));

        /** @var Expense $persistedExpense */
        $persistedExpense = Expense::query()->where('upcoming_expense_id', $upcoming->id)->firstOrFail();
        $this->assertSame((int) $user->id, (int) $persistedExpense->user_id);
        $this->assertSame((int) $category->id, (int) $persistedExpense->expense_category_id);
        $this->assertSame('2026-08-03', $persistedExpense->spent_on->toDateString());
        $this->assertSame('25.00', (string) $persistedExpense->amount);
        $this->assertSame('Luz', $persistedExpense->description);

        $this->travelBack();
    }

    #[Test]
    public function toggling_upcoming_paid_unpaid_creates_and_removes_linked_expense(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-02-02 09:00:00', 'UTC'));

        $user = User::factory()->create();

        /** @var ExpenseCategory $category */
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $upcoming = UpcomingExpense::factory()->forUser($user)->create([
            'year' => 2026,
            'month' => 2,
            'payment_status' => UpcomingExpensePaymentStatus::Unpaid,
            'amount' => 10,
            'expense_category_id' => $category->id,
            'description' => 'Uno',
        ]);

        $this->actingAs($user)->put(route('upcoming-expenses.update', $upcoming), [
            'expense_category_id' => $category->id,
            'description' => $upcoming->description,
            'note' => '',
            'amount' => '10.00',
            'kind' => UpcomingExpenseKind::Fixed->value,
            'payment_status' => UpcomingExpensePaymentStatus::Paid->value,
            'redirect_year' => 2026,
            'redirect_month' => 2,
        ])->assertRedirect();

        $upcoming->refresh();
        $this->assertDatabaseHas('expenses', ['upcoming_expense_id' => $upcoming->id]);

        $this->actingAs($user)->put(route('upcoming-expenses.update', $upcoming), [
            'expense_category_id' => $category->id,
            'description' => $upcoming->description,
            'note' => '',
            'amount' => '10.00',
            'kind' => UpcomingExpenseKind::Fixed->value,
            'payment_status' => UpcomingExpensePaymentStatus::Unpaid->value,
            'redirect_year' => 2026,
            'redirect_month' => 2,
        ])->assertRedirect();

        $this->assertDatabaseMissing('expenses', ['upcoming_expense_id' => $upcoming->id]);

        $this->travelBack();
    }

    #[Test]
    public function marking_past_planned_month_as_paid_sets_spent_on_last_day_of_that_month(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-04-10 12:00:00', 'UTC'));

        $user = User::factory()->create();

        /** @var ExpenseCategory $category */
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $upcoming = UpcomingExpense::factory()->forUser($user)->create([
            'year' => 2026,
            'month' => 3,
            'payment_status' => UpcomingExpensePaymentStatus::Unpaid,
            'amount' => 30,
            'expense_category_id' => $category->id,
            'description' => 'Mes pasado',
        ]);

        $this->actingAs($user)->put(route('upcoming-expenses.update', $upcoming), [
            'expense_category_id' => $category->id,
            'description' => $upcoming->description,
            'note' => '',
            'amount' => '30.00',
            'kind' => UpcomingExpenseKind::Fixed->value,
            'payment_status' => UpcomingExpensePaymentStatus::Paid->value,
            'redirect_year' => 2026,
            'redirect_month' => 3,
        ])->assertRedirect(route('upcoming-expenses.index', ['year' => 2026, 'month' => 3]));

        /** @var Expense $persistedExpense */
        $persistedExpense = Expense::query()->where('upcoming_expense_id', $upcoming->id)->firstOrFail();
        $this->assertSame('2026-03-31', $persistedExpense->spent_on->toDateString());

        $this->travelBack();
    }

    #[Test]
    public function cannot_mark_future_planned_month_as_paid(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-04-10 12:00:00', 'UTC'));

        $user = User::factory()->create();

        /** @var ExpenseCategory $category */
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $upcoming = UpcomingExpense::factory()->forUser($user)->create([
            'year' => 2026,
            'month' => 8,
            'payment_status' => UpcomingExpensePaymentStatus::Unpaid,
            'amount' => 99,
            'expense_category_id' => $category->id,
            'description' => 'Futuro',
        ]);

        $this->actingAs($user)->put(route('upcoming-expenses.update', $upcoming), [
            'expense_category_id' => $category->id,
            'description' => $upcoming->description,
            'note' => '',
            'amount' => '99.00',
            'kind' => UpcomingExpenseKind::Fixed->value,
            'payment_status' => UpcomingExpensePaymentStatus::Paid->value,
            'redirect_year' => 2026,
            'redirect_month' => 8,
        ])->assertSessionHasErrors('payment_status');

        $this->assertDatabaseMissing('expenses', ['upcoming_expense_id' => $upcoming->id]);

        $this->travelBack();
    }
}
