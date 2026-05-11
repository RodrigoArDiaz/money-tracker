import { Head, router, useForm } from '@inertiajs/react';
import * as React from 'react';
import { NumericFormat } from 'react-number-format';

import FieldError from '@/components/atoms/FieldError';
import TextInput from '@/components/atoms/TextInput';
import AppDashboardLayout from '@/components/layouts/AppDashboardLayout';
import { ExpenseCategorySelectDialog } from '@/components/molecules/ExpenseCategorySelectDialog';
import {
    defaultSpentOnForViewedMonth,
    HomeExpenseDayPicker,
} from '@/components/molecules/HomeExpenseDayPicker';
import { HomeExpenseListItem, type HomeExpenseListRow } from '@/components/molecules/HomeExpenseListItem';
import { HomeMonthPicker } from '@/components/molecules/HomeMonthPicker';
import { HomeTodayTotalSummaryCard } from '@/components/molecules/HomeTodayTotalSummaryCard';
import { MobileFab, mobileFabPlusIconClassName } from '@/components/molecules/MobileFab';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslate } from '@/hooks/use-translate';
import { DEFAULT_EXPENSE_CATEGORY_ICON } from '@/lib/expense-card-surface';
import { capitalizeFirstLetter, formatAmountDisplay } from '@/lib/expense-format';
import { ExpenseCategoryIcon } from '@/lib/expense-category-icons';
import { cn } from '@/lib/utils';
import { ChevronDown, Plus, Sigma, Tags } from 'lucide-react';

type CategoryOption = {
    id: number;
    name: string;
    icon: string | null;
};

const LAST_EXPENSE_CATEGORY_STORAGE_KEY = 'money-tracker-last-expense-category-id';

function compactLabelClass(): string {
    return 'mb-0.5 block text-xs font-medium text-muted-foreground';
}

