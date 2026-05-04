<?php

namespace App\Http\Requests;

use App\Models\FinancingPlan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreFinancingPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null
            && $this->user()->can('create', FinancingPlan::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $userId = $this->user()?->id;

        $base = [
            'creation_mode' => ['required', 'string', Rule::in(['total_and_count', 'custom_schedule'])],
            'description' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:65535'],
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
        ];

        if ($this->input('creation_mode') === 'total_and_count') {
            return $base + [
                'total_amount' => ['required', 'numeric', 'min:0.01', 'max:999999999999.99'],
                'installment_count' => ['required', 'integer', 'min:1', 'max:600'],
                'start_year' => ['required', 'integer', 'min:2000', 'max:2100'],
                'start_month' => ['required', 'integer', 'min:1', 'max:12'],
            ];
        }

        return $base + [
            'installments' => ['required', 'array', 'min:1', 'max:600'],
            'installments.*.year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'installments.*.month' => ['required', 'integer', 'min:1', 'max:12'],
            'installments.*.amount' => ['required', 'numeric', 'min:0.01', 'max:999999999999.99'],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $mode = $this->input('creation_mode');

            if ($mode === 'total_and_count') {
                $sy = (int) $this->input('start_year');
                $sm = (int) $this->input('start_month');
                $startE = $sy * 12 + $sm;
                $nowE = (int) now()->year * 12 + (int) now()->month;
                if ($startE < $nowE) {
                    $v->errors()->add('start_month', __('frontend.financing_plans.validation.start_not_before_current_month'));
                }

                return;
            }

            if ($mode !== 'custom_schedule') {
                return;
            }

            $installments = $this->input('installments', []);
            if (! is_array($installments)) {
                return;
            }

            $seen = [];
            foreach ($installments as $row) {
                if (! is_array($row)) {
                    continue;
                }

                $y = (int) ($row['year'] ?? 0);
                $m = (int) ($row['month'] ?? 0);
                if ($y < 2000 || $y > 2100 || $m < 1 || $m > 12) {
                    continue;
                }

                $key = $y * 12 + $m;
                if (array_key_exists($key, $seen)) {
                    $v->errors()->add(
                        'installments',
                        __('frontend.financing_plans.validation.duplicate_installment_month'),
                    );

                    return;
                }

                $seen[$key] = true;
            }
        });
    }
}
