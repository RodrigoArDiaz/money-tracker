import { Head, router, useForm } from '@inertiajs/react';
import * as React from 'react';
import { NumericFormat } from 'react-number-format';
import { ChevronDown, Sigma, Tags } from 'lucide-react';

import FieldError from '@/components/atoms/FieldError';
import PrimaryButton from '@/components/atoms/PrimaryButton';
import TextInput from '@/components/atoms/TextInput';
import AppDashboardLayout from '@/components/layouts/AppDashboardLayout';
import { ExpenseCategorySelectDialog } from '@/components/molecules/ExpenseCategorySelectDialog';
import { HomeMonthPicker } from '@/components/molecules/HomeMonthPicker';
import { PaymentStatusPaidBlockedHint } from '@/components/molecules/PaymentStatusPaidBlockedHint';
import {
    UpcomingExpenseListItem,
    type UpcomingExpenseRow,
} from '@/components/molecules/UpcomingExpenseListItem';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAutosizeTextarea } from '@/hooks/use-autosize-textarea';
import { useTranslate } from '@/hooks/use-translate';
import {
    EXPENSE_TOTAL_SUMMARY_CARD_CLASS_NAME,
    EXPENSE_TOTAL_SUMMARY_CARD_UNPAID_ALERT_CLASS_NAME,
    DEFAULT_EXPENSE_CATEGORY_ICON,
} from '@/lib/expense-card-surface';
import { ExpenseCategoryIcon } from '@/lib/expense-category-icons';
import { formatAmountDisplay } from '@/lib/expense-format';
import { INLINE_FORM_SELECT_TRIGGER_CLASS } from '@/lib/inline-form-select-trigger';
import { cn } from '@/lib/utils';

type CategoryOption = {
    id: number;
    name: string;
    icon: string | null;
};

const LAST_EXPENSE_CATEGORY_STORAGE_KEY = 'money-tracker-last-expense-category-id';

function compactLabelClass(): string {
    return 'mb-0.5 block text-xs font-medium text-muted-foreground';
}

