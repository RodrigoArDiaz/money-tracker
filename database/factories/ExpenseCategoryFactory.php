<?php

namespace Database\Factories;

use App\Models\ExpenseCategory;
use App\Models\User;
use App\Support\ExpenseCategoryIcons;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExpenseCategory>
 */
class ExpenseCategoryFactory extends Factory
{
    protected $model = ExpenseCategory::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->words(2, true),
            'icon' => fake()->randomElement(ExpenseCategoryIcons::names()),
        ];
    }
}
