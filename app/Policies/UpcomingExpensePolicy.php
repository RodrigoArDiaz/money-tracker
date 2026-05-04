<?php

namespace App\Policies;

use App\Models\UpcomingExpense;
use App\Models\User;

class UpcomingExpensePolicy
{
    public function create(User $user): bool
    {
        return true;
    }

    public function view(User $user, UpcomingExpense $upcomingExpense): bool
    {
        return (int) $upcomingExpense->user_id === (int) $user->id;
    }

    public function update(User $user, UpcomingExpense $upcomingExpense): bool
    {
        return (int) $upcomingExpense->user_id === (int) $user->id;
    }

    public function delete(User $user, UpcomingExpense $upcomingExpense): bool
    {
        return (int) $upcomingExpense->user_id === (int) $user->id
            && $upcomingExpense->financing_plan_id === null;
    }
}
