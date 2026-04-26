<?php

namespace App\Http\Requests;

use App\Models\ExpenseCategory;
use App\Support\ExpenseCategoryIcons;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpenseCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->can('create', ExpenseCategory::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('expense_categories', 'name')->where('user_id', $this->user()->id),
            ],
            'icon' => ['required', 'string', 'max:64', Rule::in(ExpenseCategoryIcons::names())],
        ];
    }
}
