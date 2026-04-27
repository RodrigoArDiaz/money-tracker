import { Head, router, useForm } from '@inertiajs/react';
import * as React from 'react';
import { NumericFormat } from 'react-number-format';

import FieldError from '@/components/atoms/FieldError';
import PrimaryButton from '@/components/atoms/PrimaryButton';
import TextInput from '@/components/atoms/TextInput';
import AppDashboardLayout from '@/components/layouts/AppDashboardLayout';
import { ExpenseCategorySelectDialog } from '@/components/molecules/ExpenseCategorySelectDialog';
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
import { ExpenseCategoryIcon } from '@/lib/expense-category-icons';
import { ChevronDown, Pencil, Sigma, Tags, Trash2 } from 'lucide-react';

type CategoryOption = {
    id: number;
    name: string;
    icon: string | null;
};

type ExpenseRow = {
    id: number;
    expense_category_id: number;
    description: string;
    amount: string;
    category_name: string;
    category_icon: string | null;
};

const DEFAULT_CATEGORY_ICON = 'Tag';

const LAST_EXPENSE_CATEGORY_STORAGE_KEY = 'money-tracker-last-expense-category-id';

/** Cada fila de gasto (card estándar). */
const expenseCardClassName =
    'rounded-xl border border-border bg-card px-4 py-2 text-card-foreground shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-primary/20 motion-safe:hover:shadow-md motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-sm sm:px-5 sm:py-2';

/** Resumen del día: más contraste que las cards de gasto (fondo atenuado). */
const expenseTotalSummaryCardClassName =
    'rounded-xl border border-muted-foreground/20 bg-muted/55 px-4 py-2 text-card-foreground shadow-sm transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-muted-foreground/35 motion-safe:hover:bg-muted/75 motion-safe:hover:shadow-md motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-sm sm:px-5 sm:py-2 dark:border-border dark:bg-muted/35 dark:motion-safe:hover:bg-muted/45';

