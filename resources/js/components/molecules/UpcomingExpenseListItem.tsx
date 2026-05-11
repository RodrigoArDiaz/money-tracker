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
import { Info, RefreshCw } from 'lucide-react';

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
        ) : null;

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

    const financingPlanInfoControl =
        row.financing_plan_id !== null ? (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 shrink-0"
                        aria-label={t('upcoming_expenses.financing_plan_info_aria')}
                    >
                        <Info className="size-4 text-primary/90" aria-hidden />
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs font-normal leading-snug" side="top" sideOffset={6}>
                    {t('upcoming_expenses.financing_plan_info_tooltip')}
                </TooltipContent>
            </Tooltip>
        ) : null;

    const paymentStatusSelectTriggerTone =
        row.payment_status === 'paid'
            ? cn(
                  'border-theme-green-4/55 bg-theme-green-3/[0.14] text-theme-green-5',
                  'hover:bg-theme-green-3/[0.22] dark:border-theme-green-3/40 dark:bg-theme-green-5/45 dark:text-theme-green-1 dark:hover:bg-theme-green-5/55',
                  'focus-visible:border-theme-green-4 focus-visible:ring-theme-green-3/35 dark:focus-visible:border-theme-green-3',
                  '[&_[data-slot=select-value]]:text-inherit [&>svg:last-of-type]:text-theme-green-5 dark:[&>svg:last-of-type]:text-theme-green-2',
              )
            : cn(
                  'border-theme-red-4/50 bg-theme-red-3/[0.11] text-theme-red-5',
                  'hover:bg-theme-red-3/[0.17] dark:border-theme-red-3/40 dark:bg-theme-red-5/40 dark:text-theme-red-1 dark:hover:bg-theme-red-5/52',
                  'focus-visible:border-theme-red-4 focus-visible:ring-theme-red-3/30 dark:focus-visible:border-theme-red-4',
                  '[&_[data-slot=select-value]]:text-inherit [&>svg:last-of-type]:text-theme-red-5 dark:[&>svg:last-of-type]:text-theme-red-2',
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
            showEdit={row.financing_plan_id === null}
            showDelete={row.financing_plan_id === null}
        />
    );

    const mobileTopActions = (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            {makeRecurringControl}
            {financingPlanInfoControl}
            {expenseActions}
        </div>
    );

    const mobileCategoryColumn = (
        <div className="flex min-w-0 flex-1 gap-1.5">
            <ExpenseCategoryIcon
                name={row.category_icon ?? DEFAULT_EXPENSE_CATEGORY_ICON}
                className="size-5 shrink-0 text-primary/90"
            />
            <div
                className={cn(
                    'flex min-w-0 flex-col',
                    descriptionBlock !== null || noteBlock !== null ? 'gap-1' : 'gap-0',
                )}
            >
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="min-w-0 max-w-full shrink truncate text-sm font-medium leading-snug text-muted-foreground">
                        {categoryDisplayName}
                    </p>
                    {kindBadge}
                    {recurringBadge}
                    {financingPlanBadge}
                </div>
                {(descriptionBlock !== null || noteBlock !== null) ? (
                    <div className="flex min-w-0 flex-col gap-1.5 text-left">
                        {descriptionBlock}
                        {noteBlock}
                    </div>
                ) : null}
            </div>
        </div>
    );

    return (
        <article className={cn(EXPENSE_CARD_CLASS_NAME, 'min-w-0 overflow-x-clip')}>
            <div className="flex flex-col gap-1.5 sm:hidden">
                <div className="flex items-start justify-between gap-2">
                    {mobileCategoryColumn}
                    {mobileTopActions}
                </div>
                <div className="h-px w-full bg-border/50" aria-hidden />
                <div className="flex justify-end">
                    <p className="text-base font-semibold tabular-nums tracking-tight text-foreground sm:text-sm">
                        {formatAmountDisplay(row.amount, locale)}
                    </p>
                </div>
                <div className="flex min-w-0 flex-row flex-nowrap items-center gap-2 pt-0.5">
                    <div className="flex min-w-0 min-h-0 flex-1 items-center gap-1.5">
                        <div className="min-w-0 flex-1">{paymentSelect}</div>
                        <PaymentStatusPaidBlockedHint visible={paidOptionDisabled} />
                    </div>
                </div>
            </div>

            <div className="hidden items-center gap-1.5 sm:flex sm:gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {categoryTitleRow}
                    <p className="text-base font-semibold tabular-nums tracking-tight text-foreground sm:text-sm">
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
                            {financingPlanInfoControl}
                            {expenseActions}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
