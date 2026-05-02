import { Head, Link, router, useForm } from '@inertiajs/react';
import * as React from 'react';
import { NumericFormat } from 'react-number-format';
import { ChevronDown, Tags } from 'lucide-react';

import FieldError from '@/components/atoms/FieldError';
import PrimaryButton from '@/components/atoms/PrimaryButton';
import TextInput from '@/components/atoms/TextInput';
import AppDashboardLayout from '@/components/layouts/AppDashboardLayout';
import { ExpenseCategorySelectDialog } from '@/components/molecules/ExpenseCategorySelectDialog';
import { HomeMonthPicker } from '@/components/molecules/HomeMonthPicker';
import { RecurringPlanMonthField } from '@/components/molecules/RecurringPlanMonthField';
import { RecurringTemplateListItem, type RecurringTemplateListRow } from '@/components/molecules/RecurringTemplateListItem';
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
import { DEFAULT_EXPENSE_CATEGORY_ICON } from '@/lib/expense-card-surface';
import { ExpenseCategoryIcon } from '@/lib/expense-category-icons';
import { INLINE_FORM_SELECT_TRIGGER_CLASS } from '@/lib/inline-form-select-trigger';
import { cn } from '@/lib/utils';

type CategoryOption = {
    id: number;
    name: string;
    icon: string | null;
};

const LAST_RECURRING_CATEGORY_STORAGE_KEY = 'money-tracker-last-recurring-expense-category-id';

