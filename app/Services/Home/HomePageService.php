<?php

namespace App\Services\Home;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use App\Repositories\ExpenseCategoryRepository;
use App\Repositories\ExpenseRepository;

class HomePageService
{
    public function __construct(
        private readonly ExpenseCategoryRepository $expenseCategoryRepository,
        private readonly ExpenseRepository $expenseRepository,
    ) {}

    /**
     * Props de Inertia para la página Home (usuario autenticado).
     *
     * @return array{
     *     today: string,
     *     myCategories: list<array{id: int, name: string, icon: string|null}>,
     *     defaultCategories: list<array{id: int, name: string, icon: string|null}>,
     *     expenses: list<array{
     *         id: int,
     *         expense_category_id: int,
     *         description: string,
     *         amount: string,
     *         category_name: string,
     *         category_icon: string|null
     *     }>
     * }
     */
    public function inertiaPropsForAuthenticatedUser(User $user): array
    {
        $locale = app()->getLocale();
        $today = now()->toDateString();

        $myCategories = $this->expenseCategoryRepository
            ->ownedByUserOrdered($user)
            ->map(fn (ExpenseCategory $category): array => [
                'id' => $category->id,
                'name' => $category->localizedName($locale),
                'icon' => $category->icon,
            ])
            ->all();

        $defaultCategories = $this->expenseCategoryRepository
            ->systemOrdered()
            ->map(fn (ExpenseCategory $row): array => [
                'id' => $row->id,
                'name' => $row->localizedName($locale),
                'icon' => $row->icon,
            ])
            ->all();

        $expenses = $this->expenseRepository
            ->forUserOnDateWithCategory($user, $today)
            ->map(fn (Expense $expense): array => [
                'id' => $expense->id,
                'expense_category_id' => $expense->expense_category_id,
                'description' => $expense->description,
                'amount' => (string) $expense->amount,
                'category_name' => $expense->category->localizedName($locale),
                'category_icon' => $expense->category->icon,
            ])
            ->all();

        return [
            'today' => $today,
            'myCategories' => $myCategories,
            'defaultCategories' => $defaultCategories,
            'expenses' => $expenses,
        ];
    }
}
