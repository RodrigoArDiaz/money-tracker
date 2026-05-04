<?php

use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\ChartController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\FinancingPlanController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\UpcomingExpenseController;
use App\Http\Controllers\UpcomingExpenseRecurringTemplateController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function (Request $request) {
    if (! auth()->check()) {
        return Inertia::render('Welcome', [
            'canLoginWithGoogle' => filled(config('services.google.client_id'))
                && filled(config('services.google.client_secret')),
        ]);
    }

    return app(HomeController::class)($request);
})->name('home');

Route::get('/dashboard', fn () => redirect()->route('home'))->middleware('auth')->name('dashboard');

Route::post('/logout', LogoutController::class)->middleware('auth')->name('logout');

Route::post('/locale', LocaleController::class)->middleware('throttle:30,1')->name('locale.update');

Route::middleware('auth')->group(function () {
    Route::get('/email/verify', [EmailVerificationController::class, 'show'])->name('verification.code.show');
    Route::post('/email/verify', [EmailVerificationController::class, 'store'])
        ->middleware('throttle:12,1')
        ->name('verification.code.verify');
    Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])
        ->middleware('throttle:6,1')
        ->name('verification.code.resend');

    Route::redirect('expense-categories/create', '/expense-categories');
    Route::resource('expense-categories', ExpenseCategoryController::class)->except(['show', 'create', 'edit']);
    Route::get('charts', ChartController::class)->name('charts');
    Route::get('upcoming-expenses/recurring', [UpcomingExpenseRecurringTemplateController::class, 'index'])
        ->name('upcoming-expenses.recurring');
    Route::get('financing-plans', [FinancingPlanController::class, 'index'])->name('financing-plans.index');
    Route::post('financing-plans', [FinancingPlanController::class, 'store'])->name('financing-plans.store');
    Route::delete('financing-plans/{financing_plan}', [FinancingPlanController::class, 'destroy'])
        ->name('financing-plans.destroy');
    Route::get('upcoming-expenses', [UpcomingExpenseController::class, 'index'])->name('upcoming-expenses.index');
    Route::post('upcoming-expenses', [UpcomingExpenseController::class, 'store'])->name('upcoming-expenses.store');
    Route::post('upcoming-expenses/{upcoming_expense}/make-recurring', [UpcomingExpenseController::class, 'makeRecurring'])
        ->name('upcoming-expenses.make-recurring');
    Route::put('upcoming-expenses/{upcoming_expense}', [UpcomingExpenseController::class, 'update'])->name('upcoming-expenses.update');
    Route::delete('upcoming-expenses/{upcoming_expense}', [UpcomingExpenseController::class, 'destroy'])->name('upcoming-expenses.destroy');
    Route::post('upcoming-expense-recurring-templates', [UpcomingExpenseRecurringTemplateController::class, 'store'])
        ->name('upcoming-expense-recurring-templates.store');
    Route::put('upcoming-expense-recurring-templates/{recurring_template}', [UpcomingExpenseRecurringTemplateController::class, 'update'])
        ->name('upcoming-expense-recurring-templates.update');
    Route::delete('upcoming-expense-recurring-templates/{recurring_template}', [UpcomingExpenseRecurringTemplateController::class, 'destroy'])
        ->name('upcoming-expense-recurring-templates.destroy');
    Route::post('expenses', [ExpenseController::class, 'store'])->name('expenses.store');
    Route::put('expenses/{expense}', [ExpenseController::class, 'update'])->name('expenses.update');
    Route::delete('expenses/{expense}', [ExpenseController::class, 'destroy'])->name('expenses.destroy');
});

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:6,1');
    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store'])
        ->middleware('throttle:10,1');
    Route::get('/auth/google', [GoogleAuthController::class, 'redirect'])
        ->name('auth.google');
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])
        ->name('auth.google.callback');
});
