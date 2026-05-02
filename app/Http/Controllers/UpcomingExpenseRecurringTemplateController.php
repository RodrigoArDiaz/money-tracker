<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\RedirectsToUpcomingExpensesWithMonth;
use App\Http\Requests\StoreUpcomingExpenseRecurringTemplateRequest;
use App\Http\Requests\UpdateUpcomingExpenseRecurringTemplateRequest;
use App\Models\UpcomingExpenseRecurringTemplate;
use App\Models\User;
use App\Services\UpcomingExpense\UpcomingExpenseService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UpcomingExpenseRecurringTemplateController extends Controller
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

        $year = (int) $request->query('year', now()->year);
        $month = (int) $request->query('month', now()->month);

        if ($month < 1 || $month > 12 || $year < 2000 || $year > 2100) {
            $year = (int) now()->year;
            $month = (int) now()->month;
        }

        return Inertia::render(
            'UpcomingExpensesRecurring',
            $this->upcomingExpenseService->recurringTemplatesPageData($user, $year, $month),
        );
    }

    public function store(StoreUpcomingExpenseRecurringTemplateRequest $request): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $validated = $request->validated();
        $this->upcomingExpenseService->createRecurringTemplate($user, [
            'description' => $validated['description'],
            'note' => $validated['note'] ?? null,
            'amount' => $validated['amount'],
            'kind' => $validated['kind'],
            'expense_category_id' => $validated['expense_category_id'],
            'start_year' => $validated['start_year'],
            'start_month' => $validated['start_month'],
            'end_year' => $validated['end_year'] ?? null,
            'end_month' => $validated['end_month'] ?? null,
        ]);

        return $this->redirectToUpcomingRecurringWithMonth($request)
            ->with('success', __('frontend.upcoming_expenses.recurring.flash.template_created'));
    }

    public function update(
        UpdateUpcomingExpenseRecurringTemplateRequest $request,
        UpcomingExpenseRecurringTemplate $recurring_template,
    ): RedirectResponse {
        $validated = $request->validated();
        $this->upcomingExpenseService->updateOwnedRecurringTemplate($recurring_template, [
            'description' => $validated['description'],
            'note' => $validated['note'] ?? null,
            'amount' => $validated['amount'],
            'kind' => $validated['kind'],
            'expense_category_id' => $validated['expense_category_id'],
            'is_active' => $validated['is_active'],
            'end_year' => $validated['end_year'] ?? null,
            'end_month' => $validated['end_month'] ?? null,
        ]);

        return $this->redirectToUpcomingRecurringWithMonth($request)
            ->with('success', __('frontend.upcoming_expenses.recurring.flash.template_updated'));
    }

    public function destroy(Request $request, UpcomingExpenseRecurringTemplate $recurring_template): RedirectResponse
    {
        $this->authorize('delete', $recurring_template);

        $this->upcomingExpenseService->deleteOwnedRecurringTemplate($recurring_template);

        return $this->redirectToUpcomingRecurringWithMonth($request)
            ->with('success', __('frontend.upcoming_expenses.recurring.flash.template_deleted'));
    }
}
