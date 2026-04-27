<?php

namespace App\Http\Controllers\Concerns;

use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

trait RedirectsToHomeWithMonth
{
    protected function redirectToHomeWithMonth(Request $request): RedirectResponse
    {
        $year = (int) ($request->input('redirect_year') ?? $request->query('redirect_year') ?? now()->year);
        $month = (int) ($request->input('redirect_month') ?? $request->query('redirect_month') ?? now()->month);

        if ($month < 1 || $month > 12) {
            $month = (int) now()->month;
        }

        if ($year < 2000 || $year > 2100) {
            $year = (int) now()->year;
        }

        $requested = Carbon::create($year, $month, 1)->startOfMonth();
        $current = now()->startOfMonth();

        if ($requested->isAfter($current)) {
            $year = (int) $current->year;
            $month = (int) $current->month;
        }

        return redirect()->route('home', [
            'year' => $year,
            'month' => $month,
        ]);
    }
}
