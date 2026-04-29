<?php

namespace App\Services\UpcomingExpense;

use App\Enums\UpcomingExpenseKind;
use App\Enums\UpcomingExpensePaymentStatus;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\UpcomingExpense;
use App\Models\User;
use App\Repositories\ExpenseCategoryRepository;
use App\Repositories\ExpenseRepository;
use App\Repositories\UpcomingExpenseRepository;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class UpcomingExpenseService
{
    public function __construct(
        private readonly UpcomingExpenseRepository $upcomingExpenseRepository,
        private readonly ExpenseRepository $expenseRepository,
        private readonly ExpenseCategoryRepository $expenseCategoryRepository,
    ) {}

    /**
     * @param  array{
     *     year: int,
     *     month: int,
     *     description: string,
     *     note?: string|null,
     *     amount: float|int|string,
     *     kind: string,
     *     expense_category_id: int,
     * }  $validated
     */
    public function createForMonth(User $user, array $validated): UpcomingExpense
    {
        return $this->upcomingExpenseRepository->create([
            'user_id' => $user->id,
            'year' => $validated['year'],
            'month' => $validated['month'],
            'expense_category_id' => $validated['expense_category_id'],
            'description' => trim($validated['description']),
            'note' => $this->normalizeNote($validated['note'] ?? null),
            'amount' => $validated['amount'],
            'kind' => UpcomingExpenseKind::from($validated['kind'])->value,
            'payment_status' => UpcomingExpensePaymentStatus::Unpaid->value,
        ]);
    }

    /**
     * @param  array{
     *     description: string,
     *     note?: string|null,
     *     amount: float|int|string,
     *     kind: string,
     *     payment_status: string,
     *     expense_category_id: int,
     * }  $validated
     */
    public function update(UpcomingExpense $upcomingExpense, array $validated): void
    {
        DB::transaction(function () use ($upcomingExpense, $validated): void {
            $this->upcomingExpenseRepository->update($upcomingExpense, [
                'description' => trim($validated['description']),
                'note' => $this->normalizeNote($validated['note'] ?? null),
                'amount' => $validated['amount'],
                'kind' => UpcomingExpenseKind::from($validated['kind'])->value,
                'payment_status' => UpcomingExpensePaymentStatus::from($validated['payment_status'])->value,
                'expense_category_id' => $validated['expense_category_id'],
            ]);

            $upcomingExpense->refresh();

            $this->syncLinkedExpenseForUpcomingRow($upcomingExpense);
        });
    }

    public function delete(UpcomingExpense $upcomingExpense): void
    {
        $this->upcomingExpenseRepository->delete($upcomingExpense);
    }

    /**
     * Datos para la página Inertia de gastos futuros.
     *
     * @return array{
     *     viewYear: int,
     *     viewMonth: int,
     *     myCategories: list<array{id: int, name: string, icon: string|null}>,
     *     defaultCategories: list<array{id: int, name: string, icon: string|null}>,
     *     expenses: list<array{
     *         id: int,
     *         expense_category_id: int|null,
     *         category_name: string,
     *         category_icon: string|null,
     *         description: string,
     *         amount: string,
     *         note: string|null,
     *         kind: string,
     *         payment_status: string,
     *     }>,
     *     total_amount: string,
     *     unpaid_total: string,
     * }
     */
    public function pageDataForMonth(User $user, int $year, int $month): array
    {
        $locale = app()->getLocale();

        /** @var Collection<int, UpcomingExpense> $collection */
        $collection = $this->upcomingExpenseRepository->forUserInMonth($user, $year, $month);

        $totalAmount = 0.0;
        $unpaidTotal = 0.0;

        foreach ($collection as $expense) {
            $amt = (float) $expense->amount;
            $totalAmount += $amt;
            if ($expense->payment_status === UpcomingExpensePaymentStatus::Unpaid) {
                $unpaidTotal += $amt;
            }
        }

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

        return [
            'viewYear' => $year,
            'viewMonth' => $month,
            'myCategories' => $myCategories,
            'defaultCategories' => $defaultCategories,
            'expenses' => $collection
                ->map(function (UpcomingExpense $e) use ($locale): array {
                    $category = $e->category;

                    return [
                        'id' => $e->id,
                        'expense_category_id' => $e->expense_category_id,
                        'category_name' => $category instanceof ExpenseCategory
                            ? $category->localizedName($locale)
                            : '',
                        'category_icon' => $category?->icon,
                        'description' => $e->description,
                        'amount' => number_format((float) $e->amount, 2, '.', ''),
                        'note' => $e->note,
                        'kind' => $e->kind->value,
                        'payment_status' => $e->payment_status->value,
                    ];
                })
                ->values()
                ->all(),
            'total_amount' => number_format($totalAmount, 2, '.', ''),
            'unpaid_total' => number_format($unpaidTotal, 2, '.', ''),
        ];
    }

    private function normalizeNote(mixed $note): ?string
    {
        if ($note === null) {
            return null;
        }

        $trimmed = trim((string) $note);

        return $trimmed === '' ? null : $trimmed;
    }

    /**
     * Crea o actualiza el gasto diario cuando el estado es «pagado»; lo elimina si pasa a «sin pagar».
     */
    private function syncLinkedExpenseForUpcomingRow(UpcomingExpense $upcoming): void
    {
        if ($upcoming->payment_status !== UpcomingExpensePaymentStatus::Paid) {
            $this->expenseRepository->deleteByUpcomingExpenseId($upcoming->id);

            return;
        }

        if ($upcoming->expense_category_id === null) {
            return;
        }

        $linked = Expense::query()
            ->where('upcoming_expense_id', $upcoming->id)
            ->first();

        if ($linked !== null) {
            $this->expenseRepository->update($linked, [
                'expense_category_id' => $upcoming->expense_category_id,
                'description' => $upcoming->description,
                'amount' => $upcoming->amount,
            ]);

            return;
        }

        $this->expenseRepository->create([
            'user_id' => $upcoming->user_id,
            'expense_category_id' => $upcoming->expense_category_id,
            'description' => $upcoming->description,
            'amount' => $upcoming->amount,
            'spent_on' => now()->toDateString(),
            'upcoming_expense_id' => $upcoming->id,
        ]);
    }
}
