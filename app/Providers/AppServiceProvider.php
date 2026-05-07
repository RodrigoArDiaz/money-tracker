<?php

namespace App\Providers;

use App\Models\Expense;
use App\Models\FinancingPlan;
use App\Models\UpcomingExpense;
use App\Models\UpcomingExpenseRecurringTemplate;
use App\Policies\FinancingPlanPolicy;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Telescope\TelescopeServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if ($this->app->isLocal() && class_exists(TelescopeServiceProvider::class)) {
            $this->app->register(TelescopeServiceProvider::class);
            $this->app->register(\App\Providers\TelescopeServiceProvider::class);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(FinancingPlan::class, FinancingPlanPolicy::class);

        Route::bind('expense', function (string $value): Expense {
            return Expense::query()
                ->whereKey($value)
                ->where('user_id', Auth::id())
                ->firstOrFail();
        });

        Route::bind('upcoming_expense', function (string $value): UpcomingExpense {
            return UpcomingExpense::query()
                ->whereKey($value)
                ->where('user_id', Auth::id())
                ->firstOrFail();
        });

        Route::bind('recurring_template', function (string $value): UpcomingExpenseRecurringTemplate {
            return UpcomingExpenseRecurringTemplate::query()
                ->whereKey($value)
                ->where('user_id', Auth::id())
                ->firstOrFail();
        });

        Route::bind('financing_plan', function (string $value): FinancingPlan {
            return FinancingPlan::query()
                ->whereKey($value)
                ->where('user_id', Auth::id())
                ->firstOrFail();
        });

        Password::defaults(function () {
            $rule = Password::min(12)
                ->mixedCase()
                ->numbers()
                ->symbols();

            if (! app()->environment('testing')) {
                $rule->uncompromised();
            }

            return $rule;
        });
    }
}
