<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExpenseCategoryRequest;
use App\Http\Requests\UpdateExpenseCategoryRequest;
use App\Models\ExpenseCategory;
use App\Support\ExpenseCategoryIcons;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseCategoryController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', ExpenseCategory::class);

        $locale = app()->getLocale();

        $categories = $request->user()
            ->expenseCategories()
            ->withCount('expenses')
            ->orderByRaw('LOWER(name)')
            ->orderBy('id')
            ->get()
            ->map(fn (ExpenseCategory $category): array => [
                'id' => $category->id,
                'name' => $category->localizedName($locale),
                'icon' => $category->icon,
                'expenses_count' => $category->expenses_count,
            ]);

        $defaultExpenseCategories = ExpenseCategory::query()
            ->system()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (ExpenseCategory $row): array => [
                'id' => $row->id,
                'name' => $row->localizedName($locale),
                'icon' => $row->icon,
            ]);

        return Inertia::render('ExpenseCategories/Index', [
            'categories' => $categories,
            'defaultExpenseCategories' => $defaultExpenseCategories,
            'expenseCategoryIconNames' => ExpenseCategoryIcons::names(),
        ]);
    }

    public function store(StoreExpenseCategoryRequest $request): RedirectResponse
    {
        $request->user()->expenseCategories()->create($request->validated());

        return redirect()
            ->route('expense-categories.index')
            ->with('success', __('frontend.expense_categories.flash.created'));
    }

    public function update(UpdateExpenseCategoryRequest $request, ExpenseCategory $expenseCategory): RedirectResponse
    {
        $expenseCategory->update($request->validated());

        return redirect()
            ->route('expense-categories.index')
            ->with('success', __('frontend.expense_categories.flash.updated'));
    }

    public function destroy(Request $request, ExpenseCategory $expenseCategory): RedirectResponse
    {
        $this->authorize('delete', $expenseCategory);

        if ($expenseCategory->expenses()->exists()) {
            return back()->with('error', __('frontend.expense_categories.flash.delete_blocked_has_expenses'));
        }

        $expenseCategory->delete();

        return redirect()
            ->route('expense-categories.index')
            ->with('success', __('frontend.expense_categories.flash.deleted'));
    }
}
