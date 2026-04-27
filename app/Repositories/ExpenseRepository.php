<?php

namespace App\Repositories;

use App\Models\Expense;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class ExpenseRepository
{
    /**
     * @param  array{
     *     user_id: int,
     *     expense_category_id: int,
     *     description: string,
     *     amount: float|int|string,
     *     spent_on: string
     * }  $attributes
     */
    public function create(array $attributes): Expense
    {
        return Expense::query()->create($attributes);
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
}
