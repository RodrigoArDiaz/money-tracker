<?php

namespace App\Services\Charts;

use App\Models\User;
use App\Repositories\ExpenseRepository;
use Illuminate\Support\Carbon;

class ChartsPageService
{
    public function __construct(
        private readonly ExpenseRepository $expenseRepository,
    ) {}

    /**
     * @return array{
     *     period: 'month'|'year',
     *     viewYear: int,
     *     viewMonth: int,
     *     categoryTotals: list<array{id: int, name: string, icon: string|null, total: string}>
     * }
     */
    public function inertiaPropsForUser(User $user, string $period, int $viewYear, int $viewMonth): array
    {
        $categoryTotals = $period === 'year'
            ? $this->expenseRepository->sumByCategoryInYearForUser($user, $viewYear)
            : $this->expenseRepository->sumByCategoryInMonthForUser($user, $viewYear, $viewMonth);

        return [
            'period' => $period,
            'viewYear' => $viewYear,
            'viewMonth' => $viewMonth,
            'categoryTotals' => $categoryTotals,
        ];
    }

    /**
     * Ajusta periodo, año y mes a partir de la query, sin fechas futuras.
     *
     * @return array{0: 'month'|'year', 1: int, 2: int}
     */
    public function resolveViewFromQuery(Carbon $now, string $rawPeriod, int $year, int $month): array
    {
        $period = $rawPeriod === 'year' ? 'year' : 'month';

        if ($year < 2000 || $year > 2100) {
            $year = (int) $now->year;
        }
        if ($month < 1 || $month > 12) {
            $month = (int) $now->month;
        }

        if ($period === 'year' && $year > (int) $now->year) {
            $year = (int) $now->year;
        }

        if ($period === 'month') {
            $requested = Carbon::create($year, $month, 1)->startOfMonth();
            $current = $now->copy()->startOfMonth();
            if ($requested->isAfter($current)) {
                return ['month', (int) $now->year, (int) $now->month];
            }
        }

        return [$period, $year, $month];
    }
}
