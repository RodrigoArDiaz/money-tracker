<?php

namespace App\Policies;

use App\Models\FinancingPlan;
use App\Models\User;

class FinancingPlanPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function view(User $user, FinancingPlan $financingPlan): bool
    {
        return (int) $financingPlan->user_id === (int) $user->id;
    }

    public function delete(User $user, FinancingPlan $financingPlan): bool
    {
        return (int) $financingPlan->user_id === (int) $user->id;
    }
}
