<?php

namespace App\Http\Requests;

use App\Models\ExpenseCategory;
use App\Support\ExpenseCategoryIcons;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExpenseCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $category = $this->route('expense_category');

        return $category instanceof ExpenseCategory
            && $this->user() !== null
            && $this->user()->can('update', $category);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var ExpenseCategory $category */
        $category = $this->route('expense_category');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('expense_categories', 'name')
                    ->where('user_id', $this->user()->id)
                    ->ignore($category->id),
            ],
            'icon' => ['required', 'string', 'max:64', Rule::in(ExpenseCategoryIcons::names())],
        ];
    }
}
