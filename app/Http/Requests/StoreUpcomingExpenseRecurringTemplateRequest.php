<?php

namespace App\Http\Requests;

use App\Models\UpcomingExpenseRecurringTemplate;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreUpcomingExpenseRecurringTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null
            && $this->user()->can('create', UpcomingExpenseRecurringTemplate::class);
    }

    protected function prepareForValidation(): void
    {
        $ey = $this->input('end_year');
        $em = $this->input('end_month');
        $this->merge([
            'end_year' => ($ey === '' || $ey === null) ? null : $ey,
            'end_month' => ($em === '' || $em === null) ? null : $em,
        ]);
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
            'start_year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'start_month' => ['required', 'integer', 'min:1', 'max:12'],
            'end_year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'end_month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'redirect_year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'redirect_month' => ['nullable', 'integer', 'min:1', 'max:12'],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $ey = $this->input('end_year');
            $em = $this->input('end_month');
            if ($ey !== null && $ey !== '' && ($em === null || $em === '')) {
                $v->errors()->add('end_month', __('frontend.upcoming_expenses.recurring.validation.end_month_required'));
            }
            if ($em !== null && $em !== '' && ($ey === null || $ey === '')) {
                $v->errors()->add('end_year', __('frontend.upcoming_expenses.recurring.validation.end_year_required'));
            }

            $sy = (int) $this->input('start_year');
            $sm = (int) $this->input('start_month');
            $startE = $sy * 12 + $sm;

            $nowY = (int) now()->year;
            $nowM = (int) now()->month;
            $nowE = $nowY * 12 + $nowM;
            if ($startE < $nowE) {
                $v->errors()->add('start_month', __('frontend.upcoming_expenses.recurring.validation.start_not_before_current_month'));
            }

            if ($ey !== null && $ey !== '' && $em !== null && $em !== '') {
                $endE = ((int) $ey) * 12 + (int) $em;
                if ($endE <= $startE) {
                    $v->errors()->add('end_year', __('frontend.upcoming_expenses.recurring.validation.end_must_be_after_start'));
                }
            }
        });
    }
}
