<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Charts\ChartsPageService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChartController extends Controller
{
    public function __construct(
        private readonly ChartsPageService $chartsPageService,
    ) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        assert($user instanceof User);

        $rawPeriod = (string) $request->query('period', 'month');
        $year = (int) $request->query('year', (string) now()->year);
        $month = (int) $request->query('month', (string) now()->month);

        /** @var 'month'|'year' $period */
        /** @var int $viewYear */
        /** @var int $viewMonth */
        [$period, $viewYear, $viewMonth] = $this->chartsPageService->resolveViewFromQuery(
            now(),
            $rawPeriod,
            $year,
            $month,
        );

        return Inertia::render(
            'Charts/Index',
            $this->chartsPageService->inertiaPropsForUser($user, $period, $viewYear, $viewMonth)
        );
    }
}
