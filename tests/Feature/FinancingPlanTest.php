<?php

namespace Tests\Feature;

use App\Enums\UpcomingExpenseKind;
use App\Models\ExpenseCategory;
use App\Models\FinancingPlan;
use App\Models\UpcomingExpense;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class FinancingPlanTest extends TestCase
{
    use LazilyRefreshDatabase;

    #[Test]
    public function guest_is_redirected_from_financing_plans_index(): void
    {
        $this->get(route('financing-plans.index'))
            ->assertRedirect(route('home'));
    }

    #[Test]
    public function authenticated_user_can_create_plan_from_total_and_count(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-05-10 12:00:00', 'UTC'));

        $user = User::factory()->create();
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $response = $this->actingAs($user)->post(route('financing-plans.store'), [
            'creation_mode' => 'total_and_count',
            'description' => 'Notebook',
            'note' => null,
            'expense_category_id' => $category->id,
            'total_amount' => '100.00',
            'installment_count' => 4,
            'start_year' => 2026,
            'start_month' => 5,
            'redirect_year' => 2026,
            'redirect_month' => 5,
        ]);

        $response->assertRedirect(route('financing-plans.index', ['year' => 2026, 'month' => 5]));
        $response->assertSessionHas('success', __('frontend.financing_plans.flash.created'));

        $plan = FinancingPlan::query()->where('user_id', $user->id)->firstOrFail();
        $this->assertSame('100.00', $plan->total_amount);
        $this->assertSame(4, UpcomingExpense::query()->where('financing_plan_id', $plan->id)->count());
        $this->assertDatabaseHas('upcoming_expenses', [
            'financing_plan_id' => $plan->id,
            'kind' => UpcomingExpenseKind::Fixed->value,
        ]);

        $this->travelBack();
    }

    #[Test]
    public function custom_schedule_rejects_duplicate_calendar_months(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-05-10 12:00:00', 'UTC'));

        $user = User::factory()->create();
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $this->actingAs($user)
            ->post(route('financing-plans.store'), [
                'creation_mode' => 'custom_schedule',
                'description' => 'Dup months',
                'expense_category_id' => $category->id,
                'installments' => [
                    ['year' => 2026, 'month' => 8, 'amount' => '10.00'],
                    ['year' => 2026, 'month' => 8, 'amount' => '20.00'],
                ],
                'redirect_year' => 2026,
                'redirect_month' => 5,
            ])
            ->assertSessionHasErrors('installments');

        $this->assertSame(0, FinancingPlan::query()->where('user_id', $user->id)->count());

        $this->travelBack();
    }

    #[Test]
    public function deleting_plan_removes_all_installment_rows(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-05-10 12:00:00', 'UTC'));

        $user = User::factory()->create();
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $this->actingAs($user)->post(route('financing-plans.store'), [
            'creation_mode' => 'total_and_count',
            'description' => 'Chair',
            'expense_category_id' => $category->id,
            'total_amount' => '50.00',
            'installment_count' => 2,
            'start_year' => 2026,
            'start_month' => 6,
            'redirect_year' => 2026,
            'redirect_month' => 6,
        ]);

        $plan = FinancingPlan::query()->where('user_id', $user->id)->firstOrFail();
        $installmentIds = UpcomingExpense::query()->where('financing_plan_id', $plan->id)->pluck('id')->all();
        $this->assertCount(2, $installmentIds);

        $this->actingAs($user)->delete(route('financing-plans.destroy', $plan), [
            'redirect_year' => 2026,
            'redirect_month' => 6,
        ])->assertRedirect(route('financing-plans.index', ['year' => 2026, 'month' => 6]))
            ->assertSessionHas('success', __('frontend.financing_plans.flash.deleted'));

        $this->assertDatabaseMissing('financing_plans', ['id' => $plan->id]);
        foreach ($installmentIds as $id) {
            $this->assertDatabaseMissing('upcoming_expenses', ['id' => $id]);
        }

        $this->travelBack();
    }

    #[Test]
    public function archiving_plan_hides_it_from_active_list_and_shows_under_archived_filter(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-05-10 12:00:00', 'UTC'));

        $user = User::factory()->create();
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $this->actingAs($user)->post(route('financing-plans.store'), [
            'creation_mode' => 'total_and_count',
            'description' => 'Archive me',
            'expense_category_id' => $category->id,
            'total_amount' => '40.00',
            'installment_count' => 2,
            'start_year' => 2026,
            'start_month' => 6,
            'redirect_year' => 2026,
            'redirect_month' => 6,
        ]);

        $plan = FinancingPlan::query()->where('user_id', $user->id)->firstOrFail();
        $this->assertNull($plan->archived_at);

        $this->actingAs($user)
            ->post(route('financing-plans.archive', $plan), [
                'redirect_year' => 2026,
                'redirect_month' => 6,
            ])
            ->assertRedirect(route('financing-plans.index', ['year' => 2026, 'month' => 6]))
            ->assertSessionHas('success', __('frontend.financing_plans.flash.archived'));

        $plan->refresh();
        $this->assertNotNull($plan->archived_at);

        $this->actingAs($user)
            ->get(route('financing-plans.index', ['year' => 2026, 'month' => 6]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('FinancingPlans/Index')
                ->has('plans', 0));

        $this->actingAs($user)
            ->get(route('financing-plans.index', [
                'year' => 2026,
                'month' => 6,
                'filter' => 'archived',
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('FinancingPlans/Index')
                ->where('listFilter', 'archived')
                ->has('plans', 1)
                ->where('plans.0.description', 'Archive me'));

        $this->travelBack();
    }

    #[Test]
    public function user_can_unarchive_plan(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-05-10 12:00:00', 'UTC'));

        $user = User::factory()->create();
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $this->actingAs($user)->post(route('financing-plans.store'), [
            'creation_mode' => 'total_and_count',
            'description' => 'Restore me',
            'expense_category_id' => $category->id,
            'total_amount' => '25.00',
            'installment_count' => 2,
            'start_year' => 2026,
            'start_month' => 6,
            'redirect_year' => 2026,
            'redirect_month' => 6,
        ]);

        $plan = FinancingPlan::query()->where('user_id', $user->id)->firstOrFail();
        $plan->update(['archived_at' => now()]);

        $this->actingAs($user)
            ->post(route('financing-plans.unarchive', $plan), [
                'redirect_year' => 2026,
                'redirect_month' => 6,
                'filter' => 'archived',
            ])
            ->assertRedirect(route('financing-plans.index', [
                'year' => 2026,
                'month' => 6,
                'filter' => 'archived',
            ]))
            ->assertSessionHas('success', __('frontend.financing_plans.flash.restored'));

        $plan->refresh();
        $this->assertNull($plan->archived_at);

        $this->actingAs($user)
            ->get(route('financing-plans.index', ['year' => 2026, 'month' => 6]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('FinancingPlans/Index')
                ->has('plans', 1)
                ->where('plans.0.description', 'Restore me'));

        $this->travelBack();
    }

    #[Test]
    public function user_cannot_delete_single_financing_installment_row(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-05-10 12:00:00', 'UTC'));

        $user = User::factory()->create();
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $this->actingAs($user)->post(route('financing-plans.store'), [
            'creation_mode' => 'total_and_count',
            'description' => 'Desk',
            'expense_category_id' => $category->id,
            'total_amount' => '30.00',
            'installment_count' => 2,
            'start_year' => 2026,
            'start_month' => 5,
            'redirect_year' => 2026,
            'redirect_month' => 5,
        ]);

        $installment = UpcomingExpense::query()->whereNotNull('financing_plan_id')->firstOrFail();

        $this->actingAs($user)->delete(route('upcoming-expenses.destroy', $installment), [
            'redirect_year' => 2026,
            'redirect_month' => 5,
        ])->assertForbidden();

        $this->assertDatabaseHas('upcoming_expenses', ['id' => $installment->id]);

        $this->travelBack();
    }

    #[Test]
    public function user_cannot_make_financing_installment_recurring(): void
    {
        $this->artisan('default-expense-categories:sync');

        $this->travelTo(Carbon::parse('2026-05-10 12:00:00', 'UTC'));

        $user = User::factory()->create();
        $category = ExpenseCategory::query()->system()->firstOrFail();

        $this->actingAs($user)->post(route('financing-plans.store'), [
            'creation_mode' => 'total_and_count',
            'description' => 'Lamp',
            'expense_category_id' => $category->id,
            'total_amount' => '20.00',
            'installment_count' => 2,
            'start_year' => 2026,
            'start_month' => 5,
            'redirect_year' => 2026,
            'redirect_month' => 5,
        ]);

        $installment = UpcomingExpense::query()->whereNotNull('financing_plan_id')->firstOrFail();

        $this->actingAs($user)
            ->post(route('upcoming-expenses.make-recurring', $installment), [
                'redirect_year' => 2026,
                'redirect_month' => 5,
            ])
            ->assertSessionHasErrors('upcoming_expense');

        $this->travelBack();
    }
}
