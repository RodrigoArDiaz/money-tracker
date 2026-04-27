<?php

namespace App\Services\Home;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use App\Repositories\ExpenseCategoryRepository;
use App\Repositories\ExpenseRepository;
use Illuminate\Support\Collection;

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
     *     viewYear: int,
     *     viewMonth: int,
     *     myCategories: list<array{id: int, name: string, icon: string|null}>,
     *     defaultCategories: list<array{id: int, name: string, icon: string|null}>,
     *     expensesByDay: list<array{
     *         date: string,
     *         expenses: list<array{
     *             id: int,
     *             expense_category_id: int,
     *             description: string,
     *             amount: string,
     *             category_name: string,
     *             category_icon: string|null
     *         }>
     *     }>
     * }
     */
    public function inertiaPropsForAuthenticatedUser(User $user, int $viewYear, int $viewMonth): array
    {
        $locale = app()->getLocale();
        $now = now();
        $today = $now->toDateString();
        $isViewingCurrentMonth = $viewYear === (int) $now->year && $viewMonth === (int) $now->month;

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

        $monthExpenses = $this->expenseRepository->forUserInMonthWithCategory($user, $viewYear, $viewMonth);

        /** @var Collection<string, Collection<int, Expense>> $byDate */
        $byDate = $monthExpenses->groupBy(fn (Expense $expense): string => $expense->spent_on->toDateString());

        $datesToShow = $isViewingCurrentMonth
            ? $byDate->keys()
                ->merge([$today])
                ->unique()
                ->filter(fn (string $date): bool => $date === $today || $byDate->has($date))
                ->sort()
                ->values()
                ->reverse()
                ->values()
            : $byDate->keys()
                ->sort()
                ->values()
                ->reverse()
                ->values();

        $expensesByDay = $datesToShow
            ->map(function (string $date) use ($byDate, $locale): array {
                $rows = $byDate->get($date, collect());

                return [
                    'date' => $date,
                    'expenses' => $rows
                        ->map(fn (Expense $expense): array => [
                            'id' => $expense->id,
                            'expense_category_id' => $expense->expense_category_id,
                            'description' => $expense->description,
                            'amount' => (string) $expense->amount,
                            'category_name' => $expense->category->localizedName($locale),
                            'category_icon' => $expense->category->icon,
                        ])
                        ->values()
                        ->all(),
                ];
            })
            ->all();

        return [
            'today' => $today,
            'viewYear' => $viewYear,
            'viewMonth' => $viewMonth,
            'myCategories' => $myCategories,
            'defaultCategories' => $defaultCategories,
            'expensesByDay' => $expensesByDay,
        ];
    }
}
