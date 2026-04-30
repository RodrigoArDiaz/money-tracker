<?php

namespace Tests\Feature;

use App\Enums\UpcomingExpenseKind;
use App\Enums\UpcomingExpensePaymentStatus;
use App\Models\ExpenseCategory;
use App\Models\UpcomingExpense;
use App\Models\UpcomingExpenseRecurringTemplate;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class UpcomingExpenseRecurringTest extends TestCase
{
    use LazilyRefreshDatabase;

    #[Test]
    public function authenticated_user_sees_recurring_templates_page(): void
    {
        $this->travelTo(Carbon::parse('2026-04-01 12:00:00', 'UTC'));

        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('upcoming-expenses.recurring', ['year' => 2026, 'month' => 7]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('UpcomingExpensesRecurring')
                ->where('defaultYear', 2026)
                ->where('defaultMonth', 7)
                ->has('myCategories')
                ->has('defaultCategories')
                ->has('recurringTemplates', 0));

        $this->travelBack();
    }

    #[Test]
    public function viewing_month_materializes_recurring_instance(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-04-10 12:00:00', 'UTC'));

        $user = User::factory()->create();

        /** @var ExpenseCategory $category */
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $template = UpcomingExpenseRecurringTemplate::factory()->forUser($user)->create([
            'expense_category_id' => $category->id,
            'description' => 'Comida mensual',
            'amount' => 100,
            'start_year' => 2026,
            'start_month' => 4,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->get(route('upcoming-expenses.index', ['year' => 2026, 'month' => 5]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('UpcomingExpenses')
                ->has('expenses', 1));

        $this->assertDatabaseHas('upcoming_expenses', [
            'user_id' => $user->id,
            'recurring_template_id' => $template->id,
            'year' => 2026,
            'month' => 5,
            'description' => 'Comida mensual',
            'amount' => '100.00',
        ]);

        $this->travelBack();
    }

    #[Test]
    public function make_recurring_links_template_and_keeps_row(): void
    {
        $this->travelTo(Carbon::parse('2026-05-01 12:00:00', 'UTC'));

        $this->artisan('default-expense-categories:sync');

        $user = User::factory()->create();

        /** @var ExpenseCategory $category */
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $upcoming = UpcomingExpense::factory()->forUser($user)->create([
            'year' => 2026,
            'month' => 6,
            'expense_category_id' => $category->id,
            'description' => 'Suscripción',
            'amount' => 50,
            'recurring_template_id' => null,
        ]);

        $this->actingAs($user)
            ->post(route('upcoming-expenses.make-recurring', $upcoming), [
                'redirect_year' => 2026,
                'redirect_month' => 6,
            ])
            ->assertRedirect(route('upcoming-expenses.recurring', ['year' => 2026, 'month' => 6]))
            ->assertSessionHas('success');

        $upcoming->refresh();
        $this->assertNotNull($upcoming->recurring_template_id);

        $this->assertDatabaseHas('upcoming_expense_recurring_templates', [
            'id' => $upcoming->recurring_template_id,
            'user_id' => $user->id,
            'description' => 'Suscripción',
            'start_year' => 2026,
            'start_month' => 6,
        ]);

        $this->travelBack();
    }

    #[Test]
    public function series_update_changes_future_unpaid_not_past_unpaid(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-06-15 12:00:00', 'UTC'));

        $user = User::factory()->create();

        /** @var ExpenseCategory $category */
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $template = UpcomingExpenseRecurringTemplate::factory()->forUser($user)->create([
            'expense_category_id' => $category->id,
            'description' => 'Serie',
            'amount' => 40,
            'start_year' => 2026,
            'start_month' => 4,
        ]);

        $past = UpcomingExpense::factory()->forUser($user)->create([
            'recurring_template_id' => $template->id,
            'year' => 2026,
            'month' => 4,
            'expense_category_id' => $category->id,
            'description' => 'Serie',
            'amount' => 40,
            'payment_status' => UpcomingExpensePaymentStatus::Unpaid,
        ]);

        $current = UpcomingExpense::factory()->forUser($user)->create([
            'recurring_template_id' => $template->id,
            'year' => 2026,
            'month' => 6,
            'expense_category_id' => $category->id,
            'description' => 'Serie',
            'amount' => 40,
            'payment_status' => UpcomingExpensePaymentStatus::Unpaid,
        ]);

        $future = UpcomingExpense::factory()->forUser($user)->create([
            'recurring_template_id' => $template->id,
            'year' => 2026,
            'month' => 7,
            'expense_category_id' => $category->id,
            'description' => 'Serie',
            'amount' => 40,
            'payment_status' => UpcomingExpensePaymentStatus::Unpaid,
        ]);

        $this->actingAs($user)->put(route('upcoming-expenses.update', $current), [
            'expense_category_id' => $category->id,
            'description' => 'Serie',
            'note' => '',
            'amount' => '55.00',
            'kind' => UpcomingExpenseKind::Fixed->value,
            'payment_status' => UpcomingExpensePaymentStatus::Unpaid->value,
            'update_scope' => 'this_and_future_unpaid',
            'redirect_year' => 2026,
            'redirect_month' => 6,
        ])->assertRedirect();

        $past->refresh();
        $current->refresh();
        $future->refresh();

        $this->assertSame('40.00', (string) $past->amount);
        $this->assertSame('55.00', (string) $current->amount);
        $this->assertSame('55.00', (string) $future->amount);

        $template->refresh();
        $this->assertSame('55.00', (string) $template->amount);

        $this->travelBack();
    }

    #[Test]
    public function user_can_create_recurring_template_via_store_route(): void
    {
        $this->travelTo(Carbon::parse('2026-01-15 12:00:00', 'UTC'));

        $this->artisan('default-expense-categories:sync');

        $user = User::factory()->create();

        /** @var ExpenseCategory $category */
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $this->actingAs($user)
            ->post(route('upcoming-expense-recurring-templates.store'), [
                'description' => 'Nuevo recurrente',
                'note' => '',
                'amount' => '25.50',
                'kind' => UpcomingExpenseKind::Variable->value,
                'expense_category_id' => $category->id,
                'start_year' => 2026,
                'start_month' => 9,
                'redirect_year' => 2026,
                'redirect_month' => 9,
            ])
            ->assertRedirect(route('upcoming-expenses.recurring', ['year' => 2026, 'month' => 9]))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('upcoming_expense_recurring_templates', [
            'user_id' => $user->id,
            'description' => 'Nuevo recurrente',
            'start_year' => 2026,
            'start_month' => 9,
        ]);

        $this->assertDatabaseHas('upcoming_expenses', [
            'user_id' => $user->id,
            'year' => 2026,
            'month' => 9,
            'description' => 'Nuevo recurrente',
        ]);

        $this->travelBack();
    }

    #[Test]
    public function store_rejects_start_before_current_month(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-06-15 12:00:00', 'UTC'));

        $user = User::factory()->create();

        /** @var ExpenseCategory $category */
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $this->actingAs($user)
            ->post(route('upcoming-expense-recurring-templates.store'), [
                'description' => 'Inválido',
                'note' => '',
                'amount' => '10.00',
                'kind' => UpcomingExpenseKind::Fixed->value,
                'expense_category_id' => $category->id,
                'start_year' => 2026,
                'start_month' => 5,
                'redirect_year' => 2026,
                'redirect_month' => 6,
            ])
            ->assertSessionHasErrors('start_month');

        $this->travelBack();
    }

    #[Test]
    public function store_rejects_end_not_strictly_after_start(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-06-15 12:00:00', 'UTC'));

        $user = User::factory()->create();

        /** @var ExpenseCategory $category */
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $this->actingAs($user)
            ->post(route('upcoming-expense-recurring-templates.store'), [
                'description' => 'Fin igual al inicio',
                'note' => '',
                'amount' => '10.00',
                'kind' => UpcomingExpenseKind::Fixed->value,
                'expense_category_id' => $category->id,
                'start_year' => 2026,
                'start_month' => 8,
                'end_year' => 2026,
                'end_month' => 8,
                'redirect_year' => 2026,
                'redirect_month' => 6,
            ])
            ->assertSessionHasErrors('end_year');

        $this->travelBack();
    }

    #[Test]
    public function update_rejects_end_not_strictly_after_series_start(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-06-15 12:00:00', 'UTC'));

        $user = User::factory()->create();

        /** @var ExpenseCategory $category */
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $template = UpcomingExpenseRecurringTemplate::factory()->forUser($user)->create([
            'expense_category_id' => $category->id,
            'description' => 'Serie',
            'amount' => 40,
            'kind' => UpcomingExpenseKind::Fixed,
            'start_year' => 2026,
            'start_month' => 8,
            'end_year' => null,
            'end_month' => null,
        ]);

        $this->actingAs($user)
            ->put(route('upcoming-expense-recurring-templates.update', $template), [
                'description' => 'Serie',
                'note' => '',
                'amount' => '40.00',
                'kind' => UpcomingExpenseKind::Fixed->value,
                'expense_category_id' => $category->id,
                'is_active' => true,
                'end_year' => 2026,
                'end_month' => 8,
                'redirect_year' => 2026,
                'redirect_month' => 6,
            ])
            ->assertSessionHasErrors('end_year');

        $this->travelBack();
    }

    #[Test]
    public function make_recurring_clamps_start_to_current_month_when_planned_month_is_in_the_past(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-06-10 12:00:00', 'UTC'));

        $user = User::factory()->create();

        /** @var ExpenseCategory $category */
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $upcoming = UpcomingExpense::factory()->forUser($user)->create([
            'year' => 2026,
            'month' => 3,
            'expense_category_id' => $category->id,
            'description' => 'Viejo mes',
            'amount' => 50,
            'recurring_template_id' => null,
        ]);

        $this->actingAs($user)
            ->post(route('upcoming-expenses.make-recurring', $upcoming), [
                'redirect_year' => 2026,
                'redirect_month' => 6,
            ])
            ->assertRedirect(route('upcoming-expenses.recurring', ['year' => 2026, 'month' => 6]))
            ->assertSessionHas('success');

        $upcoming->refresh();
        $this->assertNotNull($upcoming->recurring_template_id);

        $this->assertDatabaseHas('upcoming_expense_recurring_templates', [
            'id' => $upcoming->recurring_template_id,
            'user_id' => $user->id,
            'start_year' => 2026,
            'start_month' => 6,
        ]);

        $this->travelBack();
    }

    #[Test]
    public function deleting_materialized_recurring_row_is_not_recreated_on_next_month_view(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-04-10 12:00:00', 'UTC'));

        $user = User::factory()->create();

        /** @var ExpenseCategory $category */
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $template = UpcomingExpenseRecurringTemplate::factory()->forUser($user)->create([
            'expense_category_id' => $category->id,
            'description' => 'Comida mensual',
            'amount' => 100,
            'start_year' => 2026,
            'start_month' => 4,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->get(route('upcoming-expenses.index', ['year' => 2026, 'month' => 5]))
            ->assertOk();

        $expense = UpcomingExpense::query()
            ->where('user_id', $user->id)
            ->where('recurring_template_id', $template->id)
            ->where('year', 2026)
            ->where('month', 5)
            ->firstOrFail();

        $this->actingAs($user)->delete(route('upcoming-expenses.destroy', $expense), [
            'redirect_year' => 2026,
            'redirect_month' => 5,
        ])->assertRedirect(route('upcoming-expenses.index', ['year' => 2026, 'month' => 5]));

        $this->assertDatabaseMissing('upcoming_expenses', ['id' => $expense->id]);

        $this->assertDatabaseHas('upcoming_expense_recurring_month_skips', [
            'user_id' => $user->id,
            'upcoming_expense_recurring_template_id' => $template->id,
            'year' => 2026,
            'month' => 5,
        ]);

        $this->actingAs($user)
            ->get(route('upcoming-expenses.index', ['year' => 2026, 'month' => 5]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('expenses', 0));

        $this->travelBack();
    }
}
