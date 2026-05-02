<?php

namespace App\Models;

use App\Enums\UpcomingExpenseKind;
use App\Enums\UpcomingExpenseRecurrenceCadence;
use Database\Factories\UpcomingExpenseRecurringTemplateFactory;
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
    'amount',
    'kind',
    'cadence',
    'start_year',
    'start_month',
    'end_year',
    'end_month',
    'is_active',
])]
class UpcomingExpenseRecurringTemplate extends Model
{
    /** @use HasFactory<UpcomingExpenseRecurringTemplateFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_year' => 'integer',
            'start_month' => 'integer',
            'end_year' => 'integer',
            'end_month' => 'integer',
            'amount' => 'decimal:2',
            'kind' => UpcomingExpenseKind::class,
            'cadence' => UpcomingExpenseRecurrenceCadence::class,
            'is_active' => 'boolean',
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
    public function upcomingExpenses(): HasMany
    {
        return $this->hasMany(UpcomingExpense::class, 'recurring_template_id');
    }
}
