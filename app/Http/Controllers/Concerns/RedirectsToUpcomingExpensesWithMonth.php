<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

trait RedirectsToUpcomingExpensesWithMonth
{
    protected function redirectToUpcomingExpensesWithMonth(Request $request): RedirectResponse
    {
        $year = (int) ($request->input('redirect_year') ?? $request->query('redirect_year') ?? now()->year);
        $month = (int) ($request->input('redirect_month') ?? $request->query('redirect_month') ?? now()->month);

        if ($month < 1 || $month > 12) {
            $month = (int) now()->month;
        }

        if ($year < 2000 || $year > 2100) {
            $year = (int) now()->year;
        }

        return redirect()->route('upcoming-expenses.index', [
            'year' => $year,
            'month' => $month,
        ]);
    }

    protected function redirectToUpcomingRecurringWithMonth(Request $request): RedirectResponse
    {
        $year = (int) ($request->input('redirect_year') ?? $request->query('redirect_year') ?? now()->year);
        $month = (int) ($request->input('redirect_month') ?? $request->query('redirect_month') ?? now()->month);

        if ($month < 1 || $month > 12) {
            $month = (int) now()->month;
        }

        if ($year < 2000 || $year > 2100) {
            $year = (int) now()->year;
        }

        return redirect()->route('upcoming-expenses.recurring', [
            'year' => $year,
            'month' => $month,
        ]);
    }
}
