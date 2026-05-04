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
    financing_plan_id: number | null;
    plan_installment_number: number | null;
    plan_installment_total: number | null;
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

    const categoryDisplayName =
        row.category_name.trim() !== '' ? row.category_name : t('upcoming_expenses.list_no_category');

    const descriptionBlock =
        row.description.trim() !== '' ? (
            <p className="min-w-0 whitespace-pre-wrap break-words text-sm font-medium leading-snug text-foreground" title={row.description}>
                {row.description}
            </p>
        ) : (
            <p className="text-sm italic leading-snug text-muted-foreground">{t('expenses.list_no_description')}</p>
        );

    const kindBadge = (
        <Badge variant="secondary" className="max-w-[min(100%,12rem)] shrink-0 truncate font-normal" title={kindLabel}>
            {kindLabel}
        </Badge>
    );

    const recurringBadge =
        row.recurring_template_id !== null ? (
            <Badge variant="secondary" className="shrink-0 font-normal">
                {t('upcoming_expenses.recurring.badge_recurring')}
            </Badge>
        ) : null;

    const financingPlanBadge =
        row.financing_plan_id !== null &&
        row.plan_installment_number !== null &&
        row.plan_installment_total !== null &&
        row.plan_installment_total > 0 ? (
            <Badge variant="outline" className="shrink-0 font-normal">
                {t('financing_plans.installment_badge', {
                    current: row.plan_installment_number,
                    total: row.plan_installment_total,
                })}
            </Badge>
        ) : null;

    const noteBlock =
        row.note !== null && row.note.trim() !== '' ? (
            <p className="min-w-0 whitespace-pre-wrap break-words text-sm leading-snug text-muted-foreground">{row.note}</p>
        ) : null;

    const descriptionAndNoteRight = (
        <div className="flex min-w-0 flex-col gap-1.5 text-right">
            {descriptionBlock}
            {noteBlock}
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
                {kindBadge}
                {recurringBadge}
                {financingPlanBadge}
            </div>
        </div>
    );

    const makeRecurringControl =
        onMakeRecurring !== undefined &&
        row.recurring_template_id === null &&
        row.financing_plan_id === null ? (
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

    const paymentSelect = (
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
                className={cn(
                    INLINE_FORM_SELECT_TRIGGER_CLASS,
                    'w-full min-w-0 sm:min-w-[10.75rem]',
                    paymentStatusSelectTriggerTone,
                )}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
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
    );

    const expenseActions = (
        <ExpenseRowActions
            onEdit={() => onEdit(row)}
            onDelete={() => onDelete(row)}
            editAriaLabel={t('upcoming_expenses.card_edit_aria')}
            deleteAriaLabel={t('upcoming_expenses.card_delete_aria')}
            editTooltip={t('upcoming_expenses.card_edit_tooltip')}
            deleteTooltip={t('upcoming_expenses.card_delete_tooltip')}
            showDelete={row.financing_plan_id === null}
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
                <div className="flex min-w-0 flex-row flex-nowrap items-center gap-2">
                    <div className="flex min-w-0 min-h-0 flex-1 items-center gap-1.5">
                        <div className="min-w-0 flex-1">{paymentSelect}</div>
                        <PaymentStatusPaidBlockedHint visible={paidOptionDisabled} />
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {makeRecurringControl}
                        {expenseActions}
                    </div>
                </div>
            </div>

            <div className="hidden items-center gap-1.5 sm:flex sm:gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {categoryTitleRow}
                    <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                        {formatAmountDisplay(row.amount, locale)}
                    </p>
                </div>
                <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col gap-2 pl-1 sm:pl-1.5">
                    {descriptionAndNoteRight}
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 self-stretch sm:flex-row sm:items-center sm:gap-2 sm:self-auto sm:pl-2">
                    <div className="w-px shrink-0 self-stretch bg-border" aria-hidden />
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                            <div className="w-[10.75rem] shrink-0 lg:w-[11rem]">{paymentSelect}</div>
                            <PaymentStatusPaidBlockedHint visible={paidOptionDisabled} />
                        </div>
                        <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                            {makeRecurringControl}
                            {expenseActions}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
