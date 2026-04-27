<?php

namespace App\Services\Expense;

use App\Models\Expense;
use App\Models\User;
use App\Repositories\ExpenseRepository;

class ExpenseService
{
    public function __construct(
        private readonly ExpenseRepository $expenseRepository,
    ) {}

    /**
     * @param  array{expense_category_id: int, description?: string|null, amount: float|int|string}  $validated
     */
    public function createForToday(User $user, array $validated): Expense
    {
        return $this->expenseRepository->create([
            'user_id' => $user->id,
            'expense_category_id' => $validated['expense_category_id'],
            'description' => trim((string) ($validated['description'] ?? '')),
            'amount' => $validated['amount'],
            'spent_on' => now()->toDateString(),
        ]);
    }

    /**
     * @param  array{expense_category_id: int, description?: string|null, amount: float|int|string}  $validated
     */
    public function update(Expense $expense, array $validated): void
    {
        $this->expenseRepository->update($expense, [
            'expense_category_id' => $validated['expense_category_id'],
            'description' => trim((string) ($validated['description'] ?? '')),
            'amount' => $validated['amount'],
        ]);
    }

    public function delete(Expense $expense): void
    {
        $this->expenseRepository->delete($expense);
    }
}
