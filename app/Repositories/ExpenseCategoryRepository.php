<?php

namespace App\Repositories;

use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Support\Collection;

class ExpenseCategoryRepository
{
    /**
     * Categorías propias del usuario, ordenadas por nombre (insensible a mayúsculas).
     *
     * @return Collection<int, ExpenseCategory>
     */
    public function ownedByUserOrdered(User $user): Collection
    {
        return ExpenseCategory::query()
            ->where('user_id', $user->id)
            ->orderByRaw('LOWER(name)')
            ->orderBy('id')
            ->get();
    }

    /**
     * Categorías del sistema, por `sort_order` e id.
     *
     * @return Collection<int, ExpenseCategory>
     */
    public function systemOrdered(): Collection
    {
        return ExpenseCategory::query()
            ->system()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }
}
