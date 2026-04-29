<?php

namespace App\Policies;

use App\Models\Expense;
use App\Models\User;

class ExpensePolicy
{
    public function create(User $user): bool
    {
        return true;
    }

    public function view(User $user, Expense $expense): bool
    {
        return (int) $expense->user_id === (int) $user->id;
    }

    public function update(User $user, Expense $expense): bool
    {
        if ($expense->upcoming_expense_id !== null) {
            return false;
        }

        return (int) $expense->user_id === (int) $user->id;
    }

    public function delete(User $user, Expense $expense): bool
    {
        if ($expense->upcoming_expense_id !== null) {
            return false;
        }

        return (int) $expense->user_id === (int) $user->id;
    }
}
