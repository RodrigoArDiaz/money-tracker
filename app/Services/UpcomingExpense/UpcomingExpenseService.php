<?php

namespace App\Services\UpcomingExpense;

use App\Enums\UpcomingExpenseKind;
use App\Enums\UpcomingExpensePaymentStatus;
use App\Models\UpcomingExpense;
use App\Models\User;
use App\Repositories\UpcomingExpenseRepository;
use Illuminate\Support\Collection;

class UpcomingExpenseService
{
    public function __construct(
        private readonly UpcomingExpenseRepository $upcomingExpenseRepository,
    ) {}

    /**
     * @param  array{
     *     year: int,
     *     month: int,
     *     description: string,
     *     note?: string|null,
     *     amount: float|int|string,
     *     kind: string,
     * }  $validated
     */
    public function createForMonth(User $user, array $validated): UpcomingExpense
    {
        return $this->upcomingExpenseRepository->create([
            'user_id' => $user->id,
            'year' => $validated['year'],
            'month' => $validated['month'],
            'description' => trim($validated['description']),
            'note' => $this->normalizeNote($validated['note'] ?? null),
            'amount' => $validated['amount'],
            'kind' => UpcomingExpenseKind::from($validated['kind'])->value,
            'payment_status' => UpcomingExpensePaymentStatus::Unpaid->value,
        ]);
    }

    /**
     * @param  array{
     *     description: string,
     *     note?: string|null,
     *     amount: float|int|string,
     *     kind: string,
     *     payment_status: string,
     * }  $validated
     */
    public function update(UpcomingExpense $upcomingExpense, array $validated): void
    {
        $this->upcomingExpenseRepository->update($upcomingExpense, [
            'description' => trim($validated['description']),
            'note' => $this->normalizeNote($validated['note'] ?? null),
            'amount' => $validated['amount'],
            'kind' => UpcomingExpenseKind::from($validated['kind'])->value,
            'payment_status' => UpcomingExpensePaymentStatus::from($validated['payment_status'])->value,
        ]);
    }

    public function delete(UpcomingExpense $upcomingExpense): void
    {
        $this->upcomingExpenseRepository->delete($upcomingExpense);
    }

    /**
     * Datos para la página Inertia de gastos futuros.
     *
     * @return array{
     *     viewYear: int,
     *     viewMonth: int,
     *     expenses: list<array{
     *         id: int,
     *         description: string,
     *         amount: string,
     *         note: string|null,
     *         kind: string,
     *         payment_status: string,
     *     }>,
     *     total_amount: string,
     *     unpaid_total: string,
     * }
     */
    public function pageDataForMonth(User $user, int $year, int $month): array
    {
        /** @var Collection<int, UpcomingExpense> $collection */
        $collection = $this->upcomingExpenseRepository->forUserInMonth($user, $year, $month);

        $totalAmount = 0.0;
        $unpaidTotal = 0.0;

        foreach ($collection as $expense) {
            $amt = (float) $expense->amount;
            $totalAmount += $amt;
            if ($expense->payment_status === UpcomingExpensePaymentStatus::Unpaid) {
                $unpaidTotal += $amt;
            }
        }

        return [
            'viewYear' => $year,
            'viewMonth' => $month,
            'expenses' => $collection
                ->map(static fn (UpcomingExpense $e): array => [
                    'id' => $e->id,
                    'description' => $e->description,
                    'amount' => number_format((float) $e->amount, 2, '.', ''),
                    'note' => $e->note,
                    'kind' => $e->kind->value,
                    'payment_status' => $e->payment_status->value,
                ])
                ->values()
                ->all(),
            'total_amount' => number_format($totalAmount, 2, '.', ''),
            'unpaid_total' => number_format($unpaidTotal, 2, '.', ''),
        ];
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
