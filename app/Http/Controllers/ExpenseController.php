<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\RedirectsToHomeWithMonth;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Models\Expense;
use App\Services\Expense\ExpenseService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    use AuthorizesRequests;
    use RedirectsToHomeWithMonth;

    public function __construct(
        private readonly ExpenseService $expenseService,
    ) {}

    public function store(StoreExpenseRequest $request): RedirectResponse
    {
        $this->expenseService->create($request->user(), $request->validated());

        return $this->redirectToHomeWithMonth($request)
            ->with('success', __('frontend.expenses.flash.created'));
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): RedirectResponse
    {
        $this->expenseService->update($expense, $request->validated());

        return $this->redirectToHomeWithMonth($request)
            ->with('success', __('frontend.expenses.flash.updated'));
    }

    public function destroy(Request $request, Expense $expense): RedirectResponse
    {
        $this->authorize('delete', $expense);

        $this->expenseService->delete($expense);

        return $this->redirectToHomeWithMonth($request)
            ->with('success', __('frontend.expenses.flash.deleted'));
    }
}
