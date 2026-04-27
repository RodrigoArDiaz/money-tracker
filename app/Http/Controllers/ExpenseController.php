<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Models\Expense;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    use AuthorizesRequests;

    public function store(StoreExpenseRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        Expense::query()->create([
            'user_id' => $request->user()->id,
            'expense_category_id' => $validated['expense_category_id'],
            'description' => trim((string) ($validated['description'] ?? '')),
            'amount' => $validated['amount'],
            'spent_on' => now()->toDateString(),
        ]);

        return redirect()
            ->route('home')
            ->with('success', __('frontend.expenses.flash.created'));
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): RedirectResponse
    {
        $validated = $request->validated();

        $expense->update([
            'expense_category_id' => $validated['expense_category_id'],
            'description' => trim((string) ($validated['description'] ?? '')),
            'amount' => $validated['amount'],
        ]);

        return redirect()
            ->route('home')
            ->with('success', __('frontend.expenses.flash.updated'));
    }

    public function destroy(Request $request, Expense $expense): RedirectResponse
    {
        $this->authorize('delete', $expense);

        $expense->delete();

        return redirect()
            ->route('home')
            ->with('success', __('frontend.expenses.flash.deleted'));
    }
}
