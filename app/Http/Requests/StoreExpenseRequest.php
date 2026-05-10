<?php

namespace App\Http\Requests;

use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->can('create', Expense::class);
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->has('spent_on')) {
                return;
            }

            $spentOn = $this->input('spent_on');
            $redirectYear = (int) ($this->input('redirect_year') ?? 0);
            $redirectMonth = (int) ($this->input('redirect_month') ?? 0);

            if ($spentOn === null || $spentOn === '' || $redirectYear < 2000 || $redirectMonth < 1 || $redirectMonth > 12) {
                return;
            }

            try {
                $date = Carbon::createFromFormat('Y-m-d', (string) $spentOn)->startOfDay();
            } catch (\Throwable) {
                return;
            }

            if ($date->year !== $redirectYear || $date->month !== $redirectMonth) {
                $validator->errors()->add(
                    'spent_on',
                    __('frontend.expenses.validation.spent_on_must_match_view_month'),
                );
            }
        });
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
            'spent_on' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999999999.99'],
            'redirect_year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'redirect_month' => ['required', 'integer', 'min:1', 'max:12'],
        ];
    }
}
