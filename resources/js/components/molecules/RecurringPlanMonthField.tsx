import * as React from 'react';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import FieldError from '@/components/atoms/FieldError';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { capitalizeFirstLetter } from '@/lib/expense-format';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

const MONTH_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const PLAN_MONTH_MIN_YEAR = 2000;
const PLAN_MONTH_MAX_YEAR = 2100;

function parseYm(yearStr: string, monthStr: string): { y: number; m: number } | null {
    const y = Number.parseInt(yearStr, 10);
    const m = Number.parseInt(monthStr, 10);
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12 || y < PLAN_MONTH_MIN_YEAR || y > PLAN_MONTH_MAX_YEAR) {
        return null;
    }

    return { y, m };
}

function yearMonthOrder(y: number, m: number): number {
    return y * 12 + m;
}

function isYearMonthBefore(a: { y: number; m: number }, b: { y: number; m: number }): boolean {
    return yearMonthOrder(a.y, a.m) < yearMonthOrder(b.y, b.m);
}

export function RecurringPlanMonthField({
    label,
    yearStr,
    monthStr,
    onYearMonthChange,
    optional = false,
    fallbackDisplayMonth,
    buttonAriaLabel,
    errorYear,
    errorMonth,
    disabled = false,
    inclusiveMinYearMonth,
}: {
    label: React.ReactNode;
    yearStr: string;
    monthStr: string;
    onYearMonthChange: (year: string, month: string) => void;
    optional?: boolean;
    fallbackDisplayMonth?: Date;
    buttonAriaLabel: string;
    errorYear?: string;
    errorMonth?: string;
    disabled?: boolean;
    /** Earliest selectable calendar month (inclusive). */
    inclusiveMinYearMonth?: { y: number; m: number };
}): React.ReactElement {
    const { t, locale } = useTranslate();
    const yearSelectId = React.useId();
    const [open, setOpen] = React.useState(false);
    const [draftYear, setDraftYear] = React.useState(() => {
        const p = parseYm(yearStr, monthStr);
        if (p !== null) {
            return p.y;
        }
        if (fallbackDisplayMonth !== undefined) {
            return fallbackDisplayMonth.getFullYear();
        }

        return new Date().getFullYear();
    });
    const dfLocale = locale === 'es' ? es : enUS;

    const parsed = parseYm(yearStr, monthStr);

    const yearOptions = React.useMemo(() => {
        const out: number[] = [];
        const floorY = inclusiveMinYearMonth?.y ?? PLAN_MONTH_MIN_YEAR;
        for (let y = PLAN_MONTH_MAX_YEAR; y >= floorY; y--) {
            out.push(y);
        }

        return out;
    }, [inclusiveMinYearMonth?.y]);

    React.useEffect(() => {
        if (!open) {
            return;
        }
        const p = parseYm(yearStr, monthStr);
        if (p !== null) {
            if (inclusiveMinYearMonth !== undefined && isYearMonthBefore(p, inclusiveMinYearMonth)) {
                setDraftYear(inclusiveMinYearMonth.y);
            } else {
                setDraftYear(p.y);
            }

            return;
        }
        if (fallbackDisplayMonth !== undefined) {
            const fy = fallbackDisplayMonth.getFullYear();
            if (inclusiveMinYearMonth !== undefined && fy < inclusiveMinYearMonth.y) {
                setDraftYear(inclusiveMinYearMonth.y);
            } else {
                setDraftYear(fy);
            }

            return;
        }
        const nowY = new Date().getFullYear();
        if (inclusiveMinYearMonth !== undefined && nowY < inclusiveMinYearMonth.y) {
            setDraftYear(inclusiveMinYearMonth.y);
        } else {
            setDraftYear(nowY);
        }
    }, [open, yearStr, monthStr, fallbackDisplayMonth, inclusiveMinYearMonth?.y, inclusiveMinYearMonth?.m]);

    const labelText =
        parsed !== null
            ? new Intl.DateTimeFormat(locale === 'es' ? 'es' : 'en', {
                  month: 'long',
                  year: 'numeric',
              }).format(new Date(parsed.y, parsed.m - 1, 1))
            : t('upcoming_expenses.recurring.plan_month_placeholder');

    function pickMonth(y: number, m: number): void {
        if (parsed !== null && y === parsed.y && m === parsed.m) {
            setOpen(false);

            return;
        }
        onYearMonthChange(String(y), String(m));
        setOpen(false);
    }

    function handleClear(): void {
        onYearMonthChange('', '');
        setOpen(false);
    }

    const hasError = Boolean(errorYear || errorMonth);

    return (
        <div className="flex min-w-0 flex-col gap-0.5">
            <span className="mb-0.5 block text-xs font-medium text-muted-foreground">{label}</span>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            'h-9 w-full max-w-[min(100%,18rem)] justify-start gap-2 px-2.5 font-normal md:max-w-[20rem]',
                            parsed === null && optional && 'text-muted-foreground',
                        )}
                        aria-invalid={hasError || undefined}
                        aria-expanded={open}
                        aria-haspopup="dialog"
                        aria-label={buttonAriaLabel}
                    >
                        <CalendarIcon className="size-4 shrink-0 opacity-70" aria-hidden />
                        <span className="min-w-0 truncate text-left text-sm font-semibold">{labelText}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(calc(100vw-2rem),20rem)] p-3" align="start">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor={yearSelectId} className="text-xs font-medium text-muted-foreground">
                                {t('expenses.month_picker_year_label')}
                            </label>
                            <select
                                id={yearSelectId}
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
                                const isActive = parsed !== null && draftYear === parsed.y && m === parsed.m;
                                const monthDisabled =
                                    inclusiveMinYearMonth !== undefined &&
                                    isYearMonthBefore({ y: draftYear, m }, inclusiveMinYearMonth);

                                return (
                                    <Button
                                        key={m}
                                        type="button"
                                        variant={isActive ? 'secondary' : 'outline'}
                                        size="sm"
                                        disabled={monthDisabled}
                                        className="h-9 px-1 text-xs font-normal transition-colors"
                                        onClick={() => {
                                            if (monthDisabled) {
                                                return;
                                            }
                                            pickMonth(draftYear, m);
                                        }}
                                    >
                                        {capitalizeFirstLetter(format(new Date(draftYear, m - 1, 1), 'LLL', { locale: dfLocale }))}
                                    </Button>
                                );
                            })}
                        </div>
                        {optional && parsed !== null ? (
                            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={handleClear}>
                                {t('upcoming_expenses.recurring.plan_month_clear')}
                            </Button>
                        ) : null}
                    </div>
                </PopoverContent>
            </Popover>
            <FieldError message={errorYear} />
            <FieldError message={errorMonth} />
        </div>
    );
}
