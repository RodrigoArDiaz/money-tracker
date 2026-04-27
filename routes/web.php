<?php

use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\ChartController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LocaleController;
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
