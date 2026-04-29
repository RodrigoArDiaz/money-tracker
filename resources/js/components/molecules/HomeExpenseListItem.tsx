import * as React from 'react';
import { Info } from 'lucide-react';

import { ExpenseRowActions } from '@/components/molecules/ExpenseRowActions';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslate } from '@/hooks/use-translate';
import { EXPENSE_CARD_CLASS_NAME, DEFAULT_EXPENSE_CATEGORY_ICON } from '@/lib/expense-card-surface';
import { formatAmountDisplay } from '@/lib/expense-format';
import { ExpenseCategoryIcon } from '@/lib/expense-category-icons';

export type HomeExpenseListRow = {
    id: number;
    expense_category_id: number;
    description: string;
    amount: string;
    category_name: string;
    category_icon: string | null;
    /** Presente cuando el gasto viene de un gasto futuro marcado como pagado. */
    from_upcoming?: boolean;
};

export function HomeExpenseListItem({
    row,
    onEdit,
    onDelete,
}: {
    row: HomeExpenseListRow;
    onEdit: (row: HomeExpenseListRow) => void;
    onDelete: (row: HomeExpenseListRow) => void;
}): React.ReactElement {
    const { t, locale } = useTranslate();
    const isFromUpcoming = row.from_upcoming === true;

    const descriptionBlock =
        row.description.trim() !== '' ? (
            <p className="text-sm font-medium leading-snug text-foreground">{row.description}</p>
        ) : (
            <p className="text-sm italic text-muted-foreground">{t('expenses.list_no_description')}</p>
        );

    const actionsSlot = isFromUpcoming ? (
        <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    aria-label={t('expenses.from_upcoming_info_aria')}
                >
                    <Info className="size-4 text-primary/90" aria-hidden />
                </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs font-normal leading-snug" side="top" sideOffset={6}>
                {t('expenses.from_upcoming_tooltip')}
            </TooltipContent>
        </Tooltip>
    ) : (
        <ExpenseRowActions
            onEdit={() => onEdit(row)}
            onDelete={() => onDelete(row)}
            editAriaLabel={t('expenses.card_edit_aria')}
            deleteAriaLabel={t('expenses.card_delete_aria')}
            editTooltip={t('expenses.card_edit_tooltip')}
            deleteTooltip={t('expenses.card_delete_tooltip')}
        />
    );

    return (
        <article className={EXPENSE_CARD_CLASS_NAME}>
            <div className="flex flex-col gap-2 sm:hidden">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <ExpenseCategoryIcon
                            name={row.category_icon ?? DEFAULT_EXPENSE_CATEGORY_ICON}
                            className="size-5 shrink-0 text-primary/90"
                        />
                        <p className="min-w-0 truncate text-sm font-medium leading-snug text-muted-foreground">
                            {row.category_name}
                        </p>
                    </div>
                    <p className="shrink-0 text-lg font-semibold tabular-nums tracking-tight text-foreground">
                        {formatAmountDisplay(row.amount, locale)}
                    </p>
                </div>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 text-left">{descriptionBlock}</div>
                    <div className="shrink-0">{actionsSlot}</div>
                </div>
            </div>

            <div className="hidden items-center gap-1.5 sm:flex sm:gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <ExpenseCategoryIcon
                            name={row.category_icon ?? DEFAULT_EXPENSE_CATEGORY_ICON}
                            className="size-5 shrink-0 text-primary/90"
                        />
                        <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                            {formatAmountDisplay(row.amount, locale)}
                        </p>
                    </div>
                    <p className="max-w-[min(100%,16rem)] text-sm font-medium leading-snug text-muted-foreground sm:max-w-[20rem]">
                        {row.category_name}
                    </p>
                </div>
                <div className="min-w-0 flex-1 basis-0 pl-1 text-right sm:pl-1.5">{descriptionBlock}</div>
                <div className="flex shrink-0 items-center gap-2 pl-1.5 sm:pl-2">
                    <div className="w-px shrink-0 self-stretch bg-border" aria-hidden />
                    {actionsSlot}
                </div>
            </div>
        </article>
    );
}
