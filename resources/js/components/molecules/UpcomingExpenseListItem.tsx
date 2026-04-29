import * as React from 'react';

import { ExpenseRowActions } from '@/components/molecules/ExpenseRowActions';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import { EXPENSE_CARD_CLASS_NAME } from '@/lib/expense-card-surface';
import { formatAmountDisplay } from '@/lib/expense-format';
import { INLINE_FORM_SELECT_TRIGGER_CLASS } from '@/lib/inline-form-select-trigger';
import { cn } from '@/lib/utils';

export type UpcomingExpenseRow = {
    id: number;
    description: string;
    amount: string;
    note: string | null;
    kind: 'fixed' | 'variable';
    payment_status: 'paid' | 'unpaid';
};

export function UpcomingExpenseListItem({
    row,
    onEdit,
    onDelete,
    onPaymentStatusChange,
}: {
    row: UpcomingExpenseRow;
    onEdit: (row: UpcomingExpenseRow) => void;
    onDelete: (row: UpcomingExpenseRow) => void;
    onPaymentStatusChange: (row: UpcomingExpenseRow, paymentStatus: UpcomingExpenseRow['payment_status']) => void;
}): React.ReactElement {
    const { t, locale } = useTranslate();

    const kindLabel = row.kind === 'fixed' ? t('upcoming_expenses.kind_fixed') : t('upcoming_expenses.kind_variable');

    const noteParagraph =
        row.note !== null && row.note.trim() !== '' ? (
            <p className="text-sm leading-snug text-muted-foreground">{row.note}</p>
        ) : null;

    return (
        <article className={cn(EXPENSE_CARD_CLASS_NAME, 'min-w-0 overflow-x-clip')}>
            <div className="flex flex-col gap-3 sm:hidden">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-left lg:gap-x-3">
                    <span className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                        {formatAmountDisplay(row.amount, locale)}
                    </span>
                    <Badge
                        variant="default"
                        className={cn('max-w-[min(100%,18rem)] min-w-0 justify-start truncate')}
                        title={row.description}
                    >
                        {row.description}
                    </Badge>
                    <Badge variant="secondary">{kindLabel}</Badge>
                </div>
                {noteParagraph && <div className="text-sm">{noteParagraph}</div>}
                <div className="flex flex-row flex-nowrap items-center gap-x-2 gap-y-0">
                    <div className="min-w-0 flex-1">
                        <Select
                            value={row.payment_status}
                            onValueChange={(value) => {
                                if (value === 'paid' || value === 'unpaid') {
                                    onPaymentStatusChange(row, value);
                                }
                            }}
                        >
                            <SelectTrigger
                                size="md"
                                aria-label={t('upcoming_expenses.payment_select_aria')}
                                className={cn(INLINE_FORM_SELECT_TRIGGER_CLASS, 'w-full')}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="paid">{t('upcoming_expenses.status_paid')}</SelectItem>
                                <SelectItem value="unpaid">{t('upcoming_expenses.status_unpaid')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="shrink-0">
                        <ExpenseRowActions
                            onEdit={() => onEdit(row)}
                            onDelete={() => onDelete(row)}
                            editAriaLabel={t('upcoming_expenses.card_edit_aria')}
                            deleteAriaLabel={t('upcoming_expenses.card_delete_aria')}
                            editTooltip={t('upcoming_expenses.card_edit_tooltip')}
                            deleteTooltip={t('upcoming_expenses.card_delete_tooltip')}
                        />
                    </div>
                </div>
            </div>

            <div
                className={cn(
                    'hidden min-h-0 min-w-0 sm:flex sm:w-full sm:flex-row sm:justify-between sm:gap-x-4 sm:gap-y-3 lg:gap-x-6',
                    noteParagraph ? 'sm:items-start' : 'sm:items-center',
                )}
            >
                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 pr-4 lg:pr-6">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-left lg:gap-x-3">
                        <span className="text-lg font-semibold tabular-nums tracking-tight text-foreground lg:text-xl">
                            {formatAmountDisplay(row.amount, locale)}
                        </span>
                        <Badge
                            variant="default"
                            className={cn('max-w-[min(100%,18rem)] min-w-0 justify-start truncate')}
                            title={row.description}
                        >
                            {row.description}
                        </Badge>
                        <Badge variant="secondary">{kindLabel}</Badge>
                    </div>
                    {noteParagraph && <div className="min-w-0 text-start text-sm">{noteParagraph}</div>}
                </div>
                <div
                    className={cn(
                        'flex shrink-0 flex-row flex-nowrap items-center gap-x-2 lg:gap-x-3',
                        noteParagraph && 'self-start pt-0.5',
                    )}
                >
                    <div className="w-[10.75rem] shrink-0 lg:w-[11rem]">
                        <Select
                            value={row.payment_status}
                            onValueChange={(value) => {
                                if (value === 'paid' || value === 'unpaid') {
                                    onPaymentStatusChange(row, value);
                                }
                            }}
                        >
                            <SelectTrigger
                                size="md"
                                aria-label={t('upcoming_expenses.payment_select_aria')}
                                className={cn(INLINE_FORM_SELECT_TRIGGER_CLASS, 'w-full')}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="paid">{t('upcoming_expenses.status_paid')}</SelectItem>
                                <SelectItem value="unpaid">{t('upcoming_expenses.status_unpaid')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <ExpenseRowActions
                        onEdit={() => onEdit(row)}
                        onDelete={() => onDelete(row)}
                        editAriaLabel={t('upcoming_expenses.card_edit_aria')}
                        deleteAriaLabel={t('upcoming_expenses.card_delete_aria')}
                        editTooltip={t('upcoming_expenses.card_edit_tooltip')}
                        deleteTooltip={t('upcoming_expenses.card_delete_tooltip')}
                    />
                </div>
            </div>
        </article>
    );
}
