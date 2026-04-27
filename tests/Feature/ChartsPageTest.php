<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ChartsPageTest extends TestCase
{
    use LazilyRefreshDatabase;

    #[Test]
    public function guest_is_redirected_from_charts(): void
    {
        $this->get(route('charts'))
            ->assertRedirect();
    }

    #[Test]
    public function authenticated_user_sees_charts_page_with_category_totals_ordered_by_amount(): void
    {
        $this->travelTo(Carbon::parse('2026-04-15 12:00:00', 'UTC'));

        $user = User::factory()->create();
        $catHigh = ExpenseCategory::factory()->for($user, 'user')->create();
        $catLow = ExpenseCategory::factory()->for($user, 'user')->create();

        Expense::factory()->forUserAndCategory($user, $catLow)->create([
            'spent_on' => '2026-04-10',
            'amount' => 10.5,
        ]);
        Expense::factory()->forUserAndCategory($user, $catHigh)->create([
            'spent_on' => '2026-04-12',
            'amount' => 100,
        ]);

        $this->actingAs($user)
            ->get(route('charts', ['period' => 'month', 'year' => 2026, 'month' => 4]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Charts/Index')
                ->where('period', 'month')
                ->where('viewYear', 2026)
                ->where('viewMonth', 4)
                ->has('categoryTotals', 2)
                ->where('categoryTotals.0.id', $catHigh->id)
                ->where('categoryTotals.0.total', '100.00')
                ->where('categoryTotals.1.id', $catLow->id)
                ->where('categoryTotals.1.total', '10.50'));

        $this->travelBack();
    }

    #[Test]
    public function year_period_aggregates_expenses_across_months(): void
    {
        $this->travelTo(Carbon::parse('2026-06-10 12:00:00', 'UTC'));

        $user = User::factory()->create();
        $category = ExpenseCategory::factory()->for($user, 'user')->create();

        Expense::factory()->forUserAndCategory($user, $category)->create([
            'spent_on' => '2026-01-15',
            'amount' => 20,
        ]);
        Expense::factory()->forUserAndCategory($user, $category)->create([
            'spent_on' => '2026-05-20',
            'amount' => 30,
        ]);

        $this->actingAs($user)
            ->get(route('charts', ['period' => 'year', 'year' => 2026, 'month' => 1]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Charts/Index')
                ->where('period', 'year')
                ->where('viewYear', 2026)
                ->has('categoryTotals', 1)
                ->where('categoryTotals.0.total', '50.00'));

        $this->travelBack();
    }
}
