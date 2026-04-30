<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'upcoming_expense_recurring_template_id',
    'year',
    'month',
])]
class UpcomingExpenseRecurringMonthSkip extends Model
{
    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<UpcomingExpenseRecurringTemplate, $this>
     */
    public function recurringTemplate(): BelongsTo
    {
        return $this->belongsTo(UpcomingExpenseRecurringTemplate::class, 'upcoming_expense_recurring_template_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'month' => 'integer',
        ];
    }
}
