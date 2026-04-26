<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateLocaleRequest;
use Illuminate\Http\RedirectResponse;

class LocaleController extends Controller
{
    /**
     * Actualiza el idioma de la sesión y, si hay usuario autenticado, su preferencia persistida.
     */
    public function __invoke(UpdateLocaleRequest $request): RedirectResponse
    {
        $locale = $request->validated('locale');
        $request->session()->put('locale', $locale);

        $user = $request->user();
        if ($user !== null) {
            $user->preferred_locale = $locale;
            $user->save();
        }

        return back();
    }
}
