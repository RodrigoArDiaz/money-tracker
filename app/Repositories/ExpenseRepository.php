<?php

namespace App\Repositories;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ExpenseRepository
{
    /**
     * @param  array{
     *     user_id: int,
     *     expense_category_id: int,
     *     description: string,
     *     amount: float|int|string,
     *     spent_on: string,
     *     upcoming_expense_id?: int|null,
     * }  $attributes
     */
    public function create(array $attributes): Expense
    {
        return Expense::query()->create([
            'user_id' => $attributes['user_id'],
            'expense_category_id' => $attributes['expense_category_id'],
            'description' => $attributes['description'],
            'amount' => $attributes['amount'],
            'spent_on' => $attributes['spent_on'],
            'upcoming_expense_id' => $attributes['upcoming_expense_id'] ?? null,
        ]);
    }

    public function deleteByUpcomingExpenseId(int $upcomingExpenseId): void
    {
        Expense::query()
            ->where('upcoming_expense_id', $upcomingExpenseId)
            ->delete();
    }

    /**
     * @param  array{
     *     expense_category_id: int,
     *     description: string,
     *     amount: float|int|string
     * }  $attributes
     */
    public function update(Expense $expense, array $attributes): void
    {
        $expense->update($attributes);
    }

    public function delete(Expense $expense): void
    {
        $expense->delete();
    }

    /**
     * Gastos del usuario en una fecha, con categoría cargada, más recientes primero.
     *
     * @return Collection<int, Expense>
     */
    public function forUserOnDateWithCategory(User $user, CarbonInterface|string $date): Collection
    {
        return Expense::query()
            ->where('user_id', $user->id)
            ->whereDate('spent_on', $date)
            ->with(['category'])
            ->latest()
            ->get();
    }

    /**
     * Gastos del usuario en un mes calendario (año/mes), con categoría cargada.
     * Orden: día más reciente primero, luego más recientes dentro del día.
     *
     * @return Collection<int, Expense>
     */
    public function forUserInMonthWithCategory(User $user, int $year, int $month): Collection
    {
        return Expense::query()
            ->where('user_id', $user->id)
            ->whereYear('spent_on', $year)
            ->whereMonth('spent_on', $month)
            ->with(['category'])
            ->orderByDesc('spent_on')
            ->orderByDesc('id')
            ->get();
    }

    /**
     * Suma de gastos por categoría en un mes calendario, mayor total primero.
     *
     * @return list<array{id: int, name: string, icon: string|null, total: string}>
     */
    public function sumByCategoryInMonthForUser(User $user, int $year, int $month): array
    {
        $rows = DB::table('expenses')
            ->select('expense_category_id', DB::raw('SUM(amount) as total'))
            ->where('user_id', $user->id)
            ->whereYear('spent_on', $year)
            ->whereMonth('spent_on', $month)
            ->groupBy('expense_category_id')
            ->orderByDesc('total')
            ->get();

        return $this->mapCategoryIdTotalsToPayload($rows);
    }

    /**
     * Suma de gastos por categoría en un año calendario, mayor total primero.
     *
     * @return list<array{id: int, name: string, icon: string|null, total: string}>
     */
    public function sumByCategoryInYearForUser(User $user, int $year): array
    {
        $rows = DB::table('expenses')
            ->select('expense_category_id', DB::raw('SUM(amount) as total'))
            ->where('user_id', $user->id)
            ->whereYear('spent_on', $year)
            ->groupBy('expense_category_id')
            ->orderByDesc('total')
            ->get();

        return $this->mapCategoryIdTotalsToPayload($rows);
    }

    /**
     * @param  Collection<int, object>  $rows
     *                                         filas con expense_category_id y total (agregado)
     * @return list<array{id: int, name: string, icon: string|null, total: string}>
     */
    private function mapCategoryIdTotalsToPayload(Collection $rows): array
    {
        if ($rows->isEmpty()) {
            return [];
        }

        $locale = app()->getLocale();
        $ids = $rows->pluck('expense_category_id')->map(fn ($id): int => (int) $id)->all();
        $categories = ExpenseCategory::query()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        $out = [];
        foreach ($rows as $row) {
            $id = (int) $row->expense_category_id;
            $category = $categories->get($id);
            if (! $category instanceof ExpenseCategory) {
                continue;
            }
            $out[] = [
                'id' => $id,
                'name' => $category->localizedName($locale),
                'icon' => $category->icon,
                'total' => number_format((float) $row->total, 2, '.', ''),
            ];
        }

        return $out;
    }
}
