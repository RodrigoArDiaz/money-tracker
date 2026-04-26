<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $supported = config('locales.supported', ['es', 'en']);
        $locale = null;

        $user = $request->user();
        if ($user !== null && in_array($user->preferred_locale, $supported, true)) {
            $locale = $user->preferred_locale;
        } else {
            $sessionLocale = $request->session()->get('locale');
            if (is_string($sessionLocale) && in_array($sessionLocale, $supported, true)) {
                $locale = $sessionLocale;
            }
        }

        if ($locale === null) {
            $locale = config('locales.default', config('app.locale'));
        }

        if (! in_array($locale, $supported, true)) {
            $locale = config('app.fallback_locale', 'en');
        }

        App::setLocale($locale);

        return $next($request);
    }
}
