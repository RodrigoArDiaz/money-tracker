<?php

namespace App\Repositories;

use App\Models\UpcomingExpense;
use App\Models\User;
use Illuminate\Support\Collection;

class UpcomingExpenseRepository
{
    /**
     * @param  array{
     *     user_id: int,
     *     year: int,
     *     month: int,
     *     expense_category_id: int|null,
     *     description: string,
     *     note: string|null,
     *     amount: float|int|string,
     *     kind: string,
     *     payment_status: string,
     * }  $attributes
     */
    public function create(array $attributes): UpcomingExpense
    {
        return UpcomingExpense::query()->create($attributes);
    }

    /**
     * @param  array{
     *     expense_category_id?: int|null,
     *     description: string,
     *     note: string|null,
     *     amount: float|int|string,
     *     kind: string,
     *     payment_status: string,
     * }  $attributes
     */
    public function update(UpcomingExpense $upcomingExpense, array $attributes): void
    {
        $upcomingExpense->update($attributes);
    }

    public function delete(UpcomingExpense $upcomingExpense): void
    {
        $upcomingExpense->delete();
    }

    /**
     * Gastos planificados del usuario en un mes calendario, más recientes primero.
     *
     * @return Collection<int, UpcomingExpense>
     */
    public function forUserInMonth(User $user, int $year, int $month): Collection
    {
        return UpcomingExpense::query()
            ->where('user_id', $user->id)
            ->where('year', $year)
            ->where('month', $month)
            ->with(['category'])
            ->latest('id')
            ->get();
    }
}
