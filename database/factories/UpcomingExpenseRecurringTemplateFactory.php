<?php

namespace Database\Factories;

use App\Enums\UpcomingExpenseKind;
use App\Enums\UpcomingExpenseRecurrenceCadence;
use App\Models\ExpenseCategory;
use App\Models\UpcomingExpenseRecurringTemplate;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UpcomingExpenseRecurringTemplate>
 */
class UpcomingExpenseRecurringTemplateFactory extends Factory
{
    protected $model = UpcomingExpenseRecurringTemplate::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $year = (int) now()->year;
        $month = (int) now()->month;

        return [
            'user_id' => User::factory(),
            'expense_category_id' => null,
            'description' => fake()->sentence(3),
            'note' => fake()->optional()->sentence(),
            'amount' => fake()->randomFloat(2, 10, 500),
            'kind' => fake()->randomElement([UpcomingExpenseKind::Fixed, UpcomingExpenseKind::Variable]),
            'cadence' => UpcomingExpenseRecurrenceCadence::Monthly,
            'start_year' => $year,
            'start_month' => $month,
            'end_year' => null,
            'end_month' => null,
            'is_active' => true,
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (UpcomingExpenseRecurringTemplate $model): void {
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
        return $this->state(fn (): array => [
            'user_id' => $user->id,
        ]);
    }
}
