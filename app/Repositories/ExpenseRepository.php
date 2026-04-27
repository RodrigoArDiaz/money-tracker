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
}
