<?php

namespace App\Policies;

use App\Models\UpcomingExpenseRecurringTemplate;
use App\Models\User;

class UpcomingExpenseRecurringTemplatePolicy
{
    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, UpcomingExpenseRecurringTemplate $template): bool
    {
        return (int) $template->user_id === (int) $user->id;
    }

    public function delete(User $user, UpcomingExpenseRecurringTemplate $template): bool
    {
        return (int) $template->user_id === (int) $user->id;
    }
}
