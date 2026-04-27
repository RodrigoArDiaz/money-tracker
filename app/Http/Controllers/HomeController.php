<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Home\HomePageService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(
        private readonly HomePageService $homePageService,
    ) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        assert($user instanceof User);

        return Inertia::render('Home', $this->homePageService->inertiaPropsForAuthenticatedUser($user));
    }
}
