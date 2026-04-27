<?php

namespace App\Http\Requests;

use App\Models\Expense;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->can('create', Expense::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'expense_category_id' => [
                'required',
                'integer',
                Rule::exists('expense_categories', 'id')->where(function ($query) use ($userId): void {
                    $query->where(function ($q) use ($userId): void {
                        $q->whereNull('user_id');
                        if ($userId !== null) {
                            $q->orWhere('user_id', $userId);
                        }
                    });
                }),
            ],
            'description' => ['nullable', 'string', 'max:65535'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999999999.99'],
        ];
    }
}
