import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTranslate } from '@/hooks/use-translate';
import { capitalizeFirstLetter } from '@/lib/expense-format';
import { cn } from '@/lib/utils';

const MONTH_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function isMonthInFuture(year: number, month: number): boolean {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    if (year > y) {
        return true;
    }
    if (year === y && month > m) {
        return true;
    }

    return false;
}

export function HomeMonthPicker({
    viewYear,
    viewMonth,
}: {
    viewYear: number;
    viewMonth: number;
}): React.ReactElement {
    const { t, locale } = useTranslate();
    const [open, setOpen] = React.useState(false);
    const [draftYear, setDraftYear] = React.useState(viewYear);
    const dfLocale = locale === 'es' ? es : enUS;

    const displayMonth = React.useMemo(() => new Date(viewYear, viewMonth - 1, 1), [viewYear, viewMonth]);

    const label = React.useMemo(
        () => capitalizeFirstLetter(format(displayMonth, 'LLLL yyyy', { locale: dfLocale })),
        [displayMonth, dfLocale],
    );

    const yearOptions = React.useMemo(() => {
        const maxY = new Date().getFullYear();
        const out: number[] = [];
        for (let y = maxY; y >= 2000; y--) {
            out.push(y);
        }

        return out;
    }, []);

    React.useEffect(() => {
        if (open) {
            setDraftYear(viewYear);
        }
    }, [open, viewYear]);

    function goToMonth(y: number, m: number): void {
        if (isMonthInFuture(y, m)) {
            return;
        }
        if (y === viewYear && m === viewMonth) {
            setOpen(false);

            return;
        }
        setOpen(false);
        router.get('/', { year: y, month: m }, { preserveScroll: true });
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                        'h-9 max-w-[min(100%,18rem)] justify-start gap-2 px-2.5 font-normal md:h-10 md:max-w-[20rem]',
                    )}
                    aria-label={t('expenses.month_picker_aria')}
                    aria-expanded={open}
                    aria-haspopup="dialog"
                >
                    <CalendarIcon className="size-4 shrink-0 opacity-70" aria-hidden />
                    <span className="min-w-0 truncate text-left text-sm font-semibold">{label}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(calc(100vw-2rem),20rem)] p-3" align="start">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="home-month-picker-year" className="text-xs font-medium text-muted-foreground">
                            {t('expenses.month_picker_year_label')}
                        </label>
                        <select
                            id="home-month-picker-year"
                            className={cn(
                                'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none',
                                'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                                'dark:bg-input/30',
                            )}
                            value={draftYear}
                            onChange={(e) => {
                                setDraftYear(Number.parseInt(e.target.value, 10));
                            }}
                        >
                            {yearOptions.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div
                        role="group"
                        aria-label={t('expenses.month_picker_months_region')}
                        className="grid grid-cols-3 gap-1"
                    >
                        {MONTH_INDEXES.map((m) => {
                            const disabled = isMonthInFuture(draftYear, m);
                            const isActive = draftYear === viewYear && m === viewMonth;

                            return (
                                <Button
                                    key={m}
                                    type="button"
                                    variant={isActive ? 'secondary' : 'outline'}
                                    size="sm"
                                    disabled={disabled}
                                    className="h-9 px-1 text-xs font-normal"
                                    onClick={() => {
                                        goToMonth(draftYear, m);
                                    }}
                                >
                                    {capitalizeFirstLetter(
                                        format(new Date(draftYear, m - 1, 1), 'LLL', { locale: dfLocale }),
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