function formatAmountDisplay(amount: string, locale: string): string {
    const n = Number.parseFloat(amount);
    if (Number.isNaN(n)) {
        return amount.startsWith('$') ? amount : `$ ${amount}`;
    }

    const formatted = new Intl.NumberFormat(locale === 'es' ? 'es' : 'en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);

    return `$ ${formatted}`;
}

function compactLabelClass(): string {
    return 'mb-0.5 block text-xs font-medium text-muted-foreground';
}

/** Primera letra en mayúscula (p. ej. fecha en español: "lunes…" → "Lunes…"). */
function capitalizeFirstLetter(value: string): string {
    if (value.length === 0) {
        return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function Home({
    today,
    myCategories,
    defaultCategories,
    expenses,
}: {
    today: string;
    myCategories: CategoryOption[];
    defaultCategories: CategoryOption[];
    expenses: ExpenseRow[];
}) {
    const { t, locale } = useTranslate();

    const formattedDateLabel = React.useMemo(() => {
        const d = new Date(`${today}T12:00:00`);
        return new Intl.DateTimeFormat(locale === 'es' ? 'es' : 'en', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(d);
    }, [today, locale]);

    const formattedDateHeading = React.useMemo(
        () => capitalizeFirstLetter(formattedDateLabel),
        [formattedDateLabel],
    );

    const amountThousandSeparator = locale === 'es' ? '.' : ',';
    const amountDecimalSeparator = locale === 'es' ? ',' : '.';

    const todayTotalNumeric = React.useMemo(() => {
        return expenses.reduce((sum, row) => {
            const n = Number.parseFloat(row.amount);

            return sum + (Number.isNaN(n) ? 0 : n);
        }, 0);
    }, [expenses]);

    const todayTotalDisplay = React.useMemo(
        () => formatAmountDisplay(todayTotalNumeric.toFixed(2), locale),
        [todayTotalNumeric, locale],
    );

    const form = useForm({
        expense_category_id: '',
        description: '',
        amount: '',
    });

    const editForm = useForm({
        expense_category_id: '',
        description: '',
        amount: '',
    });

    const [categoryPickerOpen, setCategoryPickerOpen] = React.useState(false);
    const [editCategoryPickerOpen, setEditCategoryPickerOpen] = React.useState(false);
    const [editDialogOpen, setEditDialogOpen] = React.useState(false);
    const [editingExpense, setEditingExpense] = React.useState<ExpenseRow | null>(null);
    const [deletingExpense, setDeletingExpense] = React.useState<ExpenseRow | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = React.useState(false);

    const amountRef = React.useRef<HTMLInputElement | null>(null);
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

    function focusAmount(): void {
        queueMicrotask(() => amountRef.current?.focus());
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
        focusAmount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function submitExpense(e: React.FormEvent): void {
        e.preventDefault();
        form.post('/expenses', {
            preserveScroll: true,
            onSuccess: () => {
                const cat = form.data.expense_category_id;
                if (cat !== '') {
                    localStorage.setItem(LAST_EXPENSE_CATEGORY_STORAGE_KEY, cat);
                }
                form.reset('description', 'amount');
                focusAmount();
            },
        });
    }

    function openEdit(row: ExpenseRow): void {
        setEditingExpense(row);
        editForm.setData({
            expense_category_id: String(row.expense_category_id),
            description: row.description,
            amount: row.amount,
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
            onFinish: () => {
                setDeleteSubmitting(false);
                setDeletingExpense(null);
            },
        });
    }

    return (
        <AppDashboardLayout title={t('expenses.title')}>
            <Head title={t('expenses.head_title')} />
            <div className="space-y-6">
                <section className="rounded-xl border bg-card p-3 text-card-foreground shadow-sm sm:p-4">
                    <h2 className="sr-only">{t('expenses.add_heading')}</h2>
                    <form onSubmit={submitExpense} className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-2">
                        <div className="flex min-w-0 flex-col gap-0.5 lg:w-48 lg:shrink-0">
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
                                <Tags className="size-4 shrink-0 opacity-70" aria-hidden />
                                {selectedCategory ? (
                                    <>
                                        <ExpenseCategoryIcon
                                            name={selectedCategory.icon ?? DEFAULT_CATEGORY_ICON}
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
                                focusAmount();
                            }}
                            title={t('expenses.category_picker_title')}
                            closeAriaLabel={t('expense_categories.close_dialog')}
                        />

                        <div className="flex w-full min-w-0 max-w-full flex-col gap-0.5 sm:max-w-[20rem] lg:max-w-none lg:w-[16rem] xl:w-[17rem] lg:shrink-0">
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

                        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                            <label htmlFor="expense_description" className={compactLabelClass()}>
                                <span>{t('expenses.description_label')}</span>{' '}
                                <span className="font-normal text-muted-foreground">
                                    {t('expenses.optional_suffix')}
                                </span>
                            </label>
                            <TextInput
                                id="expense_description"
                                className="h-9 py-1.5"
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                placeholder={t('expenses.description_placeholder')}
                                autoComplete="off"
                            />
                            <FieldError message={form.errors.description} />
                        </div>

                        <div className="flex w-full flex-col gap-0.5 lg:w-auto lg:shrink-0">
                            <span className="mb-0.5 hidden min-h-[1.125rem] lg:block" aria-hidden>
                                {'\u00a0'}
                            </span>
                            <PrimaryButton
                                type="submit"
                                disabled={form.processing}
                                className="h-9 py-0 font-medium lg:min-w-[6.5rem]"
                            >
                                {form.processing ? t('expenses.submitting') : t('expenses.submit_short')}
                            </PrimaryButton>
                        </div>
                    </form>
                </section>

                <section
                    className="flex flex-col gap-2"
                    aria-labelledby="today-expenses-date-heading"
                >
                    <article className={expenseTotalSummaryCardClassName}>
                        <h2 id="today-expenses-date-heading" className="sr-only">
                            {t('expenses.date_heading', { date: formattedDateHeading })}
                        </h2>
                        <div className="flex flex-col gap-2 sm:hidden">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                    <Sigma
                                        className="size-5 shrink-0 text-primary/90"
                                        aria-hidden
                                    />
                                    <p className="min-w-0 truncate text-sm font-medium leading-snug text-muted-foreground">
                                        {t('expenses.today_total_caption')}
                                    </p>
                                </div>
                                <p
                                    id="today-expenses-total"
                                    className="shrink-0 text-lg font-semibold tabular-nums tracking-tight text-foreground"
                                    aria-label={t('expenses.today_total_aria', { amount: todayTotalDisplay })}
                                >
                                    {todayTotalDisplay}
                                </p>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <p
                                    className="min-w-0 flex-1 text-left text-sm font-medium leading-snug text-foreground"
                                    aria-hidden
                                >
                                    {t('expenses.date_heading', { date: formattedDateHeading })}
                                </p>
                                <span
                                    className="inline-flex w-[4.5rem] shrink-0"
                                    aria-hidden
                                />
                            </div>
                        </div>
                        <header className="hidden items-center justify-between gap-3 sm:flex">
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <div className="flex items-center gap-2.5 sm:gap-3">
                                    <Sigma
                                        className="size-5 shrink-0 text-primary/90"
                                        aria-hidden
                                    />
                                    <p
                                        className="min-w-0 text-left text-lg font-semibold tabular-nums tracking-tight text-foreground"
                                        aria-label={t('expenses.today_total_aria', { amount: todayTotalDisplay })}
                                    >
                                        {todayTotalDisplay}
                                    </p>
                                </div>
                                <p className="max-w-[min(100%,16rem)] text-sm font-medium leading-snug text-muted-foreground sm:max-w-[20rem]">
                                    {t('expenses.today_total_caption')}
                                </p>
                            </div>
                            <p
                                className="shrink-0 text-right text-sm font-semibold tracking-tight text-foreground sm:text-base"
                                aria-hidden
                            >
                                {t('expenses.date_heading', { date: formattedDateHeading })}
                            </p>
                        </header>
                    </article>
                    {expenses.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border/60 bg-muted/5 px-4 py-6 text-center text-sm text-muted-foreground">
                            {t('expenses.empty_today')}
                        </p>
                    ) : (
                        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                            {expenses.map((row) => {
                                const descriptionBlock =
                                    row.description.trim() !== '' ? (
                                        <p className="text-sm font-medium leading-snug text-foreground">
                                            {row.description}
                                        </p>
                                    ) : (
                                        <p className="text-sm italic text-muted-foreground">
                                            {t('expenses.list_no_description')}
                                        </p>
                                    );

                                const expenseCardActions = (
                                    <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="shrink-0"
                                                    onClick={() => openEdit(row)}
                                                    aria-label={t('expenses.card_edit_aria')}
                                                >
                                                    <Pencil className="size-4" aria-hidden />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" sideOffset={4}>
                                                {t('expenses.card_edit_tooltip')}
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => setDeletingExpense(row)}
                                                    aria-label={t('expenses.card_delete_aria')}
                                                >
                                                    <Trash2 className="size-4" aria-hidden />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" sideOffset={4}>
                                                {t('expenses.card_delete_tooltip')}
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                );

                                return (
                                    <li key={row.id}>
                                        <article className={expenseCardClassName}>
                                            <div className="flex flex-col gap-2 sm:hidden">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                                        <ExpenseCategoryIcon
                                                            name={row.category_icon ?? DEFAULT_CATEGORY_ICON}
                                                            className="size-5 shrink-0 text-primary/90"
                                                        />
                                                        <p className="min-w-0 truncate text-sm font-medium leading-snug text-muted-foreground">
                                                            {row.category_name}
                                                        </p>
                                                    </div>
                                                    <p className="shrink-0 text-lg font-semibold tabular-nums tracking-tight text-foreground">
                                                        {formatAmountDisplay(row.amount, locale)}
                                                    </p>
                                                </div>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1 text-left">{descriptionBlock}</div>
                                                    {expenseCardActions}
                                                </div>
                                            </div>

                                            <div className="hidden items-center gap-1.5 sm:flex sm:gap-2">
                                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                                    <div className="flex items-center gap-2.5 sm:gap-3">
                                                        <ExpenseCategoryIcon
                                                            name={row.category_icon ?? DEFAULT_CATEGORY_ICON}
                                                            className="size-5 shrink-0 text-primary/90"
                                                        />
                                                        <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                                                            {formatAmountDisplay(row.amount, locale)}
                                                        </p>
                                                    </div>
                                                    <p className="max-w-[min(100%,16rem)] text-sm font-medium leading-snug text-muted-foreground sm:max-w-[20rem]">
                                                        {row.category_name}
                                                    </p>
                                                </div>
                                                <div className="min-w-0 flex-1 basis-0 pl-1 text-right sm:pl-1.5">
                                                    {descriptionBlock}
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2 pl-1.5 sm:pl-2">
                                                    <div className="w-px shrink-0 self-stretch bg-border" aria-hidden />
                                                    {expenseCardActions}
                                                </div>
                                            </div>
                                        </article>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>

            <Dialog
                open={editDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeEditDialog();
                    }
                }}
            >
                <DialogContent className="max-w-lg" closeAriaLabel={t('expense_categories.close_dialog')}>
                    <DialogHeader>
                        <DialogTitle>{t('expenses.edit_heading')}</DialogTitle>
                        <DialogDescription className="sr-only">{t('expenses.edit_heading')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="flex flex-col gap-3">
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
                                <Tags className="size-4 shrink-0 opacity-70" aria-hidden />
                                {editSelectedCategory ? (
                                    <>
                                        <ExpenseCategoryIcon
                                            name={editSelectedCategory.icon ?? DEFAULT_CATEGORY_ICON}
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
