<?php

namespace App\Models;

use App\Enums\UpcomingExpenseKind;
use App\Enums\UpcomingExpensePaymentStatus;
use Database\Factories\UpcomingExpenseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'year',
    'month',
    'description',
    'note',
    'amount',
    'kind',
    'payment_status',
])]
class UpcomingExpense extends Model
{
    /** @use HasFactory<UpcomingExpenseFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'month' => 'integer',
            'amount' => 'decimal:2',
            'kind' => UpcomingExpenseKind::class,
            'payment_status' => UpcomingExpensePaymentStatus::class,
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
