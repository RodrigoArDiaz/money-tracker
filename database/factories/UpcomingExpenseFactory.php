<?php

namespace Database\Factories;

use App\Enums\UpcomingExpenseKind;
use App\Enums\UpcomingExpensePaymentStatus;
use App\Models\ExpenseCategory;
use App\Models\UpcomingExpense;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UpcomingExpense>
 */
class UpcomingExpenseFactory extends Factory
{
    protected $model = UpcomingExpense::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $year = (int) now()->year;
        $month = (int) now()->month;

        return [
            'user_id' => User::factory(),
            'year' => $year,
            'month' => $month,
            'description' => fake()->sentence(3),
            'note' => fake()->optional()->sentence(),
            'amount' => fake()->randomFloat(2, 10, 500),
            'kind' => fake()->randomElement([UpcomingExpenseKind::Fixed, UpcomingExpenseKind::Variable]),
            'payment_status' => fake()->randomElement([UpcomingExpensePaymentStatus::Paid, UpcomingExpensePaymentStatus::Unpaid]),
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (UpcomingExpense $model): void {
            if ($model->expense_category_id !== null) {
                return;
            }

            if ($model->user_id === null) {
                return;
            }

            $user = User::query()->findOrFail($model->user_id);
            $model->expense_category_id = ExpenseCategory::factory()->for($user, 'user')->create()->id;
        });
    }

    public function forUser(User $user): static
    {
        return $this->state(function () use ($user): array {
            $category = ExpenseCategory::factory()->for($user, 'user')->create();

            return [
                'user_id' => $user->id,
                'expense_category_id' => $category->id,
            ];
        });
    }
}
