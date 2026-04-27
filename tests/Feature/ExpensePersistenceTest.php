<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ExpensePersistenceTest extends TestCase
{
    use LazilyRefreshDatabase;

    #[Test]
    public function expense_factory_keeps_category_owned_by_same_user(): void
    {
        $expense = Expense::factory()->create();

        $this->assertSame($expense->user_id, $expense->category->user_id);
    }

    #[Test]
    public function user_can_have_expense_categories_and_expenses(): void
    {
        $user = User::factory()->create();
        $category = ExpenseCategory::factory()->for($user, 'user')->create([
            'name' => 'Comida',
        ]);
        $expense = Expense::factory()->forUserAndCategory($user, $category)->create([
            'description' => 'Almuerzo',
            'amount' => 12.5,
            'spent_on' => '2026-04-26',
        ]);

        $user->refresh();

        $this->assertTrue($user->expenseCategories->contains($category));
        $this->assertTrue($user->expenses->contains($expense));
        $this->assertSame('Comida', $expense->category->name);
        $this->assertSame('2026-04-26', $expense->spent_on->format('Y-m-d'));
    }

    #[Test]
    public function user_can_link_expense_to_system_category(): void
    {
        $this->artisan('default-expense-categories:sync');

        $user = User::factory()->create();
        $systemCategory = ExpenseCategory::query()->system()->firstOrFail();

        $expense = Expense::factory()->forUserAndCategory($user, $systemCategory)->create([
            'description' => 'Café',
            'amount' => 3.25,
            'spent_on' => '2026-04-26',
        ]);

        $this->assertSame($systemCategory->id, $expense->expense_category_id);
        $this->assertTrue($expense->category->isSystem());
    }
}
