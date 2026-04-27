import { Head, router, useForm } from '@inertiajs/react';
import * as React from 'react';
import { NumericFormat } from 'react-number-format';

import FieldError from '@/components/atoms/FieldError';
import PrimaryButton from '@/components/atoms/PrimaryButton';
import TextInput from '@/components/atoms/TextInput';
import AppDashboardLayout from '@/components/layouts/AppDashboardLayout';
import { ExpenseCategorySelectDialog } from '@/components/molecules/ExpenseCategorySelectDialog';
import { HomeExpenseListItem, type HomeExpenseListRow } from '@/components/molecules/HomeExpenseListItem';
import {
    HomeTodayTotalSummaryCard,
    HOME_TODAY_EXPENSES_SECTION_HEADING_ID,
} from '@/components/molecules/HomeTodayTotalSummaryCard';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslate } from '@/hooks/use-translate';
import { DEFAULT_EXPENSE_CATEGORY_ICON } from '@/lib/expense-card-surface';
import { capitalizeFirstLetter, formatAmountDisplay } from '@/lib/expense-format';
import { ExpenseCategoryIcon } from '@/lib/expense-category-icons';
import { ChevronDown, Tags } from 'lucide-react';

type CategoryOption = {
    id: number;
    name: string;
    icon: string | null;
};

const LAST_EXPENSE_CATEGORY_STORAGE_KEY = 'money-tracker-last-expense-category-id';

function compactLabelClass(): string {
    return 'mb-0.5 block text-xs font-medium text-muted-foreground';
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
    expenses: HomeExpenseListRow[];
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
    const [editingExpense, setEditingExpense] = React.useState<HomeExpenseListRow | null>(null);
    const [deletingExpense, setDeletingExpense] = React.useState<HomeExpenseListRow | null>(null);
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

    function openEdit(row: HomeExpenseListRow): void {
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
                    aria-labelledby={HOME_TODAY_EXPENSES_SECTION_HEADING_ID}
                >
                    <HomeTodayTotalSummaryCard
                        formattedDateHeading={formattedDateHeading}
                        todayTotalDisplay={todayTotalDisplay}
                    />
                    {expenses.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border/60 bg-muted/5 px-4 py-6 text-center text-sm text-muted-foreground">
                            {t('expenses.empty_today')}
                        </p>
                    ) : (
                        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                            {expenses.map((row) => (
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
