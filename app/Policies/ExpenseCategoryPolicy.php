<?php

namespace App\Policies;

use App\Models\ExpenseCategory;
use App\Models\User;

class ExpenseCategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, ExpenseCategory $expenseCategory): bool
    {
        return $this->userOwnsCategory($user, $expenseCategory);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, ExpenseCategory $expenseCategory): bool
    {
        return $this->userOwnsCategory($user, $expenseCategory);
    }

    public function delete(User $user, ExpenseCategory $expenseCategory): bool
    {
        return $this->userOwnsCategory($user, $expenseCategory);
    }

    private function userOwnsCategory(User $user, ExpenseCategory $expenseCategory): bool
    {
        return (int) $expenseCategory->user_id === (int) $user->id;
    }
}
