import * as React from 'react';

import { ExpenseRowActions } from '@/components/molecules/ExpenseRowActions';
import { Badge } from '@/components/ui/badge';
import { useTranslate } from '@/hooks/use-translate';
import { EXPENSE_CARD_CLASS_NAME, DEFAULT_EXPENSE_CATEGORY_ICON } from '@/lib/expense-card-surface';
import { formatAmountDisplay } from '@/lib/expense-format';
import { ExpenseCategoryIcon } from '@/lib/expense-category-icons';
import { cn } from '@/lib/utils';

export type RecurringTemplateListRow = {
    id: number;
    expense_category_id: number;
    description: string;
    note: string | null;
    category_name: string;
    category_icon: string | null;
    amount: string;
    kind: 'fixed' | 'variable';
    cadence: string;
    is_active: boolean;
    start_year: number;
    start_month: number;
    end_year: number | null;
    end_month: number | null;
};

export function RecurringTemplateListItem({
    row,
    planPeriodLabel,
    onEdit,
    onDelete,
}: {
    row: RecurringTemplateListRow;
    planPeriodLabel: string;
    onEdit: (row: RecurringTemplateListRow) => void;
    onDelete: (row: RecurringTemplateListRow) => void;
}): React.ReactElement {
    const { t, locale } = useTranslate();

    const categoryDisplayName =
        row.category_name.trim() !== '' ? row.category_name : t('upcoming_expenses.list_no_category');

    const kindLabel = row.kind === 'fixed' ? t('upcoming_expenses.kind_fixed') : t('upcoming_expenses.kind_variable');

    const descriptionBlock =
        row.description.trim() !== '' ? (
            <p className="min-w-0 whitespace-pre-wrap break-words text-sm font-medium leading-snug text-foreground" title={row.description}>
                {row.description}
            </p>
        ) : (
            <p className="text-sm italic leading-snug text-muted-foreground">{t('expenses.list_no_description')}</p>
        );

    const noteBlock =
        row.note !== null && row.note.trim() !== '' ? (
            <p className="min-w-0 whitespace-pre-wrap break-words text-sm leading-snug text-muted-foreground">{row.note}</p>
        ) : null;

    const descriptionNoteRight = (
        <div className="flex min-w-0 flex-col gap-1.5 text-right">
            {descriptionBlock}
            {noteBlock}
        </div>
    );

    const kindBadge = (
        <Badge variant="secondary" className="max-w-[min(100%,12rem)] shrink-0 truncate font-normal" title={kindLabel}>
            {kindLabel}
        </Badge>
    );

    const statusBadge = (
        <Badge variant="secondary" className="shrink-0 font-normal">
            {row.is_active ? t('upcoming_expenses.recurring.active') : t('upcoming_expenses.recurring.paused')}
        </Badge>
    );

    const cadenceBadge = (
        <Badge variant="secondary" className="shrink-0 font-normal">
            {t('upcoming_expenses.recurring.cadence_monthly')}
        </Badge>
    );

    const planPeriodBadge = (
        <Badge
            variant="secondary"
            className="max-w-[min(100%,18rem)] min-w-0 shrink truncate font-normal sm:max-w-[min(100%,22rem)]"
            title={planPeriodLabel}
        >
            {planPeriodLabel}
        </Badge>
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
                {kindBadge}
                {statusBadge}
                {cadenceBadge}
                {planPeriodBadge}
            </div>
        </div>
    );

    const expenseActions = (
        <ExpenseRowActions
            onEdit={() => onEdit(row)}
            onDelete={() => onDelete(row)}
            editAriaLabel={t('upcoming_expenses.recurring.list_edit_aria')}
            deleteAriaLabel={t('upcoming_expenses.recurring.list_delete_aria')}
            editTooltip={t('upcoming_expenses.recurring.list_edit_tooltip')}
            deleteTooltip={t('upcoming_expenses.recurring.list_delete_tooltip')}
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
                    <div className="flex min-w-0 flex-col gap-1.5 text-left">
                        {descriptionBlock}
                        {noteBlock}
                    </div>
                </div>
                <div className="flex justify-end">{expenseActions}</div>
            </div>

            <div className="hidden items-start gap-1.5 sm:flex sm:gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {categoryTitleRow}
                    <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                        {formatAmountDisplay(row.amount, locale)}
                    </p>
                </div>
                <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col gap-2 self-start pl-1 pt-0.5 sm:pl-1.5">
                    {descriptionNoteRight}
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 self-stretch sm:flex-row sm:items-center sm:gap-2 sm:self-auto sm:pl-2">
                    <div className="w-px shrink-0 self-stretch bg-border" aria-hidden />
                    <div className="flex shrink-0 items-center gap-2 sm:justify-end">{expenseActions}</div>
                </div>
            </div>
        </article>
    );
}
