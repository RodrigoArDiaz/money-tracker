import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import * as React from 'react';

import AppDashboardLayout from '@/components/layouts/AppDashboardLayout';
import { CategorySpendingDonutChart } from '@/components/molecules/CategorySpendingDonutChart';
import { HomeMonthPicker } from '@/components/molecules/HomeMonthPicker';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import { capitalizeFirstLetter, formatAmountDisplay } from '@/lib/expense-format';
import { ExpenseCategoryIcon } from '@/lib/expense-category-icons';
import { DEFAULT_EXPENSE_CATEGORY_ICON } from '@/lib/expense-card-surface';
import { cn } from '@/lib/utils';

type CategoryTotalRow = {
    id: number;
    name: string;
    icon: string | null;
    total: string;
};

export default function Index({
    period,
    viewYear,
    viewMonth,
    categoryTotals,
}: {
    period: 'month' | 'year';
    viewYear: number;
    viewMonth: number;
    categoryTotals: CategoryTotalRow[];
}): React.ReactElement {
    const { t, locale } = useTranslate();
    const dfLocale = locale === 'es' ? es : enUS;

    const monthPeriodLabel = React.useMemo(
        () => capitalizeFirstLetter(format(new Date(viewYear, viewMonth - 1, 1), 'LLLL yyyy', { locale: dfLocale })),
        [dfLocale, viewMonth, viewYear],
    );

    const chartAria = React.useMemo(
        () =>
            period === 'year'
                ? t('charts.donut_aria_year', { year: String(viewYear) })
                : t('charts.donut_aria_month', { period: monthPeriodLabel }),
        [monthPeriodLabel, period, t, viewYear],
    );

    const yearOptions = React.useMemo(() => {
        const maxY = new Date().getFullYear();
        const out: number[] = [];
        for (let y = maxY; y >= 2000; y--) {
            out.push(y);
        }

        return out;
    }, []);

    const periodTotalLabel = period === 'year' ? String(viewYear) : monthPeriodLabel;

    const categoryListPeriodTotal = React.useMemo(
        () => categoryTotals.reduce((acc, r) => acc + Number.parseFloat(r.total), 0),
        [categoryTotals],
    );
    const categoryListTotalFormatted = formatAmountDisplay(categoryListPeriodTotal.toFixed(2), locale);

    function goToPeriod(next: 'month' | 'year'): void {
        if (next === period) {
            return;
        }
        router.get(
            '/charts',
            { period: next, year: viewYear, month: viewMonth },
            { preserveScroll: true },
        );
    }

    return (
        <>
            <Head title={t('charts.head_title')} />
            <AppDashboardLayout>
                <div className="flex w-full min-w-0 max-w-6xl flex-col gap-6">
                    <div
                        className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3"
                        role="group"
                        aria-label={t('charts.period_toggle_aria')}
                    >
                        <div
                            className="inline-flex h-9 shrink-0 overflow-hidden rounded-lg border border-border md:h-10"
                            role="presentation"
                        >
                            <Button
                                type="button"
                                size="sm"
                                variant={period === 'month' ? 'default' : 'ghost'}
                                className={cn(
                                    'h-9 min-w-0 rounded-none border-0 shadow-none md:h-10',
                                    'px-3 text-[0.8rem]',
                                    period !== 'month' && 'text-muted-foreground',
                                )}
                                onClick={() => {
                                    goToPeriod('month');
                                }}
                            >
                                {t('charts.period_month')}
                            </Button>
                            <div className="w-px shrink-0 self-stretch bg-border" aria-hidden />
                            <Button
                                type="button"
                                size="sm"
                                variant={period === 'year' ? 'default' : 'ghost'}
                                className={cn(
                                    'h-9 min-w-0 rounded-none border-0 shadow-none md:h-10',
                                    'px-3 text-[0.8rem]',
                                    period !== 'year' && 'text-muted-foreground',
                                )}
                                onClick={() => {
                                    goToPeriod('year');
                                }}
                            >
                                {t('charts.period_year')}
                            </Button>
                        </div>

                        {period === 'month' ? (
                            <HomeMonthPicker
                                viewYear={viewYear}
                                viewMonth={viewMonth}
                                navigatePath="/charts"
                                extraQuery={{ period: 'month' }}
                                monthPickerAriaLabel={t('charts.month_picker_aria')}
                            />
                        ) : (
                            <div className="flex min-w-0 shrink-0 items-center gap-2">
                                <label htmlFor="charts-year-only" className="sr-only">
                                    {t('charts.year_picker_label')}
                                </label>
                                <Select
                                    value={String(viewYear)}
                                    onValueChange={(v) => {
                                        const y = Number.parseInt(v, 10);
                                        router.get(
                                            '/charts',
                                            { period: 'year', year: y, month: viewMonth },
                                            { preserveScroll: true },
                                        );
                                    }}
                                >
                                    <SelectTrigger
                                        id="charts-year-only"
                                        size="md"
                                        className="w-auto min-w-[8rem] max-w-[10rem] [&_svg]:size-4"
                                        aria-label={t('charts.year_picker_aria')}
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent position="popper" align="start">
                                        {yearOptions.map((y) => (
                                            <SelectItem key={y} value={String(y)}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {categoryTotals.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
                            {t('charts.empty', {
                                range:
                                    period === 'year' ? String(viewYear) : monthPeriodLabel,
                            })}
                        </p>
                    ) : (
                        <div className="grid min-w-0 grid-cols-1 items-stretch gap-6 md:grid-cols-2">
                            <div className="flex min-h-0 min-w-0 flex-col justify-center overflow-visible rounded-xl border border-border bg-card p-2 text-card-foreground shadow-sm sm:p-4">
                                <CategorySpendingDonutChart
                                    rows={categoryTotals}
                                    valueLabel={t('charts.donut_total_label')}
                                    chartAriaLabel={chartAria}
                                />
                            </div>

                            <div className="min-h-0 min-w-0 overflow-hidden overflow-y-auto rounded-xl border border-border bg-card text-card-foreground shadow-sm md:max-h-[min(32rem,70vh)]">
                                <div className="sticky top-0 z-[1] flex min-w-0 items-baseline justify-between gap-2 border-b border-border bg-card px-4 py-3">
                                    <h2 className="min-w-0 text-sm font-semibold leading-tight">
                                        {t('charts.category_list_heading')}
                                    </h2>
                                    <span
                                        className="shrink-0 text-sm font-semibold tabular-nums text-foreground"
                                        aria-label={t('charts.category_list_total_aria', {
                                            period: periodTotalLabel,
                                            amount: categoryListTotalFormatted,
                                        })}
                                    >
                                        {categoryListTotalFormatted}
                                    </span>
                                </div>
                                <ul className="divide-y divide-border">
                                    {categoryTotals.map((row) => (
                                        <li
                                            key={row.id}
                                            className="flex items-center justify-between gap-3 px-4 py-3"
                                        >
                                            <span className="flex min-w-0 items-center gap-2">
                                                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                                                    <ExpenseCategoryIcon
                                                        name={row.icon ?? DEFAULT_EXPENSE_CATEGORY_ICON}
                                                        className="size-4"
                                                    />
                                                </span>
                                                <span className="min-w-0 truncate font-medium">{row.name}</span>
                                            </span>
                                            <span className="shrink-0 tabular-nums text-sm font-medium">
                                                {formatAmountDisplay(row.total, locale)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </AppDashboardLayout>
        </>
    );
}
