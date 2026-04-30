import * as React from 'react';

import { ExpenseRowActions } from '@/components/molecules/ExpenseRowActions';
import { PaymentStatusPaidBlockedHint } from '@/components/molecules/PaymentStatusPaidBlockedHint';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslate } from '@/hooks/use-translate';
import { EXPENSE_CARD_CLASS_NAME, DEFAULT_EXPENSE_CATEGORY_ICON } from '@/lib/expense-card-surface';
import { formatAmountDisplay } from '@/lib/expense-format';
import { ExpenseCategoryIcon } from '@/lib/expense-category-icons';
import { INLINE_FORM_SELECT_TRIGGER_CLASS } from '@/lib/inline-form-select-trigger';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

export type UpcomingExpenseRow = {
    id: number;
    recurring_template_id: number | null;
    expense_category_id: number | null;
    category_name: string;
    category_icon: string | null;
    description: string;
    amount: string;
    note: string | null;
    kind: 'fixed' | 'variable';
    payment_status: 'paid' | 'unpaid';
};

export function UpcomingExpenseListItem({
    row,
    canMarkPaid,
    onEdit,
    onDelete,
    onPaymentStatusChange,
    onMakeRecurring,
}: {
    row: UpcomingExpenseRow;
    /** Si es false (mes vista > mes actual), «Pagado» no está disponible mientras siga sin pagar. */
    canMarkPaid: boolean;
    onEdit: (row: UpcomingExpenseRow) => void;
    onDelete: (row: UpcomingExpenseRow) => void;
    onPaymentStatusChange: (row: UpcomingExpenseRow, paymentStatus: UpcomingExpenseRow['payment_status']) => void;
    onMakeRecurring?: (row: UpcomingExpenseRow) => void;
}): React.ReactElement {
    const { t, locale } = useTranslate();

    const paidOptionDisabled = !canMarkPaid && row.payment_status === 'unpaid';
    const kindLabel = row.kind === 'fixed' ? t('upcoming_expenses.kind_fixed') : t('upcoming_expenses.kind_variable');

    const noteParagraph =
        row.note !== null && row.note.trim() !== '' ? (
            <p className="text-sm leading-snug text-muted-foreground">{row.note}</p>
        ) : null;

    const categoryBadge =
        row.category_name !== '' ? (
            <Badge
                variant="outline"
                className={cn('max-w-[min(100%,18rem)] min-w-0 justify-start gap-1.5 truncate pl-2 pr-3')}
                title={`${row.category_name}`}
            >
                <ExpenseCategoryIcon
                    name={row.category_icon ?? DEFAULT_EXPENSE_CATEGORY_ICON}
                    className="size-3.5 shrink-0 opacity-85"
                    aria-hidden
                />
                <span className="truncate">{row.category_name}</span>
            </Badge>
        ) : null;

    const recurringBadge =
        row.recurring_template_id !== null ? (
            <Badge variant="secondary" className="shrink-0">
                {t('upcoming_expenses.recurring.badge_recurring')}
            </Badge>
        ) : null;

    const makeRecurringControl =
        onMakeRecurring !== undefined && row.recurring_template_id === null ? (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 shrink-0"
                        onClick={() => onMakeRecurring(row)}
                        aria-label={t('upcoming_expenses.recurring.make_recurring_aria')}
                    >
                        <RefreshCw className="size-4" aria-hidden />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={4}>
                    {t('upcoming_expenses.recurring.make_recurring_tooltip')}
                </TooltipContent>
            </Tooltip>
        ) : null;

    const paymentStatusSelectTriggerTone =
        row.payment_status === 'paid'
            ? cn(
                  'border-emerald-600/55 bg-emerald-500/[0.14] text-emerald-950',
                  'hover:bg-emerald-500/22 dark:border-emerald-400/40 dark:bg-emerald-950/45 dark:text-emerald-50 dark:hover:bg-emerald-950/55',
                  'focus-visible:border-emerald-600 focus-visible:ring-emerald-500/35 dark:focus-visible:border-emerald-400',
                  '[&_[data-slot=select-value]]:text-inherit [&>svg:last-of-type]:text-emerald-800 dark:[&>svg:last-of-type]:text-emerald-200',
              )
            : cn(
                  'border-red-600/50 bg-red-500/[0.11] text-red-950',
                  'hover:bg-red-500/[0.17] dark:border-red-400/40 dark:bg-red-950/40 dark:text-red-50 dark:hover:bg-red-950/52',
                  'focus-visible:border-red-600 focus-visible:ring-red-500/30 dark:focus-visible:border-red-500',
                  '[&_[data-slot=select-value]]:text-inherit [&>svg:last-of-type]:text-red-800 dark:[&>svg:last-of-type]:text-red-200',
              );

    return (
        <article className={cn(EXPENSE_CARD_CLASS_NAME, 'min-w-0 overflow-x-clip')}>
            <div className="flex flex-col gap-3 sm:hidden">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-left lg:gap-x-3">
                    <span className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                        {formatAmountDisplay(row.amount, locale)}
                    </span>
                    {categoryBadge}
                    <Badge
                        variant="default"
                        className={cn('max-w-[min(100%,18rem)] min-w-0 justify-start truncate')}
                        title={row.description}
                    >
                        {row.description}
                    </Badge>
                    <Badge variant="secondary">{kindLabel}</Badge>
                    {recurringBadge}
                </div>
                {noteParagraph ? <div className="text-sm">{noteParagraph}</div> : null}
                <div className="flex flex-row flex-nowrap items-center gap-x-2 gap-y-0">
                    <div className="flex min-w-0 flex-1 flex-row items-center gap-2">
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
                                    className={cn(INLINE_FORM_SELECT_TRIGGER_CLASS, 'w-full', paymentStatusSelectTriggerTone)}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem
                                        value="paid"
                                        disabled={paidOptionDisabled}
                                        title={paidOptionDisabled ? t('upcoming_expenses.paid_disabled_future_month_title') : undefined}
                                    >
                                        {t('upcoming_expenses.status_paid')}
                                    </SelectItem>
                                    <SelectItem value="unpaid">{t('upcoming_expenses.status_unpaid')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <PaymentStatusPaidBlockedHint visible={paidOptionDisabled} />
                    </div>
                    {makeRecurringControl}
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
                        {categoryBadge}
                        <Badge
                            variant="default"
                            className={cn('max-w-[min(100%,18rem)] min-w-0 justify-start truncate')}
                            title={row.description}
                        >
                            {row.description}
                        </Badge>
                        <Badge variant="secondary">{kindLabel}</Badge>
                        {recurringBadge}
                    </div>
                    {noteParagraph ? <div className="min-w-0 text-start text-sm">{noteParagraph}</div> : null}
                </div>
                <div
                    className={cn(
                        'flex shrink-0 flex-row flex-nowrap items-center gap-x-2 lg:gap-x-3',
                        noteParagraph && 'self-start pt-0.5',
                    )}
                >
                    <div className="flex min-w-0 items-center gap-2">
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
                                    className={cn(INLINE_FORM_SELECT_TRIGGER_CLASS, 'w-full', paymentStatusSelectTriggerTone)}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem
                                        value="paid"
                                        disabled={paidOptionDisabled}
                                        title={
                                            paidOptionDisabled ? t('upcoming_expenses.paid_disabled_future_month_title') : undefined
                                        }
                                    >
                                        {t('upcoming_expenses.status_paid')}
                                    </SelectItem>
                                    <SelectItem value="unpaid">{t('upcoming_expenses.status_unpaid')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <PaymentStatusPaidBlockedHint visible={paidOptionDisabled} />
                    </div>
                    {makeRecurringControl}
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
