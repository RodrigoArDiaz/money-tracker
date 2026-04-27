<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExpenseRequest;
use App\Models\Expense;
use Illuminate\Http\RedirectResponse;

class ExpenseController extends Controller
{
    public function store(StoreExpenseRequest $request): RedirectResponse
    {
        Expense::query()->create([
            'user_id' => $request->user()->id,
            'expense_category_id' => $request->validated('expense_category_id'),
            'description' => $request->validated('description'),
            'amount' => $request->validated('amount'),
            'spent_on' => now()->toDateString(),
        ]);

        return redirect()
            ->route('home')
            ->with('success', __('frontend.expenses.flash.created'));
    }
}
