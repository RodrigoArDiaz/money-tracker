<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmailVerifiedWithCode
{
    /**
     * Fuerza el flujo por código solo para cuentas registradas manualmente (sin Google).
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || ! $user->requiresEmailVerificationCode()) {
            return $next($request);
        }

        if ($request->routeIs('verification.code.*', 'logout')) {
            return $next($request);
        }

        return redirect()->route('verification.code.show');
    }
}