function formatDayHeading(dateStr: string, locale: string): string {
    const d = new Date(`${dateStr}T12:00:00`);
    const label = new Intl.DateTimeFormat(locale === 'es' ? 'es' : 'en', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(d);

    return capitalizeFirstLetter(label);
}

function sumExpenseRowsAmount(rows: HomeExpenseListRow[]): number {
    return rows.reduce((sum, row) => {
        const n = Number.parseFloat(row.amount);

        return sum + (Number.isNaN(n) ? 0 : n);
    }, 0);
}

export default function Home({
    today,
    viewYear,
    viewMonth,
    myCategories,
    defaultCategories,
    expensesByDay,
}: {
    today: string;
    viewYear: number;
    viewMonth: number;
    myCategories: CategoryOption[];
    defaultCategories: CategoryOption[];
    expensesByDay: { date: string; expenses: HomeExpenseListRow[] }[];
}) {
    const { t, locale } = useTranslate();

    const monthTotalNumeric = React.useMemo(
        () => expensesByDay.reduce((acc, day) => acc + sumExpenseRowsAmount(day.expenses), 0),
        [expensesByDay],
    );

    const monthTotalDisplay = React.useMemo(
        () => formatAmountDisplay(monthTotalNumeric.toFixed(2), locale),
        [monthTotalNumeric, locale],
    );

    const amountThousandSeparator = locale === 'es' ? '.' : ',';
    const amountDecimalSeparator = locale === 'es' ? ',' : '.';

    const form = useForm({
        expense_category_id: '',
        spent_on: defaultSpentOnForViewedMonth(today, viewYear, viewMonth),
        description: '',
        amount: '',
        redirect_year: String(viewYear),
        redirect_month: String(viewMonth),
    });

    const editForm = useForm({
        expense_category_id: '',
        description: '',
        amount: '',
        redirect_year: String(viewYear),
        redirect_month: String(viewMonth),
    });

    React.useEffect(() => {
        editForm.setData('redirect_year', String(viewYear));
        editForm.setData('redirect_month', String(viewMonth));
    }, [viewYear, viewMonth]);

    const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
    const [categoryPickerOpen, setCategoryPickerOpen] = React.useState(false);
    const [editCategoryPickerOpen, setEditCategoryPickerOpen] = React.useState(false);
    const [editDialogOpen, setEditDialogOpen] = React.useState(false);
    const [editingExpense, setEditingExpense] = React.useState<HomeExpenseListRow | null>(null);
    const [deletingExpense, setDeletingExpense] = React.useState<HomeExpenseListRow | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (!createDialogOpen) {
            return;
        }
        form.setData('spent_on', defaultSpentOnForViewedMonth(today, viewYear, viewMonth));
    }, [viewYear, viewMonth, createDialogOpen]);

    const amountRef = React.useRef<HTMLInputElement | null>(null);
    const descriptionRef = React.useRef<HTMLInputElement | null>(null);
    const editAmountRef = React.useRef<HTMLInputElement | null>(null);

    const allCategoryOptions = React.useMemo(
        () => [...myCategories, ...defaultCategories],
        [myCategories, defaultCategories],
    );

    const selectedCategory = React.useMemo(() => {
        const raw = form.data.expense_category_id;
        if (raw === '') {
            return null;
        }
        const id = Number(raw);
        return allCategoryOptions.find((c) => c.id === id) ?? null;
    }, [form.data.expense_category_id, allCategoryOptions]);

    const editSelectedCategory = React.useMemo(() => {
        const raw = editForm.data.expense_category_id;
        if (raw === '') {
            return null;
        }
        const id = Number(raw);
        return allCategoryOptions.find((c) => c.id === id) ?? null;
    }, [editForm.data.expense_category_id, allCategoryOptions]);

    function focusDescription(): void {
        queueMicrotask(() => descriptionRef.current?.focus());
    }

    function openCreateDialog(): void {
        form.clearErrors();
        form.setData('spent_on', defaultSpentOnForViewedMonth(today, viewYear, viewMonth));
        setCategoryPickerOpen(false);
        setCreateDialogOpen(true);
    }

    React.useEffect(() => {
        if (!createDialogOpen) {
            return undefined;
        }
        const id = window.requestAnimationFrame(() => {
            amountRef.current?.focus();
        });

        return () => window.cancelAnimationFrame(id);
    }, [createDialogOpen]);

    function closeCreateDialog(): void {
        setCreateDialogOpen(false);
        setCategoryPickerOpen(false);
        form.clearErrors();
        form.setData('spent_on', defaultSpentOnForViewedMonth(today, viewYear, viewMonth));
        form.setData('description', '');
        form.setData('amount', '');
    }

    function focusEditAmount(): void {
        queueMicrotask(() => editAmountRef.current?.focus());
    }

    React.useEffect(() => {
        const raw = localStorage.getItem(LAST_EXPENSE_CATEGORY_STORAGE_KEY);
        if (raw === null || raw === '') {
            return;
        }
        const id = Number.parseInt(raw, 10);
        if (!Number.isFinite(id)) {
            localStorage.removeItem(LAST_EXPENSE_CATEGORY_STORAGE_KEY);

            return;
        }
        const exists = allCategoryOptions.some((c) => c.id === id);
        if (!exists) {
            localStorage.removeItem(LAST_EXPENSE_CATEGORY_STORAGE_KEY);

            return;
        }
        form.setData('expense_category_id', String(id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function submitExpense(e: React.FormEvent): void {
        e.preventDefault();
        form.transform((data) => {
            const parts = data.spent_on.split('-');
            const year = parts[0] ?? String(viewYear);
            const monthNum = Number.parseInt(parts[1] ?? String(viewMonth), 10);

            return {
                ...data,
                redirect_year: year,
                redirect_month: String(Number.isFinite(monthNum) ? monthNum : viewMonth),
            };
        });
        form.post('/expenses', {
            preserveScroll: true,
            onSuccess: () => {
                const cat = form.data.expense_category_id;
                if (cat !== '') {
                    localStorage.setItem(LAST_EXPENSE_CATEGORY_STORAGE_KEY, cat);
                }
                form.reset('description', 'amount');
                form.setData('spent_on', defaultSpentOnForViewedMonth(today, viewYear, viewMonth));
                setCreateDialogOpen(false);
            },
        });
    }

    function openEdit(row: HomeExpenseListRow): void {
        setEditingExpense(row);
        editForm.setData({
            expense_category_id: String(row.expense_category_id),
            description: row.description,
            amount: row.amount,
            redirect_year: String(viewYear),
            redirect_month: String(viewMonth),
        });
        editForm.clearErrors();
        setEditDialogOpen(true);
    }

    function closeEditDialog(): void {
        setEditDialogOpen(false);
        setEditingExpense(null);
        setEditCategoryPickerOpen(false);
        editForm.reset();
    }

    function submitEdit(e: React.FormEvent): void {
        e.preventDefault();
        if (editingExpense === null) {
            return;
        }
        editForm.put(`/expenses/${editingExpense.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                closeEditDialog();
            },
        });
    }

    function performDelete(): void {
        if (deletingExpense === null) {
            return;
        }
        setDeleteSubmitting(true);
        router.delete(`/expenses/${deletingExpense.id}`, {
            preserveScroll: true,
            data: {
                redirect_year: viewYear,
                redirect_month: viewMonth,
            },
            onFinish: () => {
                setDeleteSubmitting(false);
                setDeletingExpense(null);
            },
        });
    }

    return (
        <AppDashboardLayout>
            <Head title={t('expenses.head_title')} />
            <div className="space-y-6">
                <div
                    className={cn(
                        'flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground shadow-sm',
                        'sm:flex-row sm:flex-nowrap sm:items-center sm:justify-between sm:gap-3 sm:p-4',
                    )}
                >
                    <div className="flex min-w-0 w-full flex-nowrap items-stretch gap-2 sm:w-auto sm:min-w-0 sm:shrink">
                        <div
                            className={cn(
                                'min-w-0 flex-1 sm:flex-none',
                                '[&_button]:h-11 [&_button]:w-full [&_button]:min-w-0 [&_button]:max-w-none [&_button]:justify-between [&_button]:gap-2 [&_button]:px-3 [&_button]:text-base [&_button]:font-semibold [&_button>span]:text-base',
                                'sm:[&_button]:h-9 sm:[&_button]:w-auto sm:[&_button]:max-w-[min(100%,18rem)] sm:[&_button]:justify-start sm:[&_button]:px-2.5 sm:[&_button]:text-sm sm:[&_button]:font-normal sm:[&_button>span]:text-sm',
                                'md:[&_button]:h-10 md:[&_button]:max-w-[20rem]',
                            )}
                        >
                            <HomeMonthPicker viewYear={viewYear} viewMonth={viewMonth} highlightCalendarNextMonth={false} />
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn(
                                        'flex h-11 shrink-0 cursor-default items-center justify-center gap-2 rounded-lg border border-border bg-background px-3',
                                        'text-base font-semibold tabular-nums tracking-tight text-foreground',
                                        'shadow-none sm:h-9 sm:gap-2 sm:px-2.5 sm:text-sm md:h-10 dark:border-input dark:bg-input/30',
                                    )}
                                    aria-label={t('expenses.month_total_nav_aria', { amount: monthTotalDisplay })}
                                >
                                    <Sigma
                                        className="size-5 shrink-0 text-primary/90 sm:size-4 md:size-[1.125rem]"
                                        aria-hidden
                                    />
                                    {monthTotalDisplay}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" sideOffset={6}>
                                {t('expenses.month_total_nav_tooltip')}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        className="hidden h-9 shrink-0 gap-1.5 font-medium sm:inline-flex md:h-10"
                        onClick={() => openCreateDialog()}
                        aria-label={t('expenses.open_new_expense_modal_aria')}
                    >
                        <Plus className="size-4 shrink-0" aria-hidden />
                        {t('expenses.new_expense_button')}
                    </Button>
                </div>

                <section className="flex flex-col gap-6" aria-label={t('expenses.month_expenses_section_aria')}>
                    {expensesByDay.map((day, index) => {
                        const isToday = day.date === today;
                        const formattedDayHeading = formatDayHeading(day.date, locale);
                        const dayTotalNumeric = sumExpenseRowsAmount(day.expenses);
                        const dayTotalDisplay = formatAmountDisplay(dayTotalNumeric.toFixed(2), locale);
                        const headingId = `home-expenses-day-${day.date}`;

                        return (
                            <React.Fragment key={day.date}>
                                {index > 0 ? (
                                    <div
                                        className="h-px w-full shrink-0 bg-muted"
                                        aria-hidden
                                    />
                                ) : null}
                                <section
                                    className="flex flex-col gap-2"
                                    aria-labelledby={headingId}
                                >
                                    <HomeTodayTotalSummaryCard
                                        headingId={headingId}
                                        formattedDateHeading={formattedDayHeading}
                                        todayTotalDisplay={dayTotalDisplay}
                                        totalCaption={isToday ? undefined : t('expenses.day_total_caption')}
                                        totalAriaLabel={
                                            isToday
                                                ? undefined
                                                : t('expenses.day_total_aria', { amount: dayTotalDisplay })
                                        }
                                    />
                                    {day.expenses.length === 0 ? (
                                        isToday ? (
                                            <p className="rounded-xl border border-dashed border-border/60 bg-muted/5 px-4 py-6 text-center text-sm text-muted-foreground">
                                                {t('expenses.empty_today')}
                                            </p>
                                        ) : null
                                    ) : (
                                        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                                            {day.expenses.map((row) => (
                                                <li key={row.id}>
                                                    <HomeExpenseListItem
                                                        row={row}
                                                        onEdit={openEdit}
                                                        onDelete={setDeletingExpense}
                                                    />
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            </React.Fragment>
                        );
                    })}
                </section>
            </div>

            <MobileFab
                onClick={() => openCreateDialog()}
                aria-label={t('expenses.open_new_expense_modal_aria')}
            >
                <Plus className={mobileFabPlusIconClassName} aria-hidden />
            </MobileFab>

            <Dialog
                open={createDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeCreateDialog();
                    }
                }}
            >
                <DialogContent
                    presentation="form"
                    className="sm:max-w-lg"
                    closeAriaLabel={t('expense_categories.close_dialog')}
                >
                    <DialogHeader>
                        <DialogTitle>{t('expenses.add_heading')}</DialogTitle>
                        <DialogDescription className="sr-only">{t('expenses.open_new_expense_modal_aria')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitExpense} className="flex w-full min-w-0 flex-col gap-3">
                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="expense_amount" className={compactLabelClass()}>
                                {t('expenses.amount_label')}
                            </label>
                            <NumericFormat
                                getInputRef={amountRef}
                                customInput={TextInput}
                                id="expense_amount"
                                inputMode="decimal"
                                allowNegative={false}
                                prefix="$ "
                                thousandSeparator={amountThousandSeparator}
                                decimalSeparator={amountDecimalSeparator}
                                decimalScale={2}
                                value={form.data.amount}
                                onValueChange={(values) => {
                                    form.setData('amount', values.value);
                                }}
                                placeholder={t('expenses.amount_placeholder')}
                                className="h-9 py-1.5"
                                required
                            />
                            <FieldError message={form.errors.amount} />
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="expense_category_trigger" className={compactLabelClass()}>
                                {t('expenses.category_label')}
                            </label>
                            <Button
                                type="button"
                                id="expense_category_trigger"
                                variant="outline"
                                className="h-9 w-full justify-start gap-2 px-2.5 font-normal"
                                onClick={() => setCategoryPickerOpen(true)}
                                aria-expanded={categoryPickerOpen}
                                aria-haspopup="dialog"
                                aria-invalid={form.errors.expense_category_id ? true : undefined}
                                aria-required
                                aria-label={
                                    selectedCategory
                                        ? `${t('expenses.category_label')}: ${selectedCategory.name}. ${t('expenses.open_category_picker_aria')}`
                                        : t('expenses.open_category_picker_aria')
                                }
                            >
                                {selectedCategory === null ? (
                                    <Tags className="size-4 shrink-0 opacity-70" aria-hidden />
                                ) : null}
                                {selectedCategory ? (
                                    <>
                                        <ExpenseCategoryIcon
                                            name={selectedCategory.icon ?? DEFAULT_EXPENSE_CATEGORY_ICON}
                                            className="size-4 shrink-0 text-muted-foreground"
                                        />
                                        <span className="min-w-0 flex-1 truncate text-left text-sm">
                                            {selectedCategory.name}
                                        </span>
                                    </>
                                ) : (
                                    <span className="min-w-0 flex-1 truncate text-left text-sm text-muted-foreground">
                                        {t('expenses.category_placeholder')}
                                    </span>
                                )}
                                <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
                            </Button>
                            <FieldError message={form.errors.expense_category_id} />
                        </div>

                        <ExpenseCategorySelectDialog
                            open={categoryPickerOpen}
                            onOpenChange={setCategoryPickerOpen}
                            defaultCategories={defaultCategories}
                            myCategories={myCategories}
                            selectedId={form.data.expense_category_id}
                            onSelect={(id) => {
                                form.setData('expense_category_id', String(id));
                                focusDescription();
                            }}
                            title={t('expenses.category_picker_title')}
                            closeAriaLabel={t('expense_categories.close_dialog')}
                        />

                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="expense_description" className={compactLabelClass()}>
                                <span>{t('expenses.description_label')}</span>{' '}
                                <span className="font-normal text-muted-foreground">
                                    {t('expenses.optional_suffix')}
                                </span>
                            </label>
                            <TextInput
                                ref={descriptionRef}
                                id="expense_description"
                                className="h-9 py-1.5"
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                placeholder={t('expenses.description_placeholder')}
                                autoComplete="off"
                            />
                            <FieldError message={form.errors.description} />
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="expense_spent_on" className={compactLabelClass()}>
                                {t('expenses.spent_on_label')}
                            </label>
                            <HomeExpenseDayPicker
                                id="expense_spent_on"
                                viewYear={viewYear}
                                viewMonth={viewMonth}
                                value={form.data.spent_on}
                                onChange={(iso) => form.setData('spent_on', iso)}
                            />
                            <FieldError message={form.errors.spent_on} />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-3">
                            <Button type="button" variant="outline" onClick={() => closeCreateDialog()}>
                                {t('expense_categories.cancel')}
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? t('expenses.submitting') : t('expenses.submit')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={editDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeEditDialog();
                    }
                }}
            >
                <DialogContent
                    presentation="form"
                    className="sm:max-w-lg"
                    closeAriaLabel={t('expense_categories.close_dialog')}
                >
                    <DialogHeader>
                        <DialogTitle>{t('expenses.edit_heading')}</DialogTitle>
                        <DialogDescription className="sr-only">{t('expenses.edit_heading')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="flex w-full min-w-0 flex-col gap-3">
                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="edit_expense_category_trigger" className={compactLabelClass()}>
                                {t('expenses.category_label')}
                            </label>
                            <Button
                                type="button"
                                id="edit_expense_category_trigger"
                                variant="outline"
                                className="h-9 w-full justify-start gap-2 px-2.5 font-normal"
                                onClick={() => setEditCategoryPickerOpen(true)}
                                aria-expanded={editCategoryPickerOpen}
                                aria-haspopup="dialog"
                                aria-invalid={editForm.errors.expense_category_id ? true : undefined}
                                aria-required
                            >
                                {editSelectedCategory === null ? (
                                    <Tags className="size-4 shrink-0 opacity-70" aria-hidden />
                                ) : null}
                                {editSelectedCategory ? (
                                    <>
                                        <ExpenseCategoryIcon
                                            name={editSelectedCategory.icon ?? DEFAULT_EXPENSE_CATEGORY_ICON}
                                            className="size-4 shrink-0 text-muted-foreground"
                                        />
                                        <span className="min-w-0 flex-1 truncate text-left text-sm">
                                            {editSelectedCategory.name}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-sm text-muted-foreground">
                                        {t('expenses.category_placeholder')}
                                    </span>
                                )}
                                <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
                            </Button>
                            <FieldError message={editForm.errors.expense_category_id} />
                        </div>

                        <ExpenseCategorySelectDialog
                            open={editCategoryPickerOpen}
                            onOpenChange={setEditCategoryPickerOpen}
                            defaultCategories={defaultCategories}
                            myCategories={myCategories}
                            selectedId={editForm.data.expense_category_id}
                            onSelect={(id) => {
                                editForm.setData('expense_category_id', String(id));
                                focusEditAmount();
                            }}
                            title={t('expenses.category_picker_title')}
                            closeAriaLabel={t('expense_categories.close_dialog')}
                        />

                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="edit_expense_amount" className={compactLabelClass()}>
                                {t('expenses.amount_label')}
                            </label>
                            <NumericFormat
                                getInputRef={editAmountRef}
                                customInput={TextInput}
                                id="edit_expense_amount"
                                inputMode="decimal"
                                allowNegative={false}
                                prefix="$ "
                                thousandSeparator={amountThousandSeparator}
                                decimalSeparator={amountDecimalSeparator}
                                decimalScale={2}
                                value={editForm.data.amount}
                                onValueChange={(values) => {
                                    editForm.setData('amount', values.value);
                                }}
                                placeholder={t('expenses.amount_placeholder')}
                                className="h-9 py-1.5"
                                required
                            />
                            <FieldError message={editForm.errors.amount} />
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="edit_expense_description" className={compactLabelClass()}>
                                <span>{t('expenses.description_label')}</span>{' '}
                                <span className="font-normal text-muted-foreground">
                                    {t('expenses.optional_suffix')}
                                </span>
                            </label>
                            <TextInput
                                id="edit_expense_description"
                                className="h-9 py-1.5"
                                value={editForm.data.description}
                                onChange={(e) => editForm.setData('description', e.target.value)}
                                placeholder={t('expenses.description_placeholder')}
                                autoComplete="off"
                            />
                            <FieldError message={editForm.errors.description} />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-3">
                            <Button type="button" variant="outline" onClick={() => closeEditDialog()}>
                                {t('expense_categories.cancel')}
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? t('expenses.edit_submitting') : t('expenses.edit_save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deletingExpense !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingExpense(null);
                    }
                }}
            >
                <DialogContent closeAriaLabel={t('expense_categories.close_dialog')}>
                    <DialogHeader>
                        <DialogTitle>{t('expenses.delete_modal_title')}</DialogTitle>
                        <DialogDescription>{t('expenses.delete_modal_description')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={deleteSubmitting}
                            onClick={() => setDeletingExpense(null)}
                        >
                            {t('expense_categories.cancel')}
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={deleteSubmitting}
                            onClick={() => performDelete()}
                        >
                            {deleteSubmitting ? t('expenses.deleting') : t('expenses.delete_confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppDashboardLayout>
    );
}
