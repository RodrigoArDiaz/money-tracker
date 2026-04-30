<?php

namespace App\Http\Requests;

use App\Enums\UpcomingExpensePaymentStatus;
use App\Models\UpcomingExpense;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
        $userId = $this->user()?->id;

        return [
            'description' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:65535'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999999999.99'],
            'kind' => ['required', 'string', Rule::in(['fixed', 'variable'])],
            'payment_status' => ['required', 'string', Rule::in(['paid', 'unpaid'])],
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
            'redirect_year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'redirect_month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'update_scope' => ['nullable', 'string', Rule::in(['this_month_only', 'this_and_future_unpaid'])],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $upcoming = $this->route('upcoming_expense');

            if (! $upcoming instanceof UpcomingExpense) {
                return;
            }

            $scope = (string) $this->input('update_scope', 'this_month_only');
            if ($scope === 'this_and_future_unpaid' && $upcoming->recurring_template_id === null) {
                $v->errors()->add(
                    'update_scope',
                    __('frontend.upcoming_expenses.recurring.validation.series_requires_template'),
                );
            }

            $targetStatus = UpcomingExpensePaymentStatus::tryFrom((string) $this->input('payment_status'));
            if ($targetStatus !== UpcomingExpensePaymentStatus::Paid) {
                return;
            }

            $plannedYm = ((int) $upcoming->year) * 12 + (int) $upcoming->month;
            $currentYm = (int) now()->year * 12 + (int) now()->month;

            if ($plannedYm > $currentYm) {
                $v->errors()->add(
                    'payment_status',
                    __('frontend.upcoming_expenses.validation.cannot_mark_paid_future_month'),
                );
            }
        });
    }
}
