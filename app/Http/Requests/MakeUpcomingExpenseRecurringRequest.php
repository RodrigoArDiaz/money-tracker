<?php

namespace App\Http\Requests;

use App\Models\UpcomingExpense;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class MakeUpcomingExpenseRecurringRequest extends FormRequest
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
            'redirect_year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'redirect_month' => ['nullable', 'integer', 'min:1', 'max:12'],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $expense = $this->route('upcoming_expense');
            if (! $expense instanceof UpcomingExpense) {
                return;
            }

            if ($expense->recurring_template_id !== null) {
                $v->errors()->add(
                    'upcoming_expense',
                    __('frontend.upcoming_expenses.recurring.validation.already_recurring'),
                );
            }

            if ($expense->financing_plan_id !== null) {
                $v->errors()->add(
                    'upcoming_expense',
                    __('frontend.upcoming_expenses.recurring.validation.cannot_make_recurring_financing_plan'),
                );
            }
        });
    }
}
