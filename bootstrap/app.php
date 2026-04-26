<?php

use App\Http\Middleware\EnsureEmailVerifiedWithCode;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(fn () => route('home'));

        $middleware->redirectUsersTo(function (Request $request) {
            $user = $request->user();
            if ($user !== null && $user->requiresEmailVerificationCode()) {
                return route('verification.code.show');
            }

            return route('dashboard');
        });

        $middleware->web(append: [
            HandleInertiaRequests::class,
            EnsureEmailVerifiedWithCode::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
