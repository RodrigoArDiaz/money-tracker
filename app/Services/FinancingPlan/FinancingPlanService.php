<?php

namespace App\Services\FinancingPlan;

use App\Enums\UpcomingExpenseKind;
use App\Enums\UpcomingExpensePaymentStatus;
use App\Models\FinancingPlan;
use App\Models\UpcomingExpense;
use App\Models\User;
use App\Support\CalendarMonthArithmetic;
use App\Support\InstallmentAmountSplitter;
use Illuminate\Support\Facades\DB;

class FinancingPlanService
{
    /**
     * @param  array{
     *     description: string,
     *     note?: string|null,
     *     expense_category_id: int,
     *     total_amount: float|int|string,
     *     installment_count: int,
     *     start_year: int,
     *     start_month: int,
     * }  $validated
     */
    public function createFromTotalAndCount(User $user, array $validated): FinancingPlan
    {
        return DB::transaction(function () use ($user, $validated): FinancingPlan {
            $count = (int) $validated['installment_count'];
            $amounts = InstallmentAmountSplitter::splitEven((string) $validated['total_amount'], $count);
            $sy = (int) $validated['start_year'];
            $sm = (int) $validated['start_month'];

            $plan = FinancingPlan::query()->create([
                'user_id' => $user->id,
                'expense_category_id' => (int) $validated['expense_category_id'],
                'description' => trim($validated['description']),
                'note' => $this->normalizeNote($validated['note'] ?? null),
                'total_amount' => $validated['total_amount'],
            ]);

            foreach ($amounts as $i => $amountStr) {
                $slot = CalendarMonthArithmetic::addMonths($sy, $sm, $i);
                $this->createInstallmentRow(
                    $user,
                    $plan,
                    $slot['y'],
                    $slot['m'],
                    $i + 1,
                    $amountStr,
                    $validated,
                );
            }

            return $plan;
        });
    }

    /**
     * @param  list<array{year: int, month: int, amount: float|int|string}>  $installments
     * @param  array{
     *     description: string,
     *     note?: string|null,
     *     expense_category_id: int,
     * }  $validated
     */
    public function createFromCustomSchedule(User $user, array $installments, array $validated): FinancingPlan
    {
        return DB::transaction(function () use ($user, $installments, $validated): FinancingPlan {
            $total = 0.0;
            foreach ($installments as $row) {
                $total += (float) $row['amount'];
            }

            $plan = FinancingPlan::query()->create([
                'user_id' => $user->id,
                'expense_category_id' => (int) $validated['expense_category_id'],
                'description' => trim($validated['description']),
                'note' => $this->normalizeNote($validated['note'] ?? null),
                'total_amount' => number_format($total, 2, '.', ''),
            ]);

            foreach ($installments as $i => $row) {
                $this->createInstallmentRow(
                    $user,
                    $plan,
                    (int) $row['year'],
                    (int) $row['month'],
                    $i + 1,
                    number_format((float) $row['amount'], 2, '.', ''),
                    $validated,
                );
            }

            return $plan;
        });
    }

    public function deleteOwnedPlan(FinancingPlan $plan): void
    {
        $plan->delete();
    }

    /**
     * @param  array{description: string, note?: string|null, expense_category_id: int}  $validated
     */
    private function createInstallmentRow(
        User $user,
        FinancingPlan $plan,
        int $year,
        int $month,
        int $installmentNumber,
        string $amountFormatted,
        array $validated,
    ): void {
        UpcomingExpense::query()->create([
            'user_id' => $user->id,
            'recurring_template_id' => null,
            'financing_plan_id' => $plan->id,
            'plan_installment_number' => $installmentNumber,
            'year' => $year,
            'month' => $month,
            'expense_category_id' => (int) $validated['expense_category_id'],
            'description' => trim($validated['description']),
            'note' => $this->normalizeNote($validated['note'] ?? null),
            'amount' => $amountFormatted,
            'kind' => UpcomingExpenseKind::Fixed->value,
            'payment_status' => UpcomingExpensePaymentStatus::Unpaid->value,
        ]);
    }

    private function normalizeNote(mixed $note): ?string
    {
        if ($note === null) {
            return null;
        }

        $trimmed = trim((string) $note);

        return $trimmed === '' ? null : $trimmed;
    }
}
