<?php

namespace Tests\Feature;

use App\Enums\UpcomingExpenseKind;
use App\Enums\UpcomingExpensePaymentStatus;
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
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('upcoming-expenses.index', ['year' => 2026, 'month' => 7]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('UpcomingExpenses')
                ->where('viewYear', 2026)
                ->where('viewMonth', 7)
                ->where('total_amount', '0.00')
                ->where('unpaid_total', '0.00')
                ->has('expenses', 0));
    }

    #[Test]
    public function user_can_store_upcoming_expense_and_totals_reflect_amounts(): void
    {
        $this->travelTo(Carbon::parse('2026-05-10 12:00:00', 'UTC'));

        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('upcoming-expenses.store'), [
            'year' => 2026,
            'month' => 8,
            'description' => 'Alquiler',
            'note' => 'Recordatorio',
            'amount' => '150.50',
            'kind' => UpcomingExpenseKind::Fixed->value,
            'redirect_year' => 2026,
            'redirect_month' => 8,
        ]);

        $response->assertRedirect(route('upcoming-expenses.index', ['year' => 2026, 'month' => 8]));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('upcoming_expenses', [
            'user_id' => $user->id,
            'year' => 2026,
            'month' => 8,
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
        $user = User::factory()->create();

        $expense = UpcomingExpense::factory()->forUser($user)->create([
            'year' => 2026,
            'month' => 3,
            'amount' => 40,
            'payment_status' => UpcomingExpensePaymentStatus::Unpaid,
        ]);

        $this->actingAs($user)->put(route('upcoming-expenses.update', $expense), [
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
    }

    #[Test]
    public function user_cannot_update_another_users_upcoming_expense(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();

        $expense = UpcomingExpense::factory()->forUser($owner)->create([
            'year' => 2026,
            'month' => 1,
        ]);

        $this->actingAs($other)->put(route('upcoming-expenses.update', $expense), [
            'description' => 'Hack',
            'note' => '',
            'amount' => '1.00',
            'kind' => UpcomingExpenseKind::Fixed->value,
            'payment_status' => UpcomingExpensePaymentStatus::Paid->value,
            'redirect_year' => 2026,
            'redirect_month' => 1,
        ])->assertNotFound();
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
}
