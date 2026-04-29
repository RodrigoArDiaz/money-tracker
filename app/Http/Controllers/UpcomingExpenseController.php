<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\RedirectsToUpcomingExpensesWithMonth;
use App\Http\Requests\StoreUpcomingExpenseRequest;
use App\Http\Requests\UpdateUpcomingExpenseRequest;
use App\Models\UpcomingExpense;
use App\Models\User;
use App\Services\UpcomingExpense\UpcomingExpenseService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UpcomingExpenseController extends Controller
{
    use AuthorizesRequests;
    use RedirectsToUpcomingExpensesWithMonth;

    public function __construct(
        private readonly UpcomingExpenseService $upcomingExpenseService,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        assert($user instanceof User);

        [$year, $month] = $this->resolveUpcomingMonthQuery($request);

        return Inertia::render(
            'UpcomingExpenses',
            $this->upcomingExpenseService->pageDataForMonth($user, $year, $month),
        );
    }

    public function store(StoreUpcomingExpenseRequest $request): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $this->upcomingExpenseService->createForMonth($user, $request->validated());

        return $this->redirectToUpcomingExpensesWithMonth($request)
            ->with('success', __('frontend.upcoming_expenses.flash.created'));
    }

    public function update(UpdateUpcomingExpenseRequest $request, UpcomingExpense $upcomingExpense): RedirectResponse
    {
        $this->upcomingExpenseService->update($upcomingExpense, $request->validated());

        return $this->redirectToUpcomingExpensesWithMonth($request)
            ->with('success', __('frontend.upcoming_expenses.flash.updated'));
    }

    public function destroy(Request $request, UpcomingExpense $upcomingExpense): RedirectResponse
    {
        $this->authorize('delete', $upcomingExpense);

        $this->upcomingExpenseService->delete($upcomingExpense);

        return $this->redirectToUpcomingExpensesWithMonth($request)
            ->with('success', __('frontend.upcoming_expenses.flash.deleted'));
    }

    /**
     * @return array{0: int, 1: int}
     */
    private function resolveUpcomingMonthQuery(Request $request): array
    {
        $year = (int) $request->query('year', now()->year);
        $month = (int) $request->query('month', now()->month);

        if ($month < 1 || $month > 12 || $year < 2000 || $year > 2100) {
            return [(int) now()->year, (int) now()->month];
        }

        return [$year, $month];
    }
}
