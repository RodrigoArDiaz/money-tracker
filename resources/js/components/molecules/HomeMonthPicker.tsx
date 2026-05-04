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

function getCalendarTodayYearMonth(): { year: number; month: number } {
    const d = new Date();

    return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/** Añade meses naturales respecto del primero del mes ( año/mes válidos ). */
function addCalendarMonths(year: number, month: number, deltaMonths: number): { year: number; month: number } {
    const d = new Date(year, month - 1 + deltaMonths, 1);

    return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function HomeMonthPicker({
    viewYear,
    viewMonth,
    navigatePath = '/',
    extraQuery,
    monthPickerAriaLabel,
    allowFutureMonths = false,
    highlightCalendarNextMonth = true,
}: {
    viewYear: number;
    viewMonth: number;
    /** Ruta base para `router.get` (por defecto la home). */
    navigatePath?: string;
    /** Parámetros de query además de `year` y `month` (p. ej. `{ period: 'month' }` en gráficos). */
    extraQuery?: Record<string, string | number | boolean>;
    /** Si se pasa, sustituye la etiqueta accesible del botón (p. ej. gráficos por mes). */
    monthPickerAriaLabel?: string;
    /** Permite elegir meses futuros y años hasta ~10 años adelante (p. ej. gastos planificados). */
    allowFutureMonths?: boolean;
    /** Marca en amarillo el mes calendario siguiente; desactívalo p. ej. en “Tus gastos”. */
    highlightCalendarNextMonth?: boolean;
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
        const nowY = new Date().getFullYear();
        const ceiling = allowFutureMonths ? Math.min(2100, nowY + 10) : nowY;
        const top = Math.min(2100, Math.max(ceiling, viewYear));
        const out: number[] = [];
        for (let y = top; y >= 2000; y--) {
            out.push(y);
        }

        return out;
    }, [allowFutureMonths, viewYear]);

    const { calendarCurrent, calendarNext } = React.useMemo(() => {
        const today = getCalendarTodayYearMonth();
        const next = addCalendarMonths(today.year, today.month, 1);

        return { calendarCurrent: today, calendarNext: next };
    }, [open]);

    React.useEffect(() => {
        if (open) {
            setDraftYear(viewYear);
        }
    }, [open, viewYear]);

    function goToMonth(y: number, m: number): void {
        if (!allowFutureMonths && isMonthInFuture(y, m)) {
            return;
        }
        if (y === viewYear && m === viewMonth) {
            setOpen(false);

            return;
        }
        setOpen(false);
        const query: Record<string, string | number | boolean> = {
            ...(extraQuery ?? {}),
            year: y,
            month: m,
        };
        router.get(navigatePath, query, { preserveScroll: true });
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
                    aria-label={monthPickerAriaLabel ?? t('expenses.month_picker_aria')}
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
                                'month-picker-year-native',
                                'h-9 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-background px-2.5 py-1',
                                'text-sm text-foreground outline-none transition-colors',
                                'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                                'dark:border-input dark:bg-input/30 dark:text-foreground dark:[color-scheme:dark]',
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
                            const disabled = !allowFutureMonths && isMonthInFuture(draftYear, m);
                            const isActive = draftYear === viewYear && m === viewMonth;
                            const isCalendarCurrentMonth =
                                draftYear === calendarCurrent.year && m === calendarCurrent.month;
                            const isCalendarNextMonth =
                                highlightCalendarNextMonth &&
                                draftYear === calendarNext.year &&
                                m === calendarNext.month;

                            return (
                                <Button
                                    key={m}
                                    type="button"
                                    variant={
                                        !disabled &&
                                        !isCalendarCurrentMonth &&
                                        !isCalendarNextMonth &&
                                        isActive
                                            ? 'secondary'
                                            : 'outline'
                                    }
                                    size="sm"
                                    disabled={disabled}
                                    className={cn(
                                        'h-9 px-1 text-xs font-normal transition-colors',
                                        !disabled &&
                                            isCalendarCurrentMonth &&
                                            'border-2 border-emerald-600/65 bg-emerald-500/[0.15] font-medium text-emerald-950 hover:bg-emerald-500/[0.24] hover:text-emerald-950 dark:border-emerald-500/55 dark:bg-emerald-950/45 dark:text-emerald-50 dark:hover:bg-emerald-950/65 dark:hover:text-emerald-50',
                                        !disabled &&
                                            !isCalendarCurrentMonth &&
                                            isCalendarNextMonth &&
                                            'border-2 border-amber-500/70 bg-amber-400/[0.16] font-medium text-amber-950 hover:bg-amber-400/[0.26] hover:text-amber-950 dark:border-amber-400/55 dark:bg-amber-950/40 dark:text-amber-50 dark:hover:bg-amber-950/55 dark:hover:text-amber-50',
                                    )}
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
                    <div
                        role="presentation"
                        className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-2.5 text-xs text-muted-foreground"
                    >
                        <span className="inline-flex items-center gap-2">
                            <span
                                className="inline-block size-3 shrink-0 rounded-[3px] border-2 border-emerald-600/75 bg-emerald-500/20 dark:border-emerald-500/65 dark:bg-emerald-950/50"
                                aria-hidden
                            />
                            {t('expenses.month_picker_legend_current')}
                        </span>
                        {highlightCalendarNextMonth ? (
                            <span className="inline-flex items-center gap-2">
                                <span
                                    className="inline-block size-3 shrink-0 rounded-[3px] border-2 border-amber-500/85 bg-amber-400/[0.28] dark:border-amber-400/65 dark:bg-amber-950/35"
                                    aria-hidden
                                />
                                {t('expenses.month_picker_legend_next')}
                            </span>
                        ) : null}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
