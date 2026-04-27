<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class HomeMonthExpensesTest extends TestCase
{
    use LazilyRefreshDatabase;

    #[Test]
    public function home_groups_current_month_expenses_by_day_newest_day_first_and_always_includes_today(): void
    {
        $this->travelTo(Carbon::parse('2026-04-15 12:00:00', 'UTC'));

        $user = User::factory()->create();
        $category = ExpenseCategory::factory()->for($user, 'user')->create();

        $older = Expense::factory()->forUserAndCategory($user, $category)->create([
            'spent_on' => '2026-04-10',
            'amount' => 10,
        ]);
        $newer = Expense::factory()->forUserAndCategory($user, $category)->create([
            'spent_on' => '2026-04-14',
            'amount' => 20,
        ]);

        $this->actingAs($user)
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Home')
                ->has('expensesByDay', 3)
                ->where('expensesByDay.0.date', '2026-04-15')
                ->has('expensesByDay.0.expenses', fn ($c) => $c->toArray() === [])
                ->where('expensesByDay.1.date', '2026-04-14')
                ->has('expensesByDay.1.expenses', 1)
                ->where('expensesByDay.1.expenses.0.id', $newer->id)
                ->where('expensesByDay.2.date', '2026-04-10')
                ->has('expensesByDay.2.expenses', 1)
                ->where('expensesByDay.2.expenses.0.id', $older->id));

        $this->travelBack();
    }

    #[Test]
    public function home_omits_days_in_current_month_with_no_expenses_except_today(): void
    {
        $this->travelTo(Carbon::parse('2026-04-15 12:00:00', 'UTC'));

        $user = User::factory()->create();
        $category = ExpenseCategory::factory()->for($user, 'user')->create();

        Expense::factory()->forUserAndCategory($user, $category)->create([
            'spent_on' => '2026-04-14',
            'amount' => 5,
        ]);

        $this->actingAs($user)
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Home')
                ->has('expensesByDay', 2)
                ->where('expensesByDay.0.date', '2026-04-15')
                ->has('expensesByDay.0.expenses', fn ($c) => $c->toArray() === [])
                ->where('expensesByDay.1.date', '2026-04-14')
                ->has('expensesByDay.1.expenses', 1));

        $this->travelBack();
    }

    #[Test]
    public function home_excludes_expenses_from_previous_month(): void
    {
        $this->travelTo(Carbon::parse('2026-04-15 12:00:00', 'UTC'));

        $user = User::factory()->create();
        $category = ExpenseCategory::factory()->for($user, 'user')->create();

        Expense::factory()->forUserAndCategory($user, $category)->create([
            'spent_on' => '2026-03-20',
            'amount' => 99,
        ]);

        $this->actingAs($user)
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Home')
                ->has('expensesByDay', 1)
                ->where('expensesByDay.0.date', '2026-04-15')
                ->has('expensesByDay.0.expenses', fn ($c) => $c->toArray() === []));

        $this->travelBack();
    }
}
