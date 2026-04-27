<?php

namespace Database\Factories;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    protected $model = Expense::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'description' => fake()->sentence(),
            'amount' => fake()->randomFloat(2, 1, 500),
            'spent_on' => fake()->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
        ];
    }

    /**
     * Alinea categoría y usuario del gasto.
     */
    public function forUserAndCategory(User $user, ExpenseCategory $category): static
    {
        return $this->state(fn (array $attributes): array => [
            'user_id' => $user->id,
            'expense_category_id' => $category->id,
        ]);
    }

    public function configure(): static
    {
        return $this->afterMaking(function (Expense $expense): void {
            if ($expense->exists) {
                return;
            }

            if ($expense->expense_category_id !== null && $expense->user_id === null) {
                $category = ExpenseCategory::query()->findOrFail($expense->expense_category_id);
                $expense->user_id = $category->user_id;

                return;
            }

            $user = $expense->user_id === null
                ? User::factory()->create()
                : User::query()->findOrFail($expense->user_id);

            if ($expense->user_id === null) {
                $expense->user_id = $user->id;
            }

            if ($expense->expense_category_id === null) {
                $expense->expense_category_id = ExpenseCategory::factory()
                    ->for($user, 'user')
                    ->create()
                    ->id;

                return;
            }

            $category = ExpenseCategory::query()->find($expense->expense_category_id);
            $categoryOwnedByUser = $category !== null
                && ($category->user_id === null || (int) $category->user_id === (int) $user->id);
            if ($category === null || ! $categoryOwnedByUser) {
                $expense->expense_category_id = ExpenseCategory::factory()
                    ->for($user, 'user')
                    ->create()
                    ->id;
            }
        });
    }
}
