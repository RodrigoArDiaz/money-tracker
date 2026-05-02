<?php

namespace App\Repositories;

use App\Enums\UpcomingExpensePaymentStatus;
use App\Models\UpcomingExpense;
use App\Models\User;
use Illuminate\Support\Collection;

class UpcomingExpenseRepository
{
    /**
     * @param  array{
     *     user_id: int,
     *     recurring_template_id: int|null,
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

    /**
     * Para actualizar una serie: meses ≥ ancla, filas sin pagar o la fila editada (p. ej. pagada en el mes ancla).
     *
     * @return Collection<int, UpcomingExpense>
     */
    public function forRecurringTemplateFromMonthForSeriesUpdate(
        int $templateId,
        int $fromYear,
        int $fromMonth,
        int $anchorExpenseId,
    ): Collection {
        $fromYm = $fromYear * 12 + $fromMonth;

        return UpcomingExpense::query()
            ->where('recurring_template_id', $templateId)
            ->whereRaw('(year * 12 + month) >= ?', [$fromYm])
            ->where(function ($q) use ($anchorExpenseId): void {
                $q->where('payment_status', UpcomingExpensePaymentStatus::Unpaid)
                    ->orWhere('id', $anchorExpenseId);
            })
            ->orderBy('year')
            ->orderBy('month')
            ->get();
    }

    public function existsForRecurringTemplateInMonth(int $templateId, int $year, int $month): bool
    {
        return UpcomingExpense::query()
            ->where('recurring_template_id', $templateId)
            ->where('year', $year)
            ->where('month', $month)
            ->exists();
    }
}