function formatPlanMonth(locale: string, year: number, month: number): string {
    const d = new Date(Date.UTC(year, month - 1, 1));

    return new Intl.DateTimeFormat(locale === 'es' ? 'es' : 'en', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(d);
}

function addMonthsYm(year: number, month: number, delta: number): { y: number; m: number } {
    const idx = year * 12 + (month - 1) + delta;

    return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
}

function calendarNowYearMonth(): { y: number; m: number } {
    const d = new Date();

    return { y: d.getFullYear(), m: d.getMonth() + 1 };
}

function compactLabelClass(): string {
    return 'mb-0.5 block text-xs font-medium text-muted-foreground';
}

export default function UpcomingExpensesRecurring({
    defaultYear,
    defaultMonth,
    myCategories,
    defaultCategories,
    recurringTemplates,
}: {
    defaultYear: number;
    defaultMonth: number;
    myCategories: CategoryOption[];
    defaultCategories: CategoryOption[];
    recurringTemplates: RecurringTemplateListRow[];
}) {
    const { t, locale } = useTranslate();

    const amountThousandSeparator = locale === 'es' ? '.' : ',';
    const amountDecimalSeparator = locale === 'es' ? ',' : '.';

    const recurringForm = useForm({
        expense_category_id: '',
        description: '',
        note: '',
        amount: '',
        kind: 'fixed' as 'fixed' | 'variable',
        start_year: String(defaultYear),
        start_month: String(defaultMonth),
        end_year: '',
        end_month: '',
        redirect_year: String(defaultYear),
        redirect_month: String(defaultMonth),
    });

    const templateEditForm = useForm({
        expense_category_id: '',
        description: '',
        note: '',
        amount: '',
        kind: 'fixed' as 'fixed' | 'variable',
        is_active: true,
        end_year: '',
        end_month: '',
        redirect_year: String(defaultYear),
        redirect_month: String(defaultMonth),
    });

    React.useEffect(() => {
        const nowYm = calendarNowYearMonth();
        let sy = defaultYear;
        let sm = defaultMonth;
        if (sy * 12 + sm < nowYm.y * 12 + nowYm.m) {
            sy = nowYm.y;
            sm = nowYm.m;
        }
        recurringForm.setData('start_year', String(sy));
        recurringForm.setData('start_month', String(sm));
        recurringForm.setData('redirect_year', String(defaultYear));
        recurringForm.setData('redirect_month', String(defaultMonth));
        templateEditForm.setData('redirect_year', String(defaultYear));
        templateEditForm.setData('redirect_month', String(defaultMonth));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultYear, defaultMonth]);

    const recurringStartInclusiveMin = calendarNowYearMonth();
    const { y: nowY, m: nowM } = recurringStartInclusiveMin;

    const recurringStartParsed = React.useMemo(() => {
        const sy = Number.parseInt(recurringForm.data.start_year, 10);
        const sm = Number.parseInt(recurringForm.data.start_month, 10);
        if (!Number.isFinite(sy) || !Number.isFinite(sm) || sm < 1 || sm > 12) {
            return null;
        }

        return { y: sy, m: sm };
    }, [recurringForm.data.start_year, recurringForm.data.start_month]);

    const recurringEndInclusiveMin = React.useMemo(() => {
        if (recurringStartParsed === null) {
            return { y: nowY, m: nowM };
        }

        return addMonthsYm(recurringStartParsed.y, recurringStartParsed.m, 1);
    }, [recurringStartParsed, nowY, nowM]);

    React.useEffect(() => {
        if (recurringStartParsed === null) {
            return;
        }
        const eyRaw = recurringForm.data.end_year;
        const emRaw = recurringForm.data.end_month;
        if (eyRaw === '' || emRaw === '') {
            return;
        }
        const ey = Number.parseInt(eyRaw, 10);
        const em = Number.parseInt(emRaw, 10);
        if (!Number.isFinite(ey) || !Number.isFinite(em) || em < 1 || em > 12) {
            return;
        }
        if (ey * 12 + em <= recurringStartParsed.y * 12 + recurringStartParsed.m) {
            recurringForm.setData('end_year', '');
            recurringForm.setData('end_month', '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recurringForm.data.start_year, recurringForm.data.start_month]);

    const [recurringCategoryPickerOpen, setRecurringCategoryPickerOpen] = React.useState(false);
    const [templateEditCategoryPickerOpen, setTemplateEditCategoryPickerOpen] = React.useState(false);
    const [recurringTemplateEditOpen, setRecurringTemplateEditOpen] = React.useState(false);
    const [editingRecurringTemplate, setEditingRecurringTemplate] = React.useState<RecurringTemplateListRow | null>(null);
    const [deletingRecurringTemplate, setDeletingRecurringTemplate] = React.useState<RecurringTemplateListRow | null>(null);
    const [deleteTemplateSubmitting, setDeleteTemplateSubmitting] = React.useState(false);

    const recurringAmountRef = React.useRef<HTMLInputElement | null>(null);
    const templateEditAmountRef = React.useRef<HTMLInputElement | null>(null);

    const recurringNoteTextareaRef = useAutosizeTextarea(recurringForm.data.note);
    const templateEditNoteTextareaRef = useAutosizeTextarea(templateEditForm.data.note, {
        maxHeightPx: 280,
        enabled: recurringTemplateEditOpen,
    });

    const allCategoryOptions = React.useMemo(
        () => [...myCategories, ...defaultCategories],
        [myCategories, defaultCategories],
    );

    const planMonthFallback = React.useMemo(
        () => new Date(defaultYear, defaultMonth - 1, 1),
        [defaultYear, defaultMonth],
    );

    const templateEditPlanMonthFallback = React.useMemo(() => {
        if (editingRecurringTemplate === null) {
            return planMonthFallback;
        }

        return new Date(editingRecurringTemplate.start_year, editingRecurringTemplate.start_month - 1, 1);
    }, [editingRecurringTemplate, planMonthFallback]);

    const templateEditEndInclusiveMin = React.useMemo(() => {
        if (editingRecurringTemplate === null) {
            return undefined;
        }

        return addMonthsYm(editingRecurringTemplate.start_year, editingRecurringTemplate.start_month, 1);
    }, [editingRecurringTemplate]);

    const recurringSelectedCategory = React.useMemo(() => {
        const raw = recurringForm.data.expense_category_id;
        if (raw === '') {
            return null;
        }
        const id = Number(raw);
        return allCategoryOptions.find((c) => c.id === id) ?? null;
    }, [recurringForm.data.expense_category_id, allCategoryOptions]);

    const templateEditSelectedCategory = React.useMemo(() => {
        const raw = templateEditForm.data.expense_category_id;
        if (raw === '') {
            return null;
        }
        const id = Number(raw);
        return allCategoryOptions.find((c) => c.id === id) ?? null;
    }, [templateEditForm.data.expense_category_id, allCategoryOptions]);

    React.useEffect(() => {
        const raw = localStorage.getItem(LAST_RECURRING_CATEGORY_STORAGE_KEY);
        if (raw === null || raw === '') {
            return;
        }
        const id = Number.parseInt(raw, 10);
        if (!Number.isFinite(id)) {
            localStorage.removeItem(LAST_RECURRING_CATEGORY_STORAGE_KEY);
            return;
        }
        const exists = allCategoryOptions.some((c) => c.id === id);
        if (!exists) {
            localStorage.removeItem(LAST_RECURRING_CATEGORY_STORAGE_KEY);
            return;
        }
        recurringForm.setData('expense_category_id', String(id));
        queueMicrotask(() => recurringAmountRef.current?.focus());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function submitRecurring(e: React.FormEvent): void {
        e.preventDefault();
        recurringForm.post('/upcoming-expense-recurring-templates', {
            preserveScroll: true,
            onSuccess: () => {
                const cat = recurringForm.data.expense_category_id;
                if (cat !== '') {
                    localStorage.setItem(LAST_RECURRING_CATEGORY_STORAGE_KEY, cat);
                }
                recurringForm.reset('description', 'note', 'amount');
                recurringForm.setData('end_year', '');
                recurringForm.setData('end_month', '');
                queueMicrotask(() => recurringAmountRef.current?.focus());
            },
        });
    }

    function openRecurringTemplateEdit(row: RecurringTemplateListRow): void {
        setEditingRecurringTemplate(row);
        templateEditForm.setData({
            expense_category_id: String(row.expense_category_id),
            description: row.description,
            note: row.note ?? '',
            amount: row.amount,
            kind: row.kind,
            is_active: row.is_active,
            end_year: row.end_month !== null && row.end_year !== null ? String(row.end_year) : '',
            end_month: row.end_month !== null && row.end_year !== null ? String(row.end_month) : '',
            redirect_year: String(defaultYear),
            redirect_month: String(defaultMonth),
        });
        templateEditForm.clearErrors();
        setTemplateEditCategoryPickerOpen(false);
        setRecurringTemplateEditOpen(true);
    }

    function closeRecurringTemplateEdit(): void {
        setRecurringTemplateEditOpen(false);
        setEditingRecurringTemplate(null);
        setTemplateEditCategoryPickerOpen(false);
        templateEditForm.reset();
    }

    function submitTemplateEdit(e: React.FormEvent): void {
        e.preventDefault();
        if (editingRecurringTemplate === null) {
            return;
        }
        templateEditForm.put(`/upcoming-expense-recurring-templates/${editingRecurringTemplate.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                closeRecurringTemplateEdit();
            },
        });
    }

    function performDeleteRecurringTemplate(): void {
        if (deletingRecurringTemplate === null) {
            return;
        }
        setDeleteTemplateSubmitting(true);
        router.delete(`/upcoming-expense-recurring-templates/${deletingRecurringTemplate.id}`, {
            preserveScroll: true,
            data: {
                redirect_year: defaultYear,
                redirect_month: defaultMonth,
            },
            onFinish: () => {
                setDeleteTemplateSubmitting(false);
                setDeletingRecurringTemplate(null);
            },
        });
    }

    const plannedMonthHref = `/upcoming-expenses?year=${defaultYear}&month=${defaultMonth}`;

    return (
        <AppDashboardLayout
            title={
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <HomeMonthPicker
                        viewYear={defaultYear}
                        viewMonth={defaultMonth}
                        navigatePath="/upcoming-expenses/recurring"
                        allowFutureMonths
                        monthPickerAriaLabel={t('upcoming_expenses.recurring.default_month_picker_aria')}
                    />
                </div>
            }
        >
            <Head title={t('upcoming_expenses.recurring.head_title')} />
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{t('upcoming_expenses.recurring.section_intro')}</p>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={plannedMonthHref}>{t('upcoming_expenses.recurring.back_to_planned')}</Link>
                    </Button>
                </div>

                <section className="rounded-xl border bg-card p-3 text-card-foreground shadow-sm sm:p-4">
                    <h3 className="text-sm font-medium text-foreground">{t('upcoming_expenses.recurring.add_heading')}</h3>
                    <form onSubmit={submitRecurring} className="mt-3 flex flex-col gap-3">
                        <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-end lg:gap-2 xl:gap-3">
                            <div className="flex w-full min-w-0 flex-col gap-0.5 lg:w-[14rem] lg:max-w-[14rem] lg:flex-shrink-0">
                                <label htmlFor="recurring_category_trigger" className={compactLabelClass()}>
                                    {t('expenses.category_label')}
                                </label>
                                <Button
                                    type="button"
                                    id="recurring_category_trigger"
                                    variant="outline"
                                    className="h-9 w-full justify-start gap-2 px-2.5 font-normal"
                                    onClick={() => setRecurringCategoryPickerOpen(true)}
                                    aria-expanded={recurringCategoryPickerOpen}
                                    aria-haspopup="dialog"
                                    aria-invalid={recurringForm.errors.expense_category_id ? true : undefined}
                                    aria-required
                                    aria-label={
                                        recurringSelectedCategory
                                            ? `${t('expenses.category_label')}: ${recurringSelectedCategory.name}. ${t(
                                                  'expenses.open_category_picker_aria',
                                              )}`
                                            : t('expenses.open_category_picker_aria')
                                    }
                                >
                                    <Tags className="size-4 shrink-0 opacity-70" aria-hidden />
                                    {recurringSelectedCategory ? (
                                        <>
                                            <ExpenseCategoryIcon
                                                name={recurringSelectedCategory.icon ?? DEFAULT_EXPENSE_CATEGORY_ICON}
                                                className="size-4 shrink-0 text-muted-foreground"
                                            />
                                            <span className="min-w-0 flex-1 truncate text-left text-sm">
                                                {recurringSelectedCategory.name}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="min-w-0 flex-1 truncate text-left text-sm text-muted-foreground">
                                            {t('expenses.category_placeholder')}
                                        </span>
                                    )}
                                    <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
                                </Button>
                                <FieldError message={recurringForm.errors.expense_category_id} />
                                <ExpenseCategorySelectDialog
                                    open={recurringCategoryPickerOpen}
                                    onOpenChange={setRecurringCategoryPickerOpen}
                                    defaultCategories={defaultCategories}
                                    myCategories={myCategories}
                                    selectedId={recurringForm.data.expense_category_id}
                                    onSelect={(id) => {
                                        recurringForm.setData('expense_category_id', String(id));
                                        queueMicrotask(() => recurringAmountRef.current?.focus());
                                    }}
                                    title={t('expenses.category_picker_title')}
                                    closeAriaLabel={t('expense_categories.close_dialog')}
                                />
                            </div>
                            <div className="flex w-full min-w-0 flex-1 flex-col gap-0.5 lg:min-w-[9rem]">
                                <label htmlFor="recurring_description" className={compactLabelClass()}>
                                    {t('upcoming_expenses.description_label')}
                                </label>
                                <TextInput
                                    id="recurring_description"
                                    className="h-9 min-w-0 w-full py-1.5"
                                    value={recurringForm.data.description}
                                    onChange={(e) => recurringForm.setData('description', e.target.value)}
                                    required
                                    autoComplete="off"
                                />
                                <FieldError message={recurringForm.errors.description} />
                            </div>
                            <div className="flex w-full min-w-0 flex-col gap-0.5 lg:w-[11.5rem] lg:flex-shrink-0 lg:flex-grow-0">
                                <label htmlFor="recurring_amount" className={compactLabelClass()}>
                                    {t('upcoming_expenses.amount_label')}
                                </label>
                                <NumericFormat
                                    getInputRef={recurringAmountRef}
                                    customInput={TextInput}
                                    id="recurring_amount"
                                    inputMode="decimal"
                                    allowNegative={false}
                                    prefix="$ "
                                    thousandSeparator={amountThousandSeparator}
                                    decimalSeparator={amountDecimalSeparator}
                                    decimalScale={2}
                                    value={recurringForm.data.amount}
                                    onValueChange={(values) => {
                                        recurringForm.setData('amount', values.value);
                                    }}
                                    placeholder={t('upcoming_expenses.amount_placeholder')}
                                    className="h-9 py-1.5"
                                    required
                                />
                                <FieldError message={recurringForm.errors.amount} />
                            </div>
                            <div className="flex w-full min-w-0 flex-1 flex-col gap-0.5 lg:min-w-[9rem]">
                                <label htmlFor="recurring_note" className={compactLabelClass()}>
                                    <span>{t('upcoming_expenses.note_label')}</span>{' '}
                                    <span className="font-normal text-muted-foreground">
                                        {t('upcoming_expenses.optional_suffix')}
                                    </span>
                                </label>
                                <textarea
                                    ref={recurringNoteTextareaRef}
                                    id="recurring_note"
                                    rows={1}
                                    value={recurringForm.data.note}
                                    onChange={(e) => recurringForm.setData('note', e.target.value)}
                                    placeholder={t('upcoming_expenses.note_placeholder')}
                                    autoComplete="off"
                                    className={cn(
                                        'box-border min-h-9 w-full min-w-0 resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm leading-5 outline-none transition-colors',
                                        'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30',
                                    )}
                                />
                                <FieldError message={recurringForm.errors.note} />
                            </div>
                            <div className="flex w-full min-w-0 flex-col gap-0.5 lg:w-[9rem] lg:flex-shrink-0 lg:flex-grow-0 xl:w-[9.5rem]">
                                <label htmlFor="recurring_kind" className={compactLabelClass()}>
                                    {t('upcoming_expenses.kind_label')}
                                </label>
                                <Select
                                    value={recurringForm.data.kind}
                                    onValueChange={(value) => {
                                        if (value === 'fixed' || value === 'variable') {
                                            recurringForm.setData('kind', value);
                                        }
                                    }}
                                >
                                    <SelectTrigger
                                        id="recurring_kind"
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
                                <FieldError message={recurringForm.errors.kind} />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-end gap-3">
                            <RecurringPlanMonthField
                                label={t('upcoming_expenses.recurring.start_label')}
                                yearStr={recurringForm.data.start_year}
                                monthStr={recurringForm.data.start_month}
                                onYearMonthChange={(y, m) => {
                                    recurringForm.setData('start_year', y);
                                    recurringForm.setData('start_month', m);
                                }}
                                inclusiveMinYearMonth={recurringStartInclusiveMin}
                                fallbackDisplayMonth={planMonthFallback}
                                buttonAriaLabel={t('upcoming_expenses.recurring.plan_month_start_aria')}
                                errorYear={recurringForm.errors.start_year}
                                errorMonth={recurringForm.errors.start_month}
                            />
                            <RecurringPlanMonthField
                                label={t('upcoming_expenses.recurring.end_label')}
                                yearStr={recurringForm.data.end_year}
                                monthStr={recurringForm.data.end_month}
                                onYearMonthChange={(y, m) => {
                                    recurringForm.setData('end_year', y);
                                    recurringForm.setData('end_month', m);
                                }}
                                optional
                                inclusiveMinYearMonth={recurringEndInclusiveMin}
                                fallbackDisplayMonth={planMonthFallback}
                                buttonAriaLabel={t('upcoming_expenses.recurring.plan_month_end_aria')}
                                errorYear={recurringForm.errors.end_year}
                                errorMonth={recurringForm.errors.end_month}
                            />
                            <PrimaryButton
                                type="submit"
                                disabled={recurringForm.processing}
                                className="h-9 min-w-[6.5rem] font-medium"
                            >
                                {recurringForm.processing ? t('upcoming_expenses.submitting') : t('upcoming_expenses.submit')}
                            </PrimaryButton>
                        </div>
                    </form>
                </section>

                <section className="flex flex-col gap-3" aria-label={t('upcoming_expenses.recurring.template_list_aria')}>
                    <h3 className="text-sm font-medium text-foreground">{t('upcoming_expenses.recurring.list_heading')}</h3>
                    <ul className="m-0 flex min-w-0 max-w-full list-none flex-col gap-1.5 p-0">
                        {recurringTemplates.map((rt) => (
                            <li key={rt.id}>
                                <RecurringTemplateListItem
                                    row={rt}
                                    planPeriodLabel={[
                                        formatPlanMonth(locale, rt.start_year, rt.start_month),
                                        rt.end_year !== null && rt.end_month !== null
                                            ? ` · ${t('upcoming_expenses.recurring.end_label')}: ${formatPlanMonth(locale, rt.end_year, rt.end_month)}`
                                            : '',
                                    ].join('')}
                                    onEdit={openRecurringTemplateEdit}
                                    onDelete={setDeletingRecurringTemplate}
                                />
                            </li>
                        ))}
                    </ul>
                    {recurringTemplates.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border/60 bg-muted/5 px-4 py-6 text-center text-sm text-muted-foreground">
                            {t('upcoming_expenses.recurring.empty')}
                        </p>
                    ) : null}
                </section>
            </div>

            <Dialog
                open={recurringTemplateEditOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeRecurringTemplateEdit();
                    }
                }}
            >
                <DialogContent className="max-w-lg" closeAriaLabel={t('expense_categories.close_dialog')}>
                    <DialogHeader>
                        <DialogTitle>{t('upcoming_expenses.recurring.edit_template_heading')}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {t('upcoming_expenses.recurring.edit_template_heading')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitTemplateEdit} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="edit_template_category_trigger" className={compactLabelClass()}>
                                {t('expenses.category_label')}
                            </label>
                            <Button
                                type="button"
                                id="edit_template_category_trigger"
                                variant="outline"
                                className="h-9 w-full justify-start gap-2 px-2.5 font-normal"
                                onClick={() => setTemplateEditCategoryPickerOpen(true)}
                                aria-expanded={templateEditCategoryPickerOpen}
                                aria-haspopup="dialog"
                                aria-required
                                aria-label={
                                    templateEditSelectedCategory
                                        ? `${t('expenses.category_label')}: ${templateEditSelectedCategory.name}. ${t(
                                              'expenses.open_category_picker_aria',
                                          )}`
                                        : t('expenses.open_category_picker_aria')
                                }
                                aria-invalid={templateEditForm.errors.expense_category_id ? true : undefined}
                            >
                                <Tags className="size-4 shrink-0 opacity-70" aria-hidden />
                                {templateEditSelectedCategory ? (
                                    <>
                                        <ExpenseCategoryIcon
                                            name={templateEditSelectedCategory.icon ?? DEFAULT_EXPENSE_CATEGORY_ICON}
                                            className="size-4 shrink-0 text-muted-foreground"
                                        />
                                        <span className="min-w-0 flex-1 truncate text-left text-sm">
                                            {templateEditSelectedCategory.name}
                                        </span>
                                    </>
                                ) : (
                                    <span className="min-w-0 flex-1 truncate text-left text-sm text-muted-foreground">
                                        {t('expenses.category_placeholder')}
                                    </span>
                                )}
                                <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
                            </Button>
                            <FieldError message={templateEditForm.errors.expense_category_id} />
                            <ExpenseCategorySelectDialog
                                open={templateEditCategoryPickerOpen}
                                onOpenChange={setTemplateEditCategoryPickerOpen}
                                defaultCategories={defaultCategories}
                                myCategories={myCategories}
                                selectedId={templateEditForm.data.expense_category_id}
                                onSelect={(id) => {
                                    templateEditForm.setData('expense_category_id', String(id));
                                    queueMicrotask(() => templateEditAmountRef.current?.focus());
                                }}
                                title={t('expenses.category_picker_title')}
                                closeAriaLabel={t('expense_categories.close_dialog')}
                            />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="edit_template_description" className={compactLabelClass()}>
                                {t('upcoming_expenses.description_label')}
                            </label>
                            <TextInput
                                id="edit_template_description"
                                className="h-9 py-1.5"
                                value={templateEditForm.data.description}
                                onChange={(e) => templateEditForm.setData('description', e.target.value)}
                                required
                                autoComplete="off"
                            />
                            <FieldError message={templateEditForm.errors.description} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="edit_template_amount" className={compactLabelClass()}>
                                {t('upcoming_expenses.amount_label')}
                            </label>
                            <NumericFormat
                                getInputRef={templateEditAmountRef}
                                customInput={TextInput}
                                id="edit_template_amount"
                                inputMode="decimal"
                                allowNegative={false}
                                prefix="$ "
                                thousandSeparator={amountThousandSeparator}
                                decimalSeparator={amountDecimalSeparator}
                                decimalScale={2}
                                value={templateEditForm.data.amount}
                                onValueChange={(values) => {
                                    templateEditForm.setData('amount', values.value);
                                }}
                                placeholder={t('upcoming_expenses.amount_placeholder')}
                                className="h-9 py-1.5"
                                required
                            />
                            <FieldError message={templateEditForm.errors.amount} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="edit_template_note" className={compactLabelClass()}>
                                <span>{t('upcoming_expenses.note_label')}</span>{' '}
                                <span className="font-normal text-muted-foreground">
                                    {t('upcoming_expenses.optional_suffix')}
                                </span>
                            </label>
                            <textarea
                                ref={templateEditNoteTextareaRef}
                                id="edit_template_note"
                                rows={1}
                                value={templateEditForm.data.note}
                                onChange={(e) => templateEditForm.setData('note', e.target.value)}
                                placeholder={t('upcoming_expenses.note_placeholder')}
                                autoComplete="off"
                                className={cn(
                                    'box-border min-h-9 w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm leading-5 outline-none transition-colors',
                                    'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30',
                                )}
                            />
                            <FieldError message={templateEditForm.errors.note} />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="flex min-w-0 flex-col gap-0.5">
                                <label htmlFor="edit_template_kind" className={compactLabelClass()}>
                                    {t('upcoming_expenses.kind_label')}
                                </label>
                                <Select
                                    value={templateEditForm.data.kind}
                                    onValueChange={(value) => {
                                        if (value === 'fixed' || value === 'variable') {
                                            templateEditForm.setData('kind', value);
                                        }
                                    }}
                                >
                                    <SelectTrigger id="edit_template_kind" className={INLINE_FORM_SELECT_TRIGGER_CLASS}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fixed">{t('upcoming_expenses.kind_fixed')}</SelectItem>
                                        <SelectItem value="variable">{t('upcoming_expenses.kind_variable')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError message={templateEditForm.errors.kind} />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label htmlFor="edit_template_status" className={compactLabelClass()}>
                                    {t('upcoming_expenses.recurring.template_status_label')}
                                </label>
                                <Select
                                    value={templateEditForm.data.is_active ? 'active' : 'paused'}
                                    onValueChange={(value) => {
                                        templateEditForm.setData('is_active', value === 'active');
                                    }}
                                >
                                    <SelectTrigger id="edit_template_status" className={INLINE_FORM_SELECT_TRIGGER_CLASS}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{t('upcoming_expenses.recurring.active')}</SelectItem>
                                        <SelectItem value="paused">{t('upcoming_expenses.recurring.paused')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError message={templateEditForm.errors.is_active} />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-end gap-2">
                            <RecurringPlanMonthField
                                label={t('upcoming_expenses.recurring.end_label')}
                                yearStr={templateEditForm.data.end_year}
                                monthStr={templateEditForm.data.end_month}
                                onYearMonthChange={(y, m) => {
                                    templateEditForm.setData('end_year', y);
                                    templateEditForm.setData('end_month', m);
                                }}
                                optional
                                inclusiveMinYearMonth={templateEditEndInclusiveMin}
                                fallbackDisplayMonth={templateEditPlanMonthFallback}
                                buttonAriaLabel={t('upcoming_expenses.recurring.plan_month_end_aria')}
                                errorYear={templateEditForm.errors.end_year}
                                errorMonth={templateEditForm.errors.end_month}
                            />
                        </div>
                        <DialogFooter className="gap-2 sm:gap-3">
                            <Button type="button" variant="outline" onClick={() => closeRecurringTemplateEdit()}>
                                {t('expense_categories.cancel')}
                            </Button>
                            <Button type="submit" disabled={templateEditForm.processing}>
                                {templateEditForm.processing
                                    ? t('upcoming_expenses.edit_submitting')
                                    : t('upcoming_expenses.edit_save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deletingRecurringTemplate !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingRecurringTemplate(null);
                    }
                }}
            >
                <DialogContent closeAriaLabel={t('expense_categories.close_dialog')}>
                    <DialogHeader>
                        <DialogTitle>{t('upcoming_expenses.recurring.delete_template_title')}</DialogTitle>
                        <DialogDescription>{t('upcoming_expenses.recurring.delete_template_description')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={deleteTemplateSubmitting}
                            onClick={() => setDeletingRecurringTemplate(null)}
                        >
                            {t('expense_categories.cancel')}
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={deleteTemplateSubmitting}
                            onClick={() => performDeleteRecurringTemplate()}
                        >
                            {deleteTemplateSubmitting
                                ? t('upcoming_expenses.deleting')
                                : t('upcoming_expenses.recurring.delete_template_confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppDashboardLayout>
    );
}
