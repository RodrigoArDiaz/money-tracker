<?php

namespace App\Services\UpcomingExpense;

use App\Enums\UpcomingExpenseKind;
use App\Enums\UpcomingExpensePaymentStatus;
use App\Enums\UpcomingExpenseRecurrenceCadence;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\UpcomingExpense;
use App\Models\UpcomingExpenseRecurringTemplate;
use App\Models\User;
use App\Repositories\ExpenseCategoryRepository;
use App\Repositories\ExpenseRepository;
use App\Repositories\UpcomingExpenseRecurringMonthSkipRepository;
use App\Repositories\UpcomingExpenseRecurringTemplateRepository;
use App\Repositories\UpcomingExpenseRepository;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class UpcomingExpenseService
{
    public function __construct(
        private readonly UpcomingExpenseRepository $upcomingExpenseRepository,
        private readonly UpcomingExpenseRecurringTemplateRepository $recurringTemplateRepository,
        private readonly UpcomingExpenseRecurringMonthSkipRepository $recurringMonthSkipRepository,
        private readonly ExpenseRepository $expenseRepository,
        private readonly ExpenseCategoryRepository $expenseCategoryRepository,
    ) {}

    /**
     * @param  array{
     *     year: int,
     *     month: int,
     *     description: string,
     *     note?: string|null,
     *     amount: float|int|string,
     *     kind: string,
     *     expense_category_id: int,
     * }  $validated
     */
    public function createForMonth(User $user, array $validated): UpcomingExpense
    {
        return $this->upcomingExpenseRepository->create([
            'user_id' => $user->id,
            'recurring_template_id' => null,
            'year' => $validated['year'],
            'month' => $validated['month'],
            'expense_category_id' => $validated['expense_category_id'],
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
     *     expense_category_id: int,
     *     update_scope?: string,
     * }  $validated
     */
    public function update(UpcomingExpense $upcomingExpense, array $validated): void
    {
        $scope = $validated['update_scope'] ?? 'this_month_only';

        if ($scope === 'this_and_future_unpaid') {
            $this->updateUpcomingExpenseSeriesFromAnchor($upcomingExpense, $validated);

            return;
        }

        DB::transaction(function () use ($upcomingExpense, $validated): void {
            $this->upcomingExpenseRepository->update($upcomingExpense, [
                'description' => trim($validated['description']),
                'note' => $this->normalizeNote($validated['note'] ?? null),
                'amount' => $validated['amount'],
                'kind' => UpcomingExpenseKind::from($validated['kind'])->value,
                'payment_status' => UpcomingExpensePaymentStatus::from($validated['payment_status'])->value,
                'expense_category_id' => $validated['expense_category_id'],
            ]);

            $upcomingExpense->refresh();

            $this->syncLinkedExpenseForUpcomingRow($upcomingExpense);
        });
    }

    public function delete(UpcomingExpense $upcomingExpense): void
    {
        DB::transaction(function () use ($upcomingExpense): void {
            $templateId = $upcomingExpense->recurring_template_id;
            if ($templateId !== null) {
                $this->recurringMonthSkipRepository->record(
                    (int) $upcomingExpense->user_id,
                    (int) $templateId,
                    (int) $upcomingExpense->year,
                    (int) $upcomingExpense->month,
                );
            }

            $this->upcomingExpenseRepository->delete($upcomingExpense);
        });
    }

    public function makeRecurringFromUpcoming(UpcomingExpense $upcomingExpense): void
    {
        if ($upcomingExpense->recurring_template_id !== null) {
            return;
        }

        DB::transaction(function () use ($upcomingExpense): void {
            $nowY = (int) now()->year;
            $nowM = (int) now()->month;
            $nowE = $nowY * 12 + $nowM;
            $expE = (int) $upcomingExpense->year * 12 + (int) $upcomingExpense->month;
            $startYear = (int) $upcomingExpense->year;
            $startMonth = (int) $upcomingExpense->month;
            if ($expE < $nowE) {
                $startYear = $nowY;
                $startMonth = $nowM;
            }

            $template = $this->recurringTemplateRepository->create([
                'user_id' => $upcomingExpense->user_id,
                'expense_category_id' => (int) $upcomingExpense->expense_category_id,
                'description' => $upcomingExpense->description,
                'note' => $upcomingExpense->note,
                'amount' => $upcomingExpense->amount,
                'kind' => $upcomingExpense->kind->value,
                'cadence' => UpcomingExpenseRecurrenceCadence::Monthly->value,
                'start_year' => $startYear,
                'start_month' => $startMonth,
                'end_year' => null,
                'end_month' => null,
                'is_active' => true,
            ]);

            $this->upcomingExpenseRepository->update($upcomingExpense, [
                'recurring_template_id' => $template->id,
            ]);
        });
    }

    /**
     * @param  array{
     *     description: string,
     *     note?: string|null,
     *     amount: float|int|string,
     *     kind: string,
     *     expense_category_id: int,
     *     start_year: int,
     *     start_month: int,
     *     end_year?: int|null,
     *     end_month?: int|null,
     * }  $validated
     */
    public function createRecurringTemplate(User $user, array $validated): void
    {
        DB::transaction(function () use ($user, $validated): void {
            $template = $this->recurringTemplateRepository->create([
                'user_id' => $user->id,
                'expense_category_id' => $validated['expense_category_id'],
                'description' => trim($validated['description']),
                'note' => $this->normalizeNote($validated['note'] ?? null),
                'amount' => $validated['amount'],
                'kind' => UpcomingExpenseKind::from($validated['kind'])->value,
                'cadence' => UpcomingExpenseRecurrenceCadence::Monthly->value,
                'start_year' => $validated['start_year'],
                'start_month' => $validated['start_month'],
                'end_year' => $validated['end_year'] ?? null,
                'end_month' => $validated['end_month'] ?? null,
                'is_active' => true,
            ]);

            $this->materializeRecurringTemplateIfMissing(
                $template,
                $validated['start_year'],
                $validated['start_month'],
            );
        });
    }

    /**
     * @param  array{
     *     description: string,
     *     note?: string|null,
     *     amount: float|int|string,
     *     kind: string,
     *     expense_category_id: int,
     *     is_active: bool,
     *     end_year?: int|null,
     *     end_month?: int|null,
     * }  $validated
     */
    public function updateOwnedRecurringTemplate(UpcomingExpenseRecurringTemplate $template, array $validated): void
    {
        DB::transaction(function () use ($template, $validated): void {
            $this->recurringTemplateRepository->update($template, [
                'description' => trim($validated['description']),
                'note' => $this->normalizeNote($validated['note'] ?? null),
                'amount' => $validated['amount'],
                'kind' => UpcomingExpenseKind::from($validated['kind'])->value,
                'expense_category_id' => $validated['expense_category_id'],
                'is_active' => $validated['is_active'],
                'end_year' => $validated['end_year'] ?? null,
                'end_month' => $validated['end_month'] ?? null,
            ]);

            $template->refresh();

            $shared = [
                'expense_category_id' => $template->expense_category_id,
                'description' => $template->description,
                'note' => $template->note,
                'amount' => $template->amount,
                'kind' => $template->kind->value,
            ];

            /** @var Collection<int, UpcomingExpense> $unpaid */
            $unpaid = UpcomingExpense::query()
                ->where('recurring_template_id', $template->id)
                ->where('payment_status', UpcomingExpensePaymentStatus::Unpaid)
                ->get();

            foreach ($unpaid as $row) {
                $this->upcomingExpenseRepository->update($row, $shared);
                $row->refresh();
                $this->syncLinkedExpenseForUpcomingRow($row);
            }
        });
    }

    public function deleteOwnedRecurringTemplate(UpcomingExpenseRecurringTemplate $template): void
    {
        $this->recurringTemplateRepository->delete($template);
    }

    public function pageDataForMonth(User $user, int $year, int $month): array
    {
        DB::transaction(function () use ($user, $year, $month): void {
            $this->ensureRecurringInstancesForMonth($user, $year, $month);
        });

        $locale = app()->getLocale();

        $plannedYm = $year * 12 + $month;
        $currentYm = (int) now()->year * 12 + (int) now()->month;

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

        $myCategories = $this->expenseCategoryRepository
            ->ownedByUserOrdered($user)
            ->map(fn (ExpenseCategory $category): array => [
                'id' => $category->id,
                'name' => $category->localizedName($locale),
                'icon' => $category->icon,
            ])
            ->all();

        $defaultCategories = $this->expenseCategoryRepository
            ->systemOrdered()
            ->map(fn (ExpenseCategory $row): array => [
                'id' => $row->id,
                'name' => $row->localizedName($locale),
                'icon' => $row->icon,
            ])
            ->all();

        return [
            'viewYear' => $year,
            'viewMonth' => $month,
            'myCategories' => $myCategories,
            'defaultCategories' => $defaultCategories,
            'expenses' => $collection
                ->map(function (UpcomingExpense $e) use ($locale): array {
                    $category = $e->category;

                    return [
                        'id' => $e->id,
                        'recurring_template_id' => $e->recurring_template_id,
                        'expense_category_id' => $e->expense_category_id,
                        'category_name' => $category instanceof ExpenseCategory
                            ? $category->localizedName($locale)
                            : '',
                        'category_icon' => $category?->icon,
                        'description' => $e->description,
                        'amount' => number_format((float) $e->amount, 2, '.', ''),
                        'note' => $e->note,
                        'kind' => $e->kind->value,
                        'payment_status' => $e->payment_status->value,
                    ];
                })
                ->values()
                ->all(),
            'total_amount' => number_format($totalAmount, 2, '.', ''),
            'unpaid_total' => number_format($unpaidTotal, 2, '.', ''),
            'can_mark_planned_expenses_paid' => $plannedYm <= $currentYm,
        ];
    }

    /**
     * Datos Inertia para la página de plantillas recurrentes (sin materializar un mes de plan).
     *
     * @return array{
     *     defaultYear: int,
     *     defaultMonth: int,
     *     myCategories: list<array{id: int, name: string, icon: string|null}>,
     *     defaultCategories: list<array{id: int, name: string, icon: string|null}>,
     *     recurringTemplates: list<array{
     *         id: int,
     *         expense_category_id: int,
     *         description: string,
     *         note: string|null,
     *         category_name: string,
     *         category_icon: string|null,
     *         amount: string,
     *         kind: string,
     *         cadence: string,
     *         is_active: bool,
     *         start_year: int,
     *         start_month: int,
     *         end_year: int|null,
     *         end_month: int|null,
     *     }>,
     * }
     */
    public function recurringTemplatesPageData(User $user, int $defaultYear, int $defaultMonth): array
    {
        $locale = app()->getLocale();

        $myCategories = $this->expenseCategoryRepository
            ->ownedByUserOrdered($user)
            ->map(fn (ExpenseCategory $category): array => [
                'id' => $category->id,
                'name' => $category->localizedName($locale),
                'icon' => $category->icon,
            ])
            ->all();

        $defaultCategories = $this->expenseCategoryRepository
            ->systemOrdered()
            ->map(fn (ExpenseCategory $row): array => [
                'id' => $row->id,
                'name' => $row->localizedName($locale),
                'icon' => $row->icon,
            ])
            ->all();

        $recurringTemplates = $this->recurringTemplateRepository
            ->orderedForUser($user)
            ->map(function (UpcomingExpenseRecurringTemplate $t) use ($locale): array {
                $category = $t->category;

                return [
                    'id' => $t->id,
                    'expense_category_id' => $t->expense_category_id,
                    'description' => $t->description,
                    'note' => $t->note,
                    'category_name' => $category instanceof ExpenseCategory
                        ? $category->localizedName($locale)
                        : '',
                    'category_icon' => $category?->icon,
                    'amount' => number_format((float) $t->amount, 2, '.', ''),
                    'kind' => $t->kind->value,
                    'cadence' => $t->cadence->value,
                    'is_active' => $t->is_active,
                    'start_year' => $t->start_year,
                    'start_month' => $t->start_month,
                    'end_year' => $t->end_year,
                    'end_month' => $t->end_month,
                ];
            })
            ->values()
            ->all();

        return [
            'defaultYear' => $defaultYear,
            'defaultMonth' => $defaultMonth,
            'myCategories' => $myCategories,
            'defaultCategories' => $defaultCategories,
            'recurringTemplates' => $recurringTemplates,
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

    private function ensureRecurringInstancesForMonth(User $user, int $year, int $month): void
    {
        $templates = $this->recurringTemplateRepository->activeMonthlyCoveringMonth($user, $year, $month);

        foreach ($templates as $template) {
            $this->materializeRecurringTemplateIfMissing($template, $year, $month);
        }
    }

    private function materializeRecurringTemplateIfMissing(
        UpcomingExpenseRecurringTemplate $template,
        int $year,
        int $month,
    ): void {
        $templateId = (int) $template->id;

        if ($this->recurringMonthSkipRepository->existsForTemplateMonth($templateId, $year, $month)) {
            return;
        }

        if ($this->upcomingExpenseRepository->existsForRecurringTemplateInMonth($templateId, $year, $month)) {
            return;
        }

        $this->upcomingExpenseRepository->create([
            'user_id' => $template->user_id,
            'recurring_template_id' => $template->id,
            'year' => $year,
            'month' => $month,
            'expense_category_id' => $template->expense_category_id,
            'description' => $template->description,
            'note' => $template->note,
            'amount' => $template->amount,
            'kind' => $template->kind->value,
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
     *     expense_category_id: int,
     * }  $validated
     */
    private function updateUpcomingExpenseSeriesFromAnchor(UpcomingExpense $anchor, array $validated): void
    {
        $templateId = $anchor->recurring_template_id;
        if ($templateId === null) {
            return;
        }

        DB::transaction(function () use ($anchor, $validated, $templateId): void {
            $template = UpcomingExpenseRecurringTemplate::query()
                ->whereKey($templateId)
                ->where('user_id', $anchor->user_id)
                ->firstOrFail();

            $this->recurringTemplateRepository->update($template, [
                'description' => trim($validated['description']),
                'note' => $this->normalizeNote($validated['note'] ?? null),
                'amount' => $validated['amount'],
                'kind' => UpcomingExpenseKind::from($validated['kind'])->value,
                'expense_category_id' => $validated['expense_category_id'],
            ]);

            $template->refresh();

            $shared = [
                'expense_category_id' => $validated['expense_category_id'],
                'description' => trim($validated['description']),
                'note' => $this->normalizeNote($validated['note'] ?? null),
                'amount' => $validated['amount'],
                'kind' => UpcomingExpenseKind::from($validated['kind'])->value,
            ];

            $rows = $this->upcomingExpenseRepository->forRecurringTemplateFromMonthForSeriesUpdate(
                (int) $templateId,
                (int) $anchor->year,
                (int) $anchor->month,
                (int) $anchor->id,
            );

            foreach ($rows as $row) {
                $payload = $shared;
                if ((int) $row->id === (int) $anchor->id) {
                    $payload['payment_status'] = UpcomingExpensePaymentStatus::from($validated['payment_status'])->value;
                }

                $this->upcomingExpenseRepository->update($row, $payload);
                $row->refresh();
                $this->syncLinkedExpenseForUpcomingRow($row);
            }
        });
    }

    /**
     * Crea o actualiza el gasto diario cuando el estado es «pagado»; lo elimina si pasa a «sin pagar».
     */
    private function syncLinkedExpenseForUpcomingRow(UpcomingExpense $upcoming): void
    {
        if ($upcoming->payment_status !== UpcomingExpensePaymentStatus::Paid) {
            $this->expenseRepository->deleteByUpcomingExpenseId($upcoming->id);

            return;
        }

        if ($upcoming->expense_category_id === null) {
            return;
        }

        $linked = Expense::query()
            ->where('upcoming_expense_id', $upcoming->id)
            ->first();

        if ($linked !== null) {
            $this->expenseRepository->update($linked, [
                'expense_category_id' => $upcoming->expense_category_id,
                'description' => $upcoming->description,
                'amount' => $upcoming->amount,
            ]);

            return;
        }

        $this->expenseRepository->create([
            'user_id' => $upcoming->user_id,
            'expense_category_id' => $upcoming->expense_category_id,
            'description' => $upcoming->description,
            'amount' => $upcoming->amount,
            'spent_on' => $this->resolveSpentOnDateForLinkedExpense($upcoming),
            'upcoming_expense_id' => $upcoming->id,
        ]);
    }

    /**
     * Mes del plan anterior al mes actual: último día calendario de ese mes.
     * Mes del plan igual al mes actual: día en que se marca pagado.
     * Mes futuro no debería llegar aquí si la validación está alineada.
     */
    private function resolveSpentOnDateForLinkedExpense(UpcomingExpense $upcoming): string
    {
        $plannedYm = ((int) $upcoming->year) * 12 + (int) $upcoming->month;
        $currentYm = (int) now()->year * 12 + (int) now()->month;

        if ($plannedYm < $currentYm) {
            return Carbon::create((int) $upcoming->year, (int) $upcoming->month, 1)->endOfMonth()->toDateString();
        }

        return now()->toDateString();
    }
}