export default function UpcomingExpenses({
    viewYear,
    viewMonth,
    myCategories,
    defaultCategories,
    expenses,
    total_amount,
    unpaid_total,
    can_mark_planned_expenses_paid,
}: {
    viewYear: number;
    viewMonth: number;
    myCategories: CategoryOption[];
    defaultCategories: CategoryOption[];
    expenses: UpcomingExpenseRow[];
    total_amount: string;
    unpaid_total: string;
    can_mark_planned_expenses_paid: boolean;
}) {
    const { t, locale } = useTranslate();

    const totalDisplay = React.useMemo(() => formatAmountDisplay(total_amount, locale), [total_amount, locale]);
    const unpaidDisplay = React.useMemo(() => formatAmountDisplay(unpaid_total, locale), [unpaid_total, locale]);

    const hasUnpaidBalance = React.useMemo(() => {
        const unpaid = Number.parseFloat(unpaid_total);

        return Number.isFinite(unpaid) && unpaid > 0;
    }, [unpaid_total]);

    const amountThousandSeparator = locale === 'es' ? '.' : ',';
    const amountDecimalSeparator = locale === 'es' ? ',' : '.';

    const form = useForm({
        year: String(viewYear),
        month: String(viewMonth),
        expense_category_id: '',
        description: '',
        note: '',
        amount: '',
        kind: 'fixed' as 'fixed' | 'variable',
        redirect_year: String(viewYear),
        redirect_month: String(viewMonth),
    });

    const editForm = useForm({
        expense_category_id: '',
        description: '',
        note: '',
        amount: '',
        kind: 'fixed' as 'fixed' | 'variable',
        payment_status: 'unpaid' as 'paid' | 'unpaid',
        redirect_year: String(viewYear),
        redirect_month: String(viewMonth),
    });

    React.useEffect(() => {
        form.setData('year', String(viewYear));
        form.setData('month', String(viewMonth));
        form.setData('redirect_year', String(viewYear));
        form.setData('redirect_month', String(viewMonth));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewYear, viewMonth]);

    React.useEffect(() => {
        editForm.setData('redirect_year', String(viewYear));
        editForm.setData('redirect_month', String(viewMonth));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewYear, viewMonth]);

    const [categoryPickerOpen, setCategoryPickerOpen] = React.useState(false);
    const [editCategoryPickerOpen, setEditCategoryPickerOpen] = React.useState(false);
    const [editDialogOpen, setEditDialogOpen] = React.useState(false);
    const [editingExpense, setEditingExpense] = React.useState<UpcomingExpenseRow | null>(null);
    const [deletingExpense, setDeletingExpense] = React.useState<UpcomingExpenseRow | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = React.useState(false);

    const amountRef = React.useRef<HTMLInputElement | null>(null);
    const editAmountRef = React.useRef<HTMLInputElement | null>(null);

    const noteTextareaRef = useAutosizeTextarea(form.data.note);
    const editNoteTextareaRef = useAutosizeTextarea(editForm.data.note, {
        maxHeightPx: 280,
        enabled: editDialogOpen,
    });

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

    const editPaidOptionDisabled = React.useMemo(
        () => !can_mark_planned_expenses_paid && editForm.data.payment_status === 'unpaid',
        [can_mark_planned_expenses_paid, editForm.data.payment_status],
    );

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
        queueMicrotask(() => amountRef.current?.focus());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function focusAmount(): void {
        queueMicrotask(() => amountRef.current?.focus());
    }

    function focusEditAmount(): void {
        queueMicrotask(() => editAmountRef.current?.focus());
    }

    function submitExpense(e: React.FormEvent): void {
        e.preventDefault();
        form.post('/upcoming-expenses', {
            preserveScroll: true,
            onSuccess: () => {
                const cat = form.data.expense_category_id;
                if (cat !== '') {
                    localStorage.setItem(LAST_EXPENSE_CATEGORY_STORAGE_KEY, cat);
                }
                form.reset('description', 'note', 'amount');
                focusAmount();
            },
        });
    }

    function openEdit(row: UpcomingExpenseRow): void {
        setEditingExpense(row);
        editForm.setData({
            expense_category_id: row.expense_category_id !== null ? String(row.expense_category_id) : '',
            description: row.description,
            note: row.note ?? '',
            amount: row.amount,
            kind: row.kind,
            payment_status: row.payment_status,
            redirect_year: String(viewYear),
            redirect_month: String(viewMonth),
        });
        editForm.clearErrors();
        setEditCategoryPickerOpen(false);
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
        editForm.put(`/upcoming-expenses/${editingExpense.id}`, {
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
        router.delete(`/upcoming-expenses/${deletingExpense.id}`, {
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

    function handlePaymentStatusChange(
        row: UpcomingExpenseRow,
        payment_status: UpcomingExpenseRow['payment_status'],
    ): void {
        if (payment_status === row.payment_status) {
            return;
        }
        if (row.expense_category_id === null) {
            return;
        }
        router.put(
            `/upcoming-expenses/${row.id}`,
            {
                expense_category_id: row.expense_category_id,
                description: row.description,
                note: row.note ?? '',
                amount: row.amount,
                kind: row.kind,
                payment_status,
                redirect_year: viewYear,
                redirect_month: viewMonth,
            },
            { preserveScroll: true },
        );
    }

    return (
        <AppDashboardLayout
            title={
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <HomeMonthPicker
                        viewYear={viewYear}
                        viewMonth={viewMonth}
                        navigatePath="/upcoming-expenses"
                        allowFutureMonths
                        monthPickerAriaLabel={t('upcoming_expenses.month_picker_aria')}
                    />
                </div>
            }
        >
            <Head title={t('upcoming_expenses.head_title')} />
            <div className="space-y-6">
                <section className="rounded-xl border bg-card p-3 text-card-foreground shadow-sm sm:p-4">
                    <h2 className="sr-only">{t('upcoming_expenses.add_heading')}</h2>
                    <form onSubmit={submitExpense} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-end lg:gap-2 xl:gap-3">
                            <div className="flex w-full shrink-0 flex-col gap-0.5 lg:w-[12rem] lg:max-w-[14rem]">
                                <label htmlFor="upcoming_category_trigger" className={compactLabelClass()}>
                                    {t('expenses.category_label')}
                                </label>
                                <Button
                                    type="button"
                                    id="upcoming_category_trigger"
                                    variant="outline"
                                    className="h-9 w-full justify-start gap-2 px-2.5 font-normal"
                                    onClick={() => setCategoryPickerOpen(true)}
                                    aria-expanded={categoryPickerOpen}
                                    aria-haspopup="dialog"
                                    aria-invalid={form.errors.expense_category_id ? true : undefined}
                                    aria-required
                                    aria-label={
                                        selectedCategory
                                            ? `${t('expenses.category_label')}: ${selectedCategory.name}. ${t(
                                                  'expenses.open_category_picker_aria',
                                              )}`
                                            : t('expenses.open_category_picker_aria')
                                    }
                                >
                                    <Tags className="size-4 shrink-0 opacity-70" aria-hidden />
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
                            </div>

                            <div className="flex min-w-0 flex-col gap-0.5 lg:min-w-[7rem] lg:max-w-[13rem] lg:flex-1">
                                <label htmlFor="upcoming_description" className={compactLabelClass()}>
                                    {t('upcoming_expenses.description_label')}
                                </label>
                                <TextInput
                                    id="upcoming_description"
                                    className="h-9 py-1.5"
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    required
                                    autoComplete="off"
                                />
                                <FieldError message={form.errors.description} />
                            </div>

                            <div className="flex shrink-0 flex-col gap-0.5 lg:w-[11rem]">
                                <label htmlFor="upcoming_amount" className={compactLabelClass()}>
                                    {t('upcoming_expenses.amount_label')}
                                </label>
                                <NumericFormat
                                    getInputRef={amountRef}
                                    customInput={TextInput}
                                    id="upcoming_amount"
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
                                    placeholder={t('upcoming_expenses.amount_placeholder')}
                                    className="h-9 py-1.5"
                                    required
                                />
                                <FieldError message={form.errors.amount} />
                            </div>

                            <div className="flex min-w-0 flex-col gap-0.5 lg:min-w-[10rem] lg:flex-1">
                                <label htmlFor="upcoming_note" className={compactLabelClass()}>
                                    <span>{t('upcoming_expenses.note_label')}</span>{' '}
                                    <span className="font-normal text-muted-foreground">
                                        {t('upcoming_expenses.optional_suffix')}
                                    </span>
                                </label>
                                <textarea
                                    ref={noteTextareaRef}
                                    id="upcoming_note"
                                    rows={1}
                                    value={form.data.note}
                                    onChange={(e) => form.setData('note', e.target.value)}
                                    placeholder={t('upcoming_expenses.note_placeholder')}
                                    autoComplete="off"
                                    className={cn(
                                        'box-border min-h-9 w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm leading-5 outline-none transition-colors',
                                        'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30',
                                    )}
                                />
                                <FieldError message={form.errors.note} />
                            </div>

                            <div className="flex shrink-0 flex-col gap-0.5 lg:w-[7.5rem] xl:w-[8rem]">
                                <label htmlFor="upcoming_kind" className={compactLabelClass()}>
                                    {t('upcoming_expenses.kind_label')}
                                </label>
                                <Select
                                    value={form.data.kind}
                                    onValueChange={(value) => {
                                        if (value === 'fixed' || value === 'variable') {
                                            form.setData('kind', value);
                                            focusAmount();
                                        }
                                    }}
                                >
                                    <SelectTrigger
                                        id="upcoming_kind"
                                        size="md"
                                        aria-label={t('upcoming_expenses.kind_select_aria')}
                                        className={INLINE_FORM_SELECT_TRIGGER_CLASS}
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fixed">{t('upcoming_expenses.kind_fixed')}</SelectItem>
                                        <SelectItem value="variable">{t('upcoming_expenses.kind_variable')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError message={form.errors.kind} />
                            </div>

                            <div className="flex shrink-0 justify-end lg:justify-start lg:self-end lg:pb-[1px]">
                                <PrimaryButton type="submit" disabled={form.processing} className="h-9 min-w-[6.5rem] font-medium">
                                    {form.processing ? t('upcoming_expenses.submitting') : t('upcoming_expenses.submit')}
                                </PrimaryButton>
                            </div>
                        </div>
                    </form>
                </section>

                <section aria-label={t('upcoming_expenses.totals_section_aria')}>
                    <article
                        className={hasUnpaidBalance ? EXPENSE_TOTAL_SUMMARY_CARD_UNPAID_ALERT_CLASS_NAME : EXPENSE_TOTAL_SUMMARY_CARD_CLASS_NAME}
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 flex-1 items-start gap-2">
                                    <Sigma className="mt-0.5 size-5 shrink-0 text-primary/90" aria-hidden />
                                    <div className="min-w-0 space-y-0.5">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('upcoming_expenses.total_all_caption')}
                                        </p>
                                        <p
                                            className="text-xl font-semibold tabular-nums tracking-tight text-foreground"
                                            aria-label={t('upcoming_expenses.total_all_aria', { amount: totalDisplay })}
                                        >
                                            {totalDisplay}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 flex-1 items-start gap-2">
                                    <Sigma className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-500/90" aria-hidden />
                                    <div className="min-w-0 space-y-0.5">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('upcoming_expenses.total_unpaid_caption')}
                                        </p>
                                        <p
                                            className="text-xl font-semibold tabular-nums tracking-tight text-foreground"
                                            aria-label={t('upcoming_expenses.total_unpaid_aria', {
                                                amount: unpaidDisplay,
                                            })}
                                        >
                                            {unpaidDisplay}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>
                </section>

                <section className="flex flex-col gap-3" aria-label={t('upcoming_expenses.list_heading')}>
                    {expenses.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border/60 bg-muted/5 px-4 py-6 text-center text-sm text-muted-foreground">
                            {t('upcoming_expenses.empty')}
                        </p>
                    ) : (
                        <ul className="m-0 flex min-w-0 max-w-full list-none flex-col gap-1.5 p-0">
                            {expenses.map((row) => (
                                <li key={row.id}>
                                    <UpcomingExpenseListItem
                                        row={row}
                                        canMarkPaid={can_mark_planned_expenses_paid}
                                        onEdit={openEdit}
                                        onDelete={setDeletingExpense}
                                        onPaymentStatusChange={handlePaymentStatusChange}
                                    />
                                </li>
                            ))}
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
                        <DialogTitle>{t('upcoming_expenses.edit_heading')}</DialogTitle>
                        <DialogDescription className="sr-only">{t('upcoming_expenses.edit_heading')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="edit_upcoming_category_trigger" className={compactLabelClass()}>
                                {t('expenses.category_label')}
                            </label>
                            <Button
                                type="button"
                                id="edit_upcoming_category_trigger"
                                variant="outline"
                                className="h-9 w-full justify-start gap-2 px-2.5 font-normal"
                                onClick={() => setEditCategoryPickerOpen(true)}
                                aria-expanded={editCategoryPickerOpen}
                                aria-haspopup="dialog"
                                aria-required
                                aria-label={
                                    editSelectedCategory
                                        ? `${t('expenses.category_label')}: ${editSelectedCategory.name}. ${t(
                                              'expenses.open_category_picker_aria',
                                          )}`
                                        : t('expenses.open_category_picker_aria')
                                }
                                aria-invalid={editForm.errors.expense_category_id ? true : undefined}
                            >
                                <Tags className="size-4 shrink-0 opacity-70" aria-hidden />
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
                                    <span className="min-w-0 flex-1 truncate text-left text-sm text-muted-foreground">
                                        {t('expenses.category_placeholder')}
                                    </span>
                                )}
                                <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
                            </Button>
                            <FieldError message={editForm.errors.expense_category_id} />
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
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="edit_upcoming_description" className={compactLabelClass()}>
                                {t('upcoming_expenses.description_label')}
                            </label>
                            <TextInput
                                id="edit_upcoming_description"
                                className="h-9 py-1.5"
                                value={editForm.data.description}
                                onChange={(e) => editForm.setData('description', e.target.value)}
                                required
                                autoComplete="off"
                            />
                            <FieldError message={editForm.errors.description} />
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="edit_upcoming_amount" className={compactLabelClass()}>
                                {t('upcoming_expenses.amount_label')}
                            </label>
                            <NumericFormat
                                getInputRef={editAmountRef}
                                customInput={TextInput}
                                id="edit_upcoming_amount"
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
                                placeholder={t('upcoming_expenses.amount_placeholder')}
                                className="h-9 py-1.5"
                                required
                            />
                            <FieldError message={editForm.errors.amount} />
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="edit_upcoming_note" className={compactLabelClass()}>
                                <span>{t('upcoming_expenses.note_label')}</span>{' '}
                                <span className="font-normal text-muted-foreground">
                                    {t('upcoming_expenses.optional_suffix')}
                                </span>
                            </label>
                            <textarea
                                ref={editNoteTextareaRef}
                                id="edit_upcoming_note"
                                rows={1}
                                value={editForm.data.note}
                                onChange={(e) => editForm.setData('note', e.target.value)}
                                placeholder={t('upcoming_expenses.note_placeholder')}
                                autoComplete="off"
                                className={cn(
                                    'box-border min-h-9 w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm leading-5 outline-none transition-colors',
                                    'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30',
                                )}
                            />
                            <FieldError message={editForm.errors.note} />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="flex min-w-0 flex-col gap-0.5 sm:max-w-[8rem]">
                                <label htmlFor="edit_upcoming_kind" className={compactLabelClass()}>
                                    {t('upcoming_expenses.kind_label')}
                                </label>
                                <Select
                                    value={editForm.data.kind}
                                    onValueChange={(value) => {
                                        if (value === 'fixed' || value === 'variable') {
                                            editForm.setData('kind', value);
                                            focusEditAmount();
                                        }
                                    }}
                                >
                                    <SelectTrigger
                                        id="edit_upcoming_kind"
                                        size="md"
                                        aria-label={t('upcoming_expenses.kind_select_aria')}
                                        className={INLINE_FORM_SELECT_TRIGGER_CLASS}
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fixed">{t('upcoming_expenses.kind_fixed')}</SelectItem>
                                        <SelectItem value="variable">{t('upcoming_expenses.kind_variable')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError message={editForm.errors.kind} />
                            </div>

                            <div className="flex flex-col gap-0.5">
                                <label htmlFor="edit_upcoming_payment" className={compactLabelClass()}>
                                    {t('upcoming_expenses.payment_status_label')}
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="min-w-0 flex-1">
                                        <Select
                                            value={editForm.data.payment_status}
                                            onValueChange={(value) => {
                                                if (value === 'paid' || value === 'unpaid') {
                                                    editForm.setData('payment_status', value);
                                                }
                                            }}
                                        >
                                            <SelectTrigger
                                                id="edit_upcoming_payment"
                                                size="md"
                                                aria-label={t('upcoming_expenses.payment_select_aria')}
                                                className={INLINE_FORM_SELECT_TRIGGER_CLASS}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem
                                                    value="paid"
                                                    disabled={editPaidOptionDisabled}
                                                    title={
                                                        editPaidOptionDisabled
                                                            ? t('upcoming_expenses.paid_disabled_future_month_title')
                                                            : undefined
                                                    }
                                                >
                                                    {t('upcoming_expenses.status_paid')}
                                                </SelectItem>
                                                <SelectItem value="unpaid">{t('upcoming_expenses.status_unpaid')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <PaymentStatusPaidBlockedHint visible={editPaidOptionDisabled} />
                                </div>
                                <FieldError message={editForm.errors.payment_status} />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-3">
                            <Button type="button" variant="outline" onClick={() => closeEditDialog()}>
                                {t('expense_categories.cancel')}
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? t('upcoming_expenses.edit_submitting') : t('upcoming_expenses.edit_save')}
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
                        <DialogTitle>{t('upcoming_expenses.delete_modal_title')}</DialogTitle>
                        <DialogDescription>{t('upcoming_expenses.delete_modal_description')}</DialogDescription>
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
                            {deleteSubmitting ? t('upcoming_expenses.deleting') : t('upcoming_expenses.delete_confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppDashboardLayout>
    );
}
