<?php

namespace App\Repositories;

use App\Enums\UpcomingExpenseRecurrenceCadence;
use App\Models\UpcomingExpenseRecurringTemplate;
use App\Models\User;
use Illuminate\Support\Collection;

class UpcomingExpenseRecurringTemplateRepository
{
    /**
     * @param  array{
     *     user_id: int,
     *     expense_category_id: int,
     *     description: string,
     *     note: string|null,
     *     amount: float|int|string,
     *     kind: string,
     *     cadence: string,
     *     start_year: int,
     *     start_month: int,
     *     end_year: int|null,
     *     end_month: int|null,
     *     is_active: bool,
     * }  $attributes
     */
    public function create(array $attributes): UpcomingExpenseRecurringTemplate
    {
        return UpcomingExpenseRecurringTemplate::query()->create($attributes);
    }

    /**
     * @param  array{
     *     expense_category_id?: int,
     *     description?: string,
     *     note?: string|null,
     *     amount?: float|int|string,
     *     kind?: string,
     *     cadence?: string,
     *     start_year?: int,
     *     start_month?: int,
     *     end_year?: int|null,
     *     end_month?: int|null,
     *     is_active?: bool,
     * }  $attributes
     */
    public function update(UpcomingExpenseRecurringTemplate $template, array $attributes): void
    {
        $template->update($attributes);
    }

    public function delete(UpcomingExpenseRecurringTemplate $template): void
    {
        $template->delete();
    }

    /**
     * Plantillas activas mensuales del usuario que cubren el mes dado (para materializar instancias).
     *
     * @return Collection<int, UpcomingExpenseRecurringTemplate>
     */
    public function activeMonthlyCoveringMonth(User $user, int $year, int $month): Collection
    {
        $viewYm = $year * 12 + $month;

        return UpcomingExpenseRecurringTemplate::query()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->where('cadence', UpcomingExpenseRecurrenceCadence::Monthly->value)
            ->get()
            ->filter(function (UpcomingExpenseRecurringTemplate $template) use ($viewYm): bool {
                $startYm = $template->start_year * 12 + $template->start_month;
                if ($viewYm < $startYm) {
                    return false;
                }

                if ($template->end_year === null && $template->end_month === null) {
                    return true;
                }

                if ($template->end_year === null || $template->end_month === null) {
                    return true;
                }

                $endYm = $template->end_year * 12 + $template->end_month;

                return $viewYm <= $endYm;
            })
            ->values();
    }

    /**
     * @return Collection<int, UpcomingExpenseRecurringTemplate>
     */
    public function orderedForUser(User $user): Collection
    {
        return UpcomingExpenseRecurringTemplate::query()
            ->where('user_id', $user->id)
            ->with(['category'])
            ->orderByDesc('id')
            ->get();
    }
}
