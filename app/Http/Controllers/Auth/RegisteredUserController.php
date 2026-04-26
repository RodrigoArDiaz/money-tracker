<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Muestra el formulario de registro.
     */
    public function create(): Response
    {
        return Inertia::render('Register', [
            'canRegisterWithGoogle' => filled(config('services.google.client_id'))
                && filled(config('services.google.client_secret')),
        ]);
    }

    /**
     * Registra un usuario con email y contraseña.
     */
    public function store(RegisterUserRequest $request): RedirectResponse
    {
        $user = User::create($request->validated());

        Auth::login($user);

        return redirect()
            ->route('home')
            ->with('success', 'Tu cuenta fue creada correctamente.');
    }
}
