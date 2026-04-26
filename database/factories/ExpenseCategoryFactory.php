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
        $name = fake()->words(2, true);

        return [
            'user_id' => User::factory(),
            'name' => $name,
            'names' => ['es' => $name, 'en' => $name],
            'icon' => fake()->randomElement(ExpenseCategoryIcons::names()),
        ];
    }
}
