<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Home\HomePageService;
use Carbon\Carbon;
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

        [$viewYear, $viewMonth] = $this->resolveHomeMonthQuery($request);

        return Inertia::render('Home', $this->homePageService->inertiaPropsForAuthenticatedUser($user, $viewYear, $viewMonth));
    }

    /**
     * @return array{0: int, 1: int}
     */
    private function resolveHomeMonthQuery(Request $request): array
    {
        $year = (int) $request->query('year', now()->year);
        $month = (int) $request->query('month', now()->month);

        if ($month < 1 || $month > 12 || $year < 2000 || $year > 2100) {
            return [(int) now()->year, (int) now()->month];
        }

        $requested = Carbon::create($year, $month, 1)->startOfMonth();
        $current = now()->startOfMonth();

        if ($requested->isAfter($current)) {
            return [(int) $current->year, (int) $current->month];
        }

        return [$year, $month];
    }
}
