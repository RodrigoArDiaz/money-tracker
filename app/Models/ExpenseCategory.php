<?php

namespace App\Models;

use Database\Factories\ExpenseCategoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Categoría de gasto: propia del usuario (`user_id` no nulo) o del sistema (`user_id` null, `slug` + `names` JSON).
 *
 * @property array<string, string> $names
 */
#[Fillable(['user_id', 'name', 'names', 'icon', 'slug', 'sort_order'])]
class ExpenseCategory extends Model
{
    /** @use HasFactory<ExpenseCategoryFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::saving(function (ExpenseCategory $category): void {
            if ($category->user_id === null) {
                return;
            }
            if (! is_string($category->name) || $category->name === '') {
                return;
            }
            $category->names = ['es' => $category->name, 'en' => $category->name];
        });
    }

    public function isSystem(): bool
    {
        return $this->user_id === null;
    }

    public function localizedName(?string $locale = null): string
    {
        $locale ??= app()->getLocale();
        $names = $this->names ?? [];

        if (isset($names[$locale]) && is_string($names[$locale]) && $names[$locale] !== '') {
            return $names[$locale];
        }

        $fallback = (string) config('locales.default', 'es');
        if (isset($names[$fallback]) && is_string($names[$fallback]) && $names[$fallback] !== '') {
            return $names[$fallback];
        }

        foreach (['en', 'es'] as $key) {
            if (isset($names[$key]) && is_string($names[$key]) && $names[$key] !== '') {
                return $names[$key];
            }
        }

        $legacy = $this->name;
        if (is_string($legacy) && $legacy !== '') {
            return $legacy;
        }

        $first = reset($names);

        return is_string($first) ? $first : '';
    }

    /**
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeSystem(Builder $query): Builder
    {
        return $query->whereNull('user_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'names' => 'array',
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
     * @return HasMany<Expense, $this>
     */
    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }
}
