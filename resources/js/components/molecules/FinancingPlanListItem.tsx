import * as React from 'react';
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslate } from '@/hooks/use-translate';
import { DEFAULT_EXPENSE_CATEGORY_ICON, EXPENSE_CARD_CLASS_NAME } from '@/lib/expense-card-surface';
import { ExpenseCategoryIcon } from '@/lib/expense-category-icons';
import { formatAmountDisplay } from '@/lib/expense-format';
import { cn } from '@/lib/utils';

export type FinancingPlanListRow = {
    id: number;
    description: string;
    note: string | null;
    total_amount: string;
    installments_count: number;
    expense_category_id: number;
    category_name: string;
    category_icon: string | null;
};

export type FinancingPlanListFilter = 'active' | 'archived';

export function FinancingPlanListItem({
    plan,
    listFilter,
    onArchive,
    onUnarchive,
    onDeleteRequest,
}: {
    plan: FinancingPlanListRow;
    listFilter: FinancingPlanListFilter;
    onArchive: (plan: FinancingPlanListRow) => void;
    onUnarchive: (plan: FinancingPlanListRow) => void;
    onDeleteRequest: (plan: FinancingPlanListRow) => void;
}): React.ReactElement {
    const { t, locale } = useTranslate();

    const categoryDisplayName =
        plan.category_name.trim() !== '' ? plan.category_name : t('upcoming_expenses.list_no_category');

    const installmentsBadgeLabel =
        plan.installments_count === 1
            ? t('financing_plans.plan_installments_badge_one')
            : t('financing_plans.plan_installments_badge_other', { count: plan.installments_count });

    const installmentsBadge = (
        <Badge variant="secondary" className="shrink-0 font-normal">
            {installmentsBadgeLabel}
        </Badge>
    );

    const archivedBadge =
        listFilter === 'archived' ? (
            <Badge variant="secondary" className="shrink-0 font-normal">
                {t('financing_plans.plan_archived_badge')}
            </Badge>
        ) : null;

    const descriptionBlock =
        plan.description.trim() !== '' ? (
            <p className="min-w-0 whitespace-pre-wrap break-words text-sm font-medium leading-snug text-foreground" title={plan.description}>
                {plan.description}
            </p>
        ) : (
            <p className="text-sm italic leading-snug text-muted-foreground">{t('expenses.list_no_description')}</p>
        );

    const noteBlock =
        plan.note !== null && plan.note.trim() !== '' ? (
            <p className="min-w-0 whitespace-pre-wrap break-words text-sm leading-snug text-muted-foreground">{plan.note}</p>
        ) : null;

    const descriptionNoteRight = (
        <div className="flex min-w-0 flex-col gap-1.5 text-right">
            {descriptionBlock}
            {noteBlock}
        </div>
    );

    const categoryTitleRow = (
        <div className="flex min-w-0 items-start gap-2 sm:gap-3">
            <ExpenseCategoryIcon
                name={plan.category_icon ?? DEFAULT_EXPENSE_CATEGORY_ICON}
                className="size-5 shrink-0 text-primary/90"
            />
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                <p className="min-w-0 max-w-full shrink truncate text-sm font-medium leading-snug text-muted-foreground">
                    {categoryDisplayName}
                </p>
                {installmentsBadge}
                {archivedBadge}
            </div>
        </div>
    );

    const totalAmountEl = (
        <p
            className="text-lg font-semibold tabular-nums tracking-tight text-foreground"
            aria-label={`${t('financing_plans.plan_total_label')}: ${formatAmountDisplay(plan.total_amount, locale)}`}
        >
            {formatAmountDisplay(plan.total_amount, locale)}
        </p>
    );

    const planActions = (
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            {listFilter === 'active' ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={() => onArchive(plan)}
                            aria-label={t('financing_plans.archive_plan_aria')}
                        >
                            <Archive className="size-4" aria-hidden />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={4}>
                        {t('financing_plans.archive_plan_tooltip')}
                    </TooltipContent>
                </Tooltip>
            ) : (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={() => onUnarchive(plan)}
                            aria-label={t('financing_plans.unarchive_plan_aria')}
                        >
                            <ArchiveRestore className="size-4" aria-hidden />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={4}>
                        {t('financing_plans.unarchive_plan_tooltip')}
                    </TooltipContent>
                </Tooltip>
            )}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDeleteRequest(plan)}
                        aria-label={t('financing_plans.delete_plan_aria')}
                    >
                        <Trash2 className="size-4" aria-hidden />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={4}>
                    {t('financing_plans.delete_plan_tooltip')}
                </TooltipContent>
            </Tooltip>
        </div>
    );

    return (
        <article className={cn(EXPENSE_CARD_CLASS_NAME, 'min-w-0 overflow-x-clip')}>
            <div className="flex flex-col gap-3 sm:hidden">
                <div className="flex min-w-0 flex-col gap-2">
                    {categoryTitleRow}
                    {totalAmountEl}
                    <div className="flex min-w-0 flex-col gap-1.5 text-left">
                        {descriptionBlock}
                        {noteBlock}
                    </div>
                </div>
                <div className="flex items-center justify-end">{planActions}</div>
            </div>

            <div className="hidden items-center gap-1.5 sm:flex sm:gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {categoryTitleRow}
                    {totalAmountEl}
                </div>
                <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col gap-2 pl-1 sm:pl-1.5">{descriptionNoteRight}</div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 self-stretch sm:flex-row sm:items-center sm:gap-2 sm:self-auto sm:pl-2">
                    <div className="w-px shrink-0 self-stretch bg-border" aria-hidden />
                    <div className="flex shrink-0 items-center gap-2 sm:justify-end">{planActions}</div>
                </div>
            </div>
        </article>
    );
}
