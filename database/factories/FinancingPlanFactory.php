<?php

namespace Database\Factories;

use App\Models\ExpenseCategory;
use App\Models\FinancingPlan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FinancingPlan>
 */
class FinancingPlanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'expense_category_id' => ExpenseCategory::factory(),
            'description' => fake()->words(4, true),
            'note' => null,
            'total_amount' => '100.00',
            'archived_at' => null,
        ];
    }

    protected function configure(): static
    {
        return $this->afterCreating(function (FinancingPlan $plan): void {
            ExpenseCategory::query()->whereKey($plan->expense_category_id)->update(['user_id' => $plan->user_id]);
        });
    }
}
