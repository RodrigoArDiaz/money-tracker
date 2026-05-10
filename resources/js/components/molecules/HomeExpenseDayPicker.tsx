import { endOfMonth, format, isAfter, isSameMonth, isWithinInterval, parse, startOfDay, startOfMonth } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTranslate } from '@/hooks/use-translate';
import { capitalizeFirstLetter } from '@/lib/expense-format';
import { cn } from '@/lib/utils';

function parseIsoDate(value: string): Date {
    return parse(value, 'yyyy-MM-dd', new Date());
}

/**
 * Día por defecto al agregar un gasto: hoy si cae en el mes visto; si no, el último día
 * de ese mes (mes pasado) o el primero (caso límite de mes futuro, no usado en Home).
 */
export function defaultSpentOnForViewedMonth(
    todayYmd: string,
    viewYear: number,
    viewMonth: number,
): string {
    const today = parse(todayYmd, 'yyyy-MM-dd', new Date());
    const monthStart = startOfMonth(new Date(viewYear, viewMonth - 1, 1));
    const monthEnd = endOfMonth(monthStart);
    if (isWithinInterval(today, { start: monthStart, end: monthEnd })) {
        return todayYmd;
    }
    if (monthEnd < today) {
        return format(monthEnd, 'yyyy-MM-dd');
    }

    return format(monthStart, 'yyyy-MM-dd');
}

export function HomeExpenseDayPicker({
    value,
    onChange,
    id,
    viewYear,
    viewMonth,
}: {
    /** Fecha en formato `Y-m-d` (zona horaria local del navegador para el calendario). */
    value: string;
    onChange: (isoDate: string) => void;
    /** Para asociar label accesible (`htmlFor`) desde el padre. */
    id?: string;
    /** Mes cuyos días son elegibles (mismo que el selector de mes de la home). */
    viewYear: number;
    viewMonth: number;
}): React.ReactElement {
    const { t, locale } = useTranslate();
    const [open, setOpen] = React.useState(false);
    const dfLocale = locale === 'es' ? es : enUS;

    const monthAnchor = React.useMemo(
        () => new Date(viewYear, viewMonth - 1, 1),
        [viewYear, viewMonth],
    );

    const selected = React.useMemo(() => {
        if (value === '') {
            return undefined;
        }
        const d = parseIsoDate(value);
        if (Number.isNaN(d.getTime())) {
            return undefined;
        }

        return d;
    }, [value]);

    const label = React.useMemo(() => {
        if (selected === undefined) {
            return '';
        }
        const formatted = format(selected, 'EEEE d MMMM yyyy', { locale: dfLocale });

        return capitalizeFirstLetter(formatted);
    }, [selected, dfLocale]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    id={id}
                    variant="outline"
                    className={cn('h-9 w-full justify-start gap-2 px-2.5 font-normal')}
                    aria-expanded={open}
                    aria-haspopup="dialog"
                    title={t('expenses.spent_on_open_calendar_aria')}
                >
                    <CalendarIcon className="size-4 shrink-0 opacity-70" aria-hidden />
                    <span className="min-w-0 truncate text-left text-sm">{label}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
                <Calendar
                    mode="single"
                    locale={dfLocale}
                    captionLayout="label"
                    startMonth={monthAnchor}
                    endMonth={monthAnchor}
                    defaultMonth={selected && isSameMonth(selected, monthAnchor) ? selected : monthAnchor}
                    selected={selected}
                    onSelect={(d) => {
                        if (d !== undefined) {
                            onChange(format(d, 'yyyy-MM-dd'));
                            setOpen(false);
                        }
                    }}
                    disabled={(date) =>
                        !isSameMonth(date, monthAnchor) ||
                        isAfter(startOfDay(date), startOfDay(new Date()))
                    }
                />
            </PopoverContent>
        </Popover>
    );
}
