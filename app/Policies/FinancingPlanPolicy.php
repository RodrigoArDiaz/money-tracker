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

    public function archive(User $user, FinancingPlan $financingPlan): bool
    {
        return (int) $financingPlan->user_id === (int) $user->id
            && $financingPlan->archived_at === null;
    }

    public function unarchive(User $user, FinancingPlan $financingPlan): bool
    {
        // Solo titularidad: restaurar es idempotente y evita falsos 403 si `archived_at`
        // no llega al modelo en el chequeo (p. ej. interacción Gate/Spatie o estado).
        return (int) $financingPlan->user_id === (int) $user->id;
    }
}
