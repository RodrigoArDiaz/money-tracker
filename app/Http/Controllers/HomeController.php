<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $locale = app()->getLocale();

        $myCategories = $user
            ->expenseCategories()
            ->orderByRaw('LOWER(name)')
            ->orderBy('id')
            ->get()
            ->map(fn (ExpenseCategory $category): array => [
                'id' => $category->id,
                'name' => $category->localizedName($locale),
                'icon' => $category->icon,
            ]);

        $defaultCategories = ExpenseCategory::query()
            ->system()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (ExpenseCategory $row): array => [
                'id' => $row->id,
                'name' => $row->localizedName($locale),
                'icon' => $row->icon,
            ]);

        $expenses = $user
            ->expenses()
            ->whereDate('spent_on', now())
            ->with(['category'])
            ->latest()
            ->get()
            ->map(fn (Expense $expense): array => [
                'id' => $expense->id,
                'expense_category_id' => $expense->expense_category_id,
                'description' => $expense->description,
                'amount' => (string) $expense->amount,
                'category_name' => $expense->category->localizedName($locale),
                'category_icon' => $expense->category->icon,
            ]);

        return Inertia::render('Home', [
            'today' => now()->toDateString(),
            'myCategories' => $myCategories,
            'defaultCategories' => $defaultCategories,
            'expenses' => $expenses,
        ]);
    }
}
