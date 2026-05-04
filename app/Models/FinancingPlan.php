<?php

namespace App\Models;

use Database\Factories\FinancingPlanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'expense_category_id',
    'description',
    'note',
    'total_amount',
])]
class FinancingPlan extends Model
{
    /** @use HasFactory<FinancingPlanFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<ExpenseCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }

    /**
     * @return HasMany<UpcomingExpense, $this>
     */
    public function upcomingInstallments(): HasMany
    {
        return $this->hasMany(UpcomingExpense::class, 'financing_plan_id')
            ->orderBy('plan_installment_number');
    }
}
