import * as React from 'react';

import { ExpenseRowActions } from '@/components/molecules/ExpenseRowActions';
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

    const noteBlock =
        row.note !== null && row.note.trim() !== '' ? (
            <p className="text-sm leading-snug text-muted-foreground">{row.note}</p>
        ) : (
            <p className="text-sm italic text-muted-foreground">{t('upcoming_expenses.list_no_note')}</p>
        );

    return (
        <article className={EXPENSE_CARD_CLASS_NAME}>
            <div className="flex flex-col gap-3 sm:hidden">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={cn(
                                    'inline-flex rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground',
                                )}
                            >
                                {kindLabel}
                            </span>
                        </div>
                        <p className="text-base font-semibold leading-snug text-foreground">{row.description}</p>
                        {noteBlock}
                    </div>
                    <p className="shrink-0 text-lg font-semibold tabular-nums tracking-tight text-foreground">
                        {formatAmountDisplay(row.amount, locale)}
                    </p>
                </div>
                <div className="flex flex-col gap-2">
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
                            className={INLINE_FORM_SELECT_TRIGGER_CLASS}
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="paid">{t('upcoming_expenses.status_paid')}</SelectItem>
                            <SelectItem value="unpaid">{t('upcoming_expenses.status_unpaid')}</SelectItem>
                        </SelectContent>
                    </Select>
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

            <div className="hidden items-start gap-3 sm:flex">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {kindLabel}
                        </span>
                    </div>
                    <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                        {formatAmountDisplay(row.amount, locale)}
                    </p>
                    <p className="text-sm font-medium leading-snug text-foreground">{row.description}</p>
                    <div className="max-w-none text-left sm:max-w-[24rem]">{noteBlock}</div>
                </div>
                <div className="flex w-full max-w-[min(100%,14rem)] shrink-0 flex-col items-stretch gap-2 sm:items-end">
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
                            className={cn(INLINE_FORM_SELECT_TRIGGER_CLASS, 'min-w-[10rem]')}
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value="paid">{t('upcoming_expenses.status_paid')}</SelectItem>
                            <SelectItem value="unpaid">{t('upcoming_expenses.status_unpaid')}</SelectItem>
                        </SelectContent>
                    </Select>
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
