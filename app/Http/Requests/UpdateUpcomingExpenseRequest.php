<?php

namespace App\Http\Requests;

use App\Models\UpcomingExpense;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUpcomingExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        $expense = $this->route('upcoming_expense');

        return $expense instanceof UpcomingExpense
            && $this->user() !== null
            && $this->user()->can('update', $expense);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'description' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:65535'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999999999.99'],
            'kind' => ['required', 'string', Rule::in(['fixed', 'variable'])],
            'payment_status' => ['required', 'string', Rule::in(['paid', 'unpaid'])],
            'redirect_year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'redirect_month' => ['nullable', 'integer', 'min:1', 'max:12'],
        ];
    }
}
