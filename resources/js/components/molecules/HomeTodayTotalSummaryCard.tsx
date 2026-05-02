import * as React from 'react';
import { Sigma } from 'lucide-react';

import { useTranslate } from '@/hooks/use-translate';
import { EXPENSE_TOTAL_SUMMARY_CARD_CLASS_NAME } from '@/lib/expense-card-surface';

export function HomeTodayTotalSummaryCard({
    formattedDateHeading,
    todayTotalDisplay,
    headingId,
    totalCaption,
    totalAriaLabel,
}: {
    formattedDateHeading: string;
    todayTotalDisplay: string;
    headingId: string;
    totalCaption?: string;
    totalAriaLabel?: string;
}): React.ReactElement {
    const { t } = useTranslate();

    const caption = totalCaption ?? t('expenses.today_total_caption');
    const totalAria = totalAriaLabel ?? t('expenses.today_total_aria', { amount: todayTotalDisplay });

    return (
        <article className={EXPENSE_TOTAL_SUMMARY_CARD_CLASS_NAME}>
            <h2 id={headingId} className="sr-only">
                {t('expenses.date_heading', { date: formattedDateHeading })}
            </h2>
            <div className="flex flex-col gap-2 sm:hidden">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Sigma className="size-5 shrink-0 text-primary/90" aria-hidden />
                        <p
                            className="min-w-0 truncate text-lg font-semibold tabular-nums tracking-tight text-foreground"
                            aria-label={totalAria}
                        >
                            {todayTotalDisplay}
                        </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium leading-snug text-muted-foreground">{caption}</p>
                </div>
                <div className="flex items-start justify-between gap-3">
                    <p
                        className="min-w-0 flex-1 text-left text-sm font-medium leading-snug text-foreground"
                        aria-hidden
                    >
                        {t('expenses.date_heading', { date: formattedDateHeading })}
                    </p>
                    <span className="inline-flex w-[4.5rem] shrink-0" aria-hidden />
                </div>
            </div>
            <header className="hidden items-center justify-between gap-3 sm:flex">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <Sigma className="size-5 shrink-0 text-primary/90" aria-hidden />
                        <p className="min-w-0 max-w-[min(100%,16rem)] truncate text-left text-sm font-medium leading-snug text-muted-foreground sm:max-w-[20rem]">
                            {caption}
                        </p>
                    </div>
                    <p
                        className="text-left text-lg font-semibold tabular-nums tracking-tight text-foreground"
                        aria-label={totalAria}
                    >
                        {todayTotalDisplay}
                    </p>
                </div>
                <p
                    className="shrink-0 text-right text-sm font-semibold tracking-tight text-foreground sm:text-base"
                    aria-hidden
                >
                    {t('expenses.date_heading', { date: formattedDateHeading })}
                </p>
            </header>
        </article>
    );
}
