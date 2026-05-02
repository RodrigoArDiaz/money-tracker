import * as React from 'react';
import { Info } from 'lucide-react';

import { ExpenseRowActions } from '@/components/molecules/ExpenseRowActions';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslate } from '@/hooks/use-translate';
import { EXPENSE_CARD_CLASS_NAME, DEFAULT_EXPENSE_CATEGORY_ICON } from '@/lib/expense-card-surface';
import { formatAmountDisplay } from '@/lib/expense-format';
import { ExpenseCategoryIcon } from '@/lib/expense-category-icons';
import { cn } from '@/lib/utils';

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

    const categoryDisplayName =
        row.category_name.trim() !== '' ? row.category_name : t('expenses.list_no_category');

    const descriptionBlock =
        row.description.trim() !== '' ? (
            <p className="min-w-0 whitespace-pre-wrap break-words text-sm font-medium leading-snug text-foreground" title={row.description}>
                {row.description}
            </p>
        ) : (
            <p className="text-sm italic leading-snug text-muted-foreground">{t('expenses.list_no_description')}</p>
        );

    const descriptionRight = (
        <div className="flex min-w-0 flex-col gap-1.5 text-right">
            {descriptionBlock}
        </div>
    );

    const categoryTitleRow = (
        <div className="flex min-w-0 items-start gap-2 sm:gap-3">
            <ExpenseCategoryIcon
                name={row.category_icon ?? DEFAULT_EXPENSE_CATEGORY_ICON}
                className="size-5 shrink-0 text-primary/90"
            />
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                <p className="min-w-0 max-w-full shrink truncate text-sm font-medium leading-snug text-muted-foreground">
                    {categoryDisplayName}
                </p>
            </div>
        </div>
    );

    const actionsSlot = isFromUpcoming ? (
        <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 shrink-0"
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
        <article className={cn(EXPENSE_CARD_CLASS_NAME, 'min-w-0 overflow-x-clip')}>
            <div className="flex flex-col gap-3 sm:hidden">
                <div className="flex min-w-0 flex-col gap-2">
                    {categoryTitleRow}
                    <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                        {formatAmountDisplay(row.amount, locale)}
                    </p>
                    <div className="flex min-w-0 flex-col gap-1.5 text-left">{descriptionBlock}</div>
                </div>
                <div className="flex items-center justify-end">{actionsSlot}</div>
            </div>

            <div className="hidden items-center gap-1.5 sm:flex sm:gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {categoryTitleRow}
                    <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                        {formatAmountDisplay(row.amount, locale)}
                    </p>
                </div>
                <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col gap-2 pl-1 sm:pl-1.5">
                    {descriptionRight}
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 self-stretch sm:flex-row sm:items-center sm:gap-2 sm:self-auto sm:pl-2">
                    <div className="w-px shrink-0 self-stretch bg-border" aria-hidden />
                    <div className="flex shrink-0 items-center gap-2 sm:justify-end">{actionsSlot}</div>
                </div>
            </div>
        </article>
    );
}
