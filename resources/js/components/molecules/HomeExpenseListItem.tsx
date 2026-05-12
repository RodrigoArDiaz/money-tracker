import * as React from 'react';
import { Info } from 'lucide-react';

import { ExpenseRowActions } from '@/components/molecules/ExpenseRowActions';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
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
    spentOnDate,
    formattedDayHeading,
    onEdit,
    onDelete,
}: {
    row: HomeExpenseListRow;
    /** ISO `YYYY-MM-DD` del gasto (día de la lista en Home). */
    spentOnDate: string;
    /** Fecha ya formateada según locale (misma que el encabezado del día en Home). */
    formattedDayHeading: string;
    onEdit: (row: HomeExpenseListRow) => void;
    onDelete: (row: HomeExpenseListRow) => void;
}): React.ReactElement {
    const { t, locale } = useTranslate();
    const isFromUpcoming = row.from_upcoming === true;
    const [fromUpcomingInfoOpen, setFromUpcomingInfoOpen] = React.useState(false);
    const [mobileActionsOpen, setMobileActionsOpen] = React.useState(false);

    const categoryDisplayName =
        row.category_name.trim() !== '' ? row.category_name : t('expenses.list_no_category');

    const hasDescription = row.description.trim() !== '';

    const descriptionBlock = hasDescription ? (
        <p className="min-w-0 whitespace-pre-wrap break-words text-sm font-medium leading-snug text-foreground" title={row.description}>
            {row.description}
        </p>
    ) : null;

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

    const expenseRowActionsProps = {
        onEdit: () => onEdit(row),
        onDelete: () => onDelete(row),
        editAriaLabel: t('expenses.card_edit_aria'),
        deleteAriaLabel: t('expenses.card_delete_aria'),
        editTooltip: t('expenses.card_edit_tooltip'),
        deleteTooltip: t('expenses.card_delete_tooltip'),
    };

    const desktopActionsSlot = isFromUpcoming ? (
        <>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 shrink-0"
                        aria-label={t('expenses.from_upcoming_info_aria')}
                        aria-expanded={fromUpcomingInfoOpen}
                        aria-haspopup="dialog"
                        onClick={() => setFromUpcomingInfoOpen(true)}
                    >
                        <Info className="size-4 text-primary/90" aria-hidden />
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs font-normal leading-snug" side="top" sideOffset={6}>
                    {t('expenses.from_upcoming_more_info')}
                </TooltipContent>
            </Tooltip>
        </>
    ) : (
        <ExpenseRowActions {...expenseRowActionsProps} />
    );

    const mobileDrawer = (
        <Drawer repositionInputs={false} open={mobileActionsOpen} onOpenChange={setMobileActionsOpen}>
            <button
                type="button"
                className={cn(
                    'flex w-full min-w-0 flex-col gap-1.5 rounded-md text-left sm:hidden',
                    'border-0 bg-transparent p-0 font-inherit text-inherit shadow-none',
                    'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
                onClick={() => setMobileActionsOpen(true)}
                aria-expanded={mobileActionsOpen}
                aria-haspopup="dialog"
                aria-label={t('expenses.mobile_expense_card_open_actions_aria')}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 gap-1.5">
                        <ExpenseCategoryIcon
                            name={row.category_icon ?? DEFAULT_EXPENSE_CATEGORY_ICON}
                            className="size-5 shrink-0 text-primary/90"
                        />
                        <div className="flex min-w-0 flex-col gap-0">
                            <p className="min-w-0 truncate text-sm font-medium leading-snug text-muted-foreground">
                                {categoryDisplayName}
                            </p>
                        </div>
                    </div>
                    <p className="shrink-0 text-right text-base font-semibold tabular-nums tracking-tight text-foreground">
                        {formatAmountDisplay(row.amount, locale)}
                    </p>
                </div>
                {hasDescription ? <div className="min-w-0 text-left">{descriptionBlock}</div> : null}
            </button>
            <DrawerContent className="pb-[max(1rem,env(safe-area-inset-bottom))]">
                <DrawerHeader className="text-left">
                    <DrawerTitle>{t('expenses.mobile_actions_drawer_title')}</DrawerTitle>
                    <DrawerDescription className="sr-only">{t('expenses.mobile_actions_drawer_description')}</DrawerDescription>
                </DrawerHeader>
                <div className="space-y-4 px-4 pb-4">
                    <div className="space-y-3 border-b border-border/60 pb-4">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">{t('expenses.mobile_actions_drawer_day_label')}</p>
                            <time
                                dateTime={spentOnDate}
                                className="mt-1 block text-sm font-medium leading-snug text-foreground"
                            >
                                {formattedDayHeading}
                            </time>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">{t('expenses.list_category')}</p>
                            <div className="mt-1 flex min-w-0 items-center gap-2">
                                <ExpenseCategoryIcon
                                    name={row.category_icon ?? DEFAULT_EXPENSE_CATEGORY_ICON}
                                    className="size-5 shrink-0 text-primary/90"
                                />
                                <p className="min-w-0 text-sm font-medium leading-snug text-foreground">{categoryDisplayName}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">{t('expenses.list_amount')}</p>
                            <p className="mt-1 text-base font-semibold tabular-nums tracking-tight text-foreground">
                                {formatAmountDisplay(row.amount, locale)}
                            </p>
                        </div>
                        {hasDescription ? (
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">{t('expenses.list_description')}</p>
                                <p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium leading-snug text-foreground">
                                    {row.description}
                                </p>
                            </div>
                        ) : null}
                    </div>
                    <div>
                        {isFromUpcoming ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-auto min-h-11 w-full justify-start gap-3 py-2.5"
                                onClick={() => {
                                    setMobileActionsOpen(false);
                                    setFromUpcomingInfoOpen(true);
                                }}
                                aria-label={t('expenses.from_upcoming_info_aria')}
                            >
                                <Info className="size-4 shrink-0 text-primary/90" aria-hidden />
                                <span className="text-left text-sm font-medium">{t('expenses.from_upcoming_more_info')}</span>
                            </Button>
                        ) : (
                            <ExpenseRowActions
                                {...expenseRowActionsProps}
                                onEdit={() => {
                                    setMobileActionsOpen(false);
                                    onEdit(row);
                                }}
                                onDelete={() => {
                                    setMobileActionsOpen(false);
                                    onDelete(row);
                                }}
                                presentation="drawerList"
                            />
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );

    const fromUpcomingInfoDialog = isFromUpcoming ? (
        <Dialog open={fromUpcomingInfoOpen} onOpenChange={setFromUpcomingInfoOpen}>
            <DialogContent className="max-w-sm" closeAriaLabel={t('expenses.from_upcoming_info_modal_close')}>
                <DialogHeader>
                    <DialogTitle>{t('expenses.from_upcoming_more_info')}</DialogTitle>
                    <DialogDescription className="text-left leading-snug">
                        {t('expenses.from_upcoming_tooltip')}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" onClick={() => setFromUpcomingInfoOpen(false)}>
                        {t('expenses.from_upcoming_info_modal_close')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ) : null;

    return (
        <article className={cn(EXPENSE_CARD_CLASS_NAME, 'min-w-0 overflow-x-clip')}>
            {mobileDrawer}

            <div className="hidden items-center gap-1.5 sm:flex sm:gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {categoryTitleRow}
                </div>
                <div
                    className={cn(
                        'flex min-h-0 min-w-0 flex-1 basis-0 flex-row items-center gap-2 pl-1 sm:pl-1.5',
                        hasDescription ? 'justify-between' : 'justify-end',
                    )}
                >
                    {hasDescription ? (
                        <div className="min-w-0 flex-1 text-left">{descriptionBlock}</div>
                    ) : null}
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-2.5">{desktopActionsSlot}</div>
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 self-stretch sm:flex-row sm:items-center sm:gap-2 sm:self-auto sm:pl-2">
                    <div className="w-px shrink-0 self-stretch bg-border" aria-hidden />
                    <div className="flex shrink-0 items-center justify-end">
                        <p className="text-right text-base font-semibold tabular-nums tracking-tight text-foreground sm:text-sm">
                            {formatAmountDisplay(row.amount, locale)}
                        </p>
                    </div>
                </div>
            </div>

            {fromUpcomingInfoDialog}
        </article>
    );
}
