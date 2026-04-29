<?php

namespace Database\Factories;

use App\Enums\UpcomingExpenseKind;
use App\Enums\UpcomingExpensePaymentStatus;
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
            'year' => $year,
            'month' => $month,
            'description' => fake()->sentence(3),
            'note' => fake()->optional()->sentence(),
            'amount' => fake()->randomFloat(2, 10, 500),
            'kind' => fake()->randomElement([UpcomingExpenseKind::Fixed, UpcomingExpenseKind::Variable]),
            'payment_status' => fake()->randomElement([UpcomingExpensePaymentStatus::Paid, UpcomingExpensePaymentStatus::Unpaid]),
        ];
    }

    public function forUser(User $user): static
    {
        return $this->state(fn (array $attributes): array => [
            'user_id' => $user->id,
        ]);
    }
}
