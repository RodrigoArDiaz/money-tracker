<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Models\Expense;
use App\Services\Expense\ExpenseService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;

class ExpenseController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly ExpenseService $expenseService,
    ) {}

    public function store(StoreExpenseRequest $request): RedirectResponse
    {
        $this->expenseService->createForToday($request->user(), $request->validated());

        return redirect()
            ->route('home')
            ->with('success', __('frontend.expenses.flash.created'));
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): RedirectResponse
    {
        $this->expenseService->update($expense, $request->validated());

        return redirect()
            ->route('home')
            ->with('success', __('frontend.expenses.flash.updated'));
    }

    public function destroy(Expense $expense): RedirectResponse
    {
        $this->authorize('delete', $expense);

        $this->expenseService->delete($expense);

        return redirect()
            ->route('home')
            ->with('success', __('frontend.expenses.flash.deleted'));
    }
}
