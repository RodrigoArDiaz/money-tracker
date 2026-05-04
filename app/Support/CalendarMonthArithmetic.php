<?php

namespace App\Support;

use Carbon\CarbonImmutable;

/**
 * Operaciones sobre año/mes calendario (primer día del mes).
 */
final class CalendarMonthArithmetic
{
    /**
     * Suma meses naturales al primer día del mes indicado.
     *
     * @return array{y: int, m: int}
     */
    public static function addMonths(int $year, int $month, int $deltaMonths): array
    {
        $d = CarbonImmutable::create($year, $month, 1)->addMonths($deltaMonths);

        return [
            'y' => (int) $d->year,
            'm' => (int) $d->month,
        ];
    }
}
