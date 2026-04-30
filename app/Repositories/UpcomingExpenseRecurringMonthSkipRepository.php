<?php

namespace App\Repositories;

use App\Models\UpcomingExpenseRecurringMonthSkip;

class UpcomingExpenseRecurringMonthSkipRepository
{
    public function record(int $userId, int $templateId, int $year, int $month): void
    {
        UpcomingExpenseRecurringMonthSkip::query()->firstOrCreate(
            [
                'upcoming_expense_recurring_template_id' => $templateId,
                'year' => $year,
                'month' => $month,
            ],
            [
                'user_id' => $userId,
            ],
        );
    }

    public function existsForTemplateMonth(int $templateId, int $year, int $month): bool
    {
        return UpcomingExpenseRecurringMonthSkip::query()
            ->where('upcoming_expense_recurring_template_id', $templateId)
            ->where('year', $year)
            ->where('month', $month)
            ->exists();
    }
}
