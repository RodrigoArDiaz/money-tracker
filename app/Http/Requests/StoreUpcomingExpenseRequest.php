<?php

namespace App\Http\Requests;

use App\Models\UpcomingExpense;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUpcomingExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->can('create', UpcomingExpense::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'description' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:65535'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999999999.99'],
            'kind' => ['required', 'string', Rule::in(['fixed', 'variable'])],
            'redirect_year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'redirect_month' => ['nullable', 'integer', 'min:1', 'max:12'],
        ];
    }
}
