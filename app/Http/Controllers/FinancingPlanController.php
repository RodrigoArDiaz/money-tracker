<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\RedirectsToUpcomingExpensesWithMonth;
use App\Http\Requests\StoreFinancingPlanRequest;
use App\Models\ExpenseCategory;
use App\Models\FinancingPlan;
use App\Models\User;
use App\Repositories\ExpenseCategoryRepository;
use App\Services\FinancingPlan\FinancingPlanService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinancingPlanController extends Controller
{
    use AuthorizesRequests;
    use RedirectsToUpcomingExpensesWithMonth;

    public function __construct(
        private readonly FinancingPlanService $financingPlanService,
        private readonly ExpenseCategoryRepository $expenseCategoryRepository,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        assert($user instanceof User);

        $locale = app()->getLocale();

        [$defaultYear, $defaultMonth] = $this->resolveUpcomingMonthQuery($request);

        $plans = FinancingPlan::query()
            ->where('user_id', $user->id)
            ->with(['category'])
            ->withCount('upcomingInstallments')
            ->orderByDesc('id')
            ->get()
            ->map(function (FinancingPlan $plan) use ($locale): array {
                $category = $plan->category;

                return [
                    'id' => $plan->id,
                    'description' => $plan->description,
                    'note' => $plan->note,
                    'total_amount' => number_format((float) $plan->total_amount, 2, '.', ''),
                    'installments_count' => $plan->upcoming_installments_count,
                    'expense_category_id' => $plan->expense_category_id,
                    'category_name' => $category instanceof ExpenseCategory
                        ? $category->localizedName($locale)
                        : '',
                    'category_icon' => $category?->icon,
                ];
            })
            ->values()
            ->all();

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

        return Inertia::render('FinancingPlans/Index', [
            'defaultYear' => $defaultYear,
            'defaultMonth' => $defaultMonth,
            'myCategories' => $myCategories,
            'defaultCategories' => $defaultCategories,
            'plans' => $plans,
        ]);
    }

    public function store(StoreFinancingPlanRequest $request): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $validated = $request->validated();
        $shared = [
            'description' => $validated['description'],
            'note' => $validated['note'] ?? null,
            'expense_category_id' => $validated['expense_category_id'],
        ];

        if ($validated['creation_mode'] === 'total_and_count') {
            $this->financingPlanService->createFromTotalAndCount($user, $shared + [
                'total_amount' => $validated['total_amount'],
                'installment_count' => $validated['installment_count'],
                'start_year' => $validated['start_year'],
                'start_month' => $validated['start_month'],
            ]);
        } else {
            /** @var list<array{year: int, month: int, amount: float|int|string}> $rows */
            $rows = array_values($validated['installments']);
            $this->financingPlanService->createFromCustomSchedule($user, $rows, $shared);
        }

        return $this->redirectToFinancingPlansWithMonth($request)
            ->with('success', __('frontend.financing_plans.flash.created'));
    }

    public function destroy(Request $request, FinancingPlan $financingPlan): RedirectResponse
    {
        $this->authorize('delete', $financingPlan);

        $this->financingPlanService->deleteOwnedPlan($financingPlan);

        return $this->redirectToFinancingPlansWithMonth($request)
            ->with('success', __('frontend.financing_plans.flash.deleted'));
    }

    /**
     * @return array{0: int, 1: int}
     */
    private function resolveUpcomingMonthQuery(Request $request): array
    {
        $year = (int) $request->query('year', now()->year);
        $month = (int) $request->query('month', now()->month);

        if ($month < 1 || $month > 12 || $year < 2000 || $year > 2100) {
            return [(int) now()->year, (int) now()->month];
        }

        return [$year, $month];
    }
}
