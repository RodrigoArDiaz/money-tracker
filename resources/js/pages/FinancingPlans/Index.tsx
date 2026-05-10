import { Head, router, useForm } from '@inertiajs/react';
import * as React from 'react';
import { NumericFormat } from 'react-number-format';
import { ChevronDown, Plus, Tags, X } from 'lucide-react';

import FieldError from '@/components/atoms/FieldError';
import TextInput from '@/components/atoms/TextInput';
import AppDashboardLayout from '@/components/layouts/AppDashboardLayout';
import { ExpenseCategorySelectDialog } from '@/components/molecules/ExpenseCategorySelectDialog';
import { FinancingPlanListItem } from '@/components/molecules/FinancingPlanListItem';
import { RecurringPlanMonthField } from '@/components/molecules/RecurringPlanMonthField';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ButtonGroup } from '@/components/ui/button-group';
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
import { useAutosizeTextarea } from '@/hooks/use-autosize-textarea';
import { useTranslate } from '@/hooks/use-translate';
import { DEFAULT_EXPENSE_CATEGORY_ICON } from '@/lib/expense-card-surface';
import { ExpenseCategoryIcon } from '@/lib/expense-category-icons';
import { cn } from '@/lib/utils';

type CategoryOption = {
    id: number;
    name: string;
    icon: string | null;
};

type PlanRow = {
    id: number;
    description: string;
    note: string | null;
    total_amount: string;
    installments_count: number;
    expense_category_id: number;
    category_name: string;
    category_icon: string | null;
};

type CreationMode = 'total_and_count' | 'custom_schedule';

type InstallmentRow = { year: string; month: string; amount: string };

function calendarNowYearMonth(): { y: number; m: number } {
    const d = new Date();

    return { y: d.getFullYear(), m: d.getMonth() + 1 };
}

function installmentRowFallbackDate(row: InstallmentRow, fallbackYear: number, fallbackMonth: number): Date {
    const y = Number.parseInt(row.year, 10);
    const m = Number.parseInt(row.month, 10);
    if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12 && y >= 2000 && y <= 2100) {
        return new Date(y, m - 1, 1);
    }

    return new Date(fallbackYear, fallbackMonth - 1, 1);
}

/** Interpreta el texto del NumericFormat según locale (es: miles `.`, decimal `,`). */
function parseAmountForValidation(raw: string, locale: string): number {
    const s = raw.trim();
    if (s === '') {
        return Number.NaN;
    }
    if (locale === 'es') {
        return Number.parseFloat(s.replace(/\./g, '').replace(',', '.'));
    }

    return Number.parseFloat(s.replace(/,/g, ''));
}

function compactLabelClass(): string {
    return 'mb-0.5 block text-xs font-medium text-muted-foreground';
}

type ListFilter = 'active' | 'archived';

export default function FinancingPlansIndex({
    defaultYear,
    defaultMonth,
    listFilter,
    myCategories,
    defaultCategories,
    plans,
}: {
    defaultYear: number;
    defaultMonth: number;
    listFilter: ListFilter;
    myCategories: CategoryOption[];
    defaultCategories: CategoryOption[];
    plans: PlanRow[];
}) {
    const { t, locale } = useTranslate();
    const amountThousandSeparator = locale === 'es' ? '.' : ',';
    const amountDecimalSeparator = locale === 'es' ? ',' : '.';

    const allCategoryOptions = React.useMemo(
        () => [...myCategories, ...defaultCategories],
        [myCategories, defaultCategories],
    );

    const planForm = useForm({
        creation_mode: 'total_and_count' as CreationMode,
        description: '',
        note: '',
        expense_category_id: '',
        total_amount: '',
        installment_count: '3',
        start_year: String(defaultYear),
        start_month: String(defaultMonth),
        installments: [{ year: String(defaultYear), month: String(defaultMonth), amount: '' }] as InstallmentRow[],
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
        planForm.setData('start_year', String(sy));
        planForm.setData('start_month', String(sm));
        planForm.setData('redirect_year', String(defaultYear));
        planForm.setData('redirect_month', String(defaultMonth));
        planForm.setData(
            'installments',
            [{ year: String(defaultYear), month: String(defaultMonth), amount: '' }],
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultYear, defaultMonth]);

    const recurringStartInclusiveMin = calendarNowYearMonth();
    const planMonthFallback = React.useMemo(
        () => new Date(defaultYear, defaultMonth - 1, 1),
        [defaultYear, defaultMonth],
    );

    const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
    const [categoryPickerOpen, setCategoryPickerOpen] = React.useState(false);
    const [deletingPlan, setDeletingPlan] = React.useState<PlanRow | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = React.useState(false);

    const planNoteTextareaRef = useAutosizeTextarea(planForm.data.note, {
        maxHeightPx: 280,
        enabled: createDialogOpen,
    });

    const selectedCategory = React.useMemo(() => {
        const raw = planForm.data.expense_category_id;
        if (raw === '') {
            return null;
        }
        const id = Number(raw);

        return allCategoryOptions.find((c) => c.id === id) ?? null;
    }, [planForm.data.expense_category_id, allCategoryOptions]);

    function openCreateDialog(): void {
        planForm.clearErrors();
        setCategoryPickerOpen(false);
        setCreateDialogOpen(true);
    }

    function closeCreateDialog(): void {
        setCreateDialogOpen(false);
        setCategoryPickerOpen(false);
        planForm.clearErrors();
        planForm.setData('description', '');
        planForm.setData('note', '');
        planForm.setData('total_amount', '');
        planForm.setData('installment_count', '3');
        planForm.setData('creation_mode', 'total_and_count');
        planForm.setData('expense_category_id', '');
        planForm.setData('installments', [
            { year: String(defaultYear), month: String(defaultMonth), amount: '' },
        ]);
    }

    function addCustomRow(): void {
        planForm.setData('installments', [
            ...planForm.data.installments,
            { year: String(defaultYear), month: String(defaultMonth), amount: '' },
        ]);
    }

    function removeCustomRow(index: number): void {
        const next = planForm.data.installments.filter((_, i) => i !== index);
        planForm.setData('installments', next.length > 0 ? next : [{ year: String(defaultYear), month: String(defaultMonth), amount: '' }]);
    }

    function submitPlan(e: React.FormEvent): void {
        e.preventDefault();
        planForm.clearErrors();

        const d = planForm.data;
        const nextErrors: Record<string, string> = {};

        if (d.description.trim() === '') {
            nextErrors.description = t('financing_plans.validation.client_description_required');
        }
        if (d.expense_category_id === '') {
            nextErrors.expense_category_id = t('financing_plans.validation.client_category_required');
        }

        if (d.creation_mode === 'total_and_count') {
            const totalNum = parseAmountForValidation(d.total_amount, locale);
            if (!Number.isFinite(totalNum) || totalNum < 0.01) {
                nextErrors.total_amount = t('financing_plans.validation.client_total_invalid');
            }
            const ic = Number.parseInt(String(d.installment_count).trim(), 10);
            if (!Number.isFinite(ic) || ic < 1 || ic > 600) {
                nextErrors.installment_count = t('financing_plans.validation.client_installment_count_invalid');
            }
            const sy = Number.parseInt(d.start_year, 10);
            const sm = Number.parseInt(d.start_month, 10);
            if (!Number.isFinite(sy) || !Number.isFinite(sm) || sm < 1 || sm > 12 || sy < 2000 || sy > 2100) {
                nextErrors.start_month = t('financing_plans.validation.client_start_month_invalid');
            }
        } else {
            for (let i = 0; i < d.installments.length; i++) {
                const row = d.installments[i];
                const amt = parseAmountForValidation(row.amount, locale);
                if (!Number.isFinite(amt) || amt < 0.01) {
                    nextErrors[`installments.${i}.amount`] = t('financing_plans.validation.client_row_amount_invalid');
                }
                const y = Number.parseInt(row.year, 10);
                const m = Number.parseInt(row.month, 10);
                if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12 || y < 2000 || y > 2100) {
                    nextErrors[`installments.${i}.month`] = t('financing_plans.validation.client_row_month_invalid');
                }
            }

            const seen = new Set<number>();
            let duplicateMonth = false;
            for (const row of d.installments) {
                const y = Number.parseInt(row.year, 10);
                const m = Number.parseInt(row.month, 10);
                if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
                    continue;
                }
                const key = y * 12 + m;
                if (seen.has(key)) {
                    duplicateMonth = true;
                    break;
                }
                seen.add(key);
            }
            if (duplicateMonth) {
                nextErrors.installments = t('financing_plans.validation.duplicate_installment_month');
            }
        }

        if (Object.keys(nextErrors).length > 0) {
            planForm.setError(nextErrors as Parameters<typeof planForm.setError>[0]);
            return;
        }

        planForm.post('/financing-plans', {
            preserveScroll: true,
            onSuccess: () => {
                planForm.reset('description', 'note', 'total_amount');
                planForm.setData('expense_category_id', '');
                planForm.setData('installment_count', '3');
                planForm.setData('installments', [
                    { year: String(defaultYear), month: String(defaultMonth), amount: '' },
                ]);
                setCreateDialogOpen(false);
            },
        });
    }

    function financingPlansRedirectPayload(): {
        redirect_year: number;
        redirect_month: number;
        filter?: 'archived';
    } {
        return {
            redirect_year: defaultYear,
            redirect_month: defaultMonth,
            ...(listFilter === 'archived' ? { filter: 'archived' as const } : {}),
        };
    }

    function performDeletePlan(): void {
        if (deletingPlan === null) {
            return;
        }
        setDeleteSubmitting(true);
        router.delete(`/financing-plans/${deletingPlan.id}`, {
            preserveScroll: true,
            data: financingPlansRedirectPayload(),
            onFinish: () => {
                setDeleteSubmitting(false);
                setDeletingPlan(null);
            },
        });
    }

    function archivePlan(plan: PlanRow): void {
        router.post(`/financing-plans/${plan.id}/archive`, financingPlansRedirectPayload(), {
            preserveScroll: true,
        });
    }

    function unarchivePlan(plan: PlanRow): void {
        router.post(`/financing-plans/${plan.id}/unarchive`, financingPlansRedirectPayload(), {
            preserveScroll: true,
        });
    }

    return (
        <AppDashboardLayout title={t('financing_plans.layout_title')}>
            <Head title={t('financing_plans.head_title')} />
            <div className="space-y-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
                <div
                    className={cn(
                        'flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground shadow-sm',
                        'sm:flex-row sm:flex-nowrap sm:items-start sm:justify-between sm:gap-3 sm:p-4',
                    )}
                >
                    <div className="min-w-0 flex-1">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="intro">
                                <AccordionTrigger>{t('financing_plans.section_intro_accordion_label')}</AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-sm leading-relaxed text-muted-foreground">{t('financing_plans.section_intro')}</p>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        className="hidden h-9 shrink-0 gap-1.5 font-medium sm:inline-flex md:h-10"
                        onClick={() => openCreateDialog()}
                        aria-label={t('financing_plans.open_create_modal_aria')}
                    >
                        <Plus className="size-4 shrink-0" aria-hidden />
                        {t('financing_plans.new_plan_button')}
                    </Button>
                </div>

                <section className="flex flex-col gap-3" aria-label={t('financing_plans.list_heading')}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <h3 className="text-sm font-medium text-foreground">{t('financing_plans.list_heading')}</h3>
                        <ButtonGroup aria-label={t('financing_plans.filter_group_aria')}>
                            <Button
                                type="button"
                                size="sm"
                                variant={listFilter === 'active' ? 'default' : 'outline'}
                                className="h-9"
                                onClick={() =>
                                    router.get(
                                        '/financing-plans',
                                        { year: defaultYear, month: defaultMonth },
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                {t('financing_plans.filter_active')}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={listFilter === 'archived' ? 'default' : 'outline'}
                                className="h-9"
                                onClick={() =>
                                    router.get(
                                        '/financing-plans',
                                        {
                                            year: defaultYear,
                                            month: defaultMonth,
                                            filter: 'archived',
                                        },
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                {t('financing_plans.filter_archived')}
                            </Button>
                        </ButtonGroup>
                    </div>
                    {plans.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border/60 bg-muted/5 px-4 py-6 text-center text-sm text-muted-foreground">
                            {listFilter === 'archived' ? t('financing_plans.empty_archived') : t('financing_plans.empty')}
                        </p>
                    ) : (
                        <ul className="m-0 flex min-w-0 max-w-full list-none flex-col gap-1.5 p-0">
                            {plans.map((plan) => (
                                <li key={plan.id}>
                                    <FinancingPlanListItem
                                        plan={plan}
                                        listFilter={listFilter}
                                        onArchive={archivePlan}
                                        onUnarchive={unarchivePlan}
                                        onDeleteRequest={setDeletingPlan}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            <MobileFab
                onClick={() => openCreateDialog()}
                aria-label={t('financing_plans.open_create_modal_aria')}
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
                    closeAriaLabel={t('financing_plans.close_dialog')}
                >
                    <DialogHeader>
                        <DialogTitle>{t('financing_plans.create_modal_title')}</DialogTitle>
                        <DialogDescription className="sr-only">{t('financing_plans.section_intro')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitPlan} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1 w-full">
                            <span className={compactLabelClass()}>{t('financing_plans.creation_mode_label')}</span>
                            <ButtonGroup className="w-full" aria-label={t('financing_plans.creation_mode_label')}>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={planForm.data.creation_mode === 'total_and_count' ? 'default' : 'outline'}
                                    className="h-9 max-sm:min-w-0 max-sm:shrink max-sm:basis-0 max-sm:flex-1"
                                    onClick={() => {
                                        planForm.setData('creation_mode', 'total_and_count');
                                        planForm.clearErrors();
                                    }}
                                >
                                    {t('financing_plans.creation_mode_total')}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={planForm.data.creation_mode === 'custom_schedule' ? 'default' : 'outline'}
                                    className="h-9 max-sm:min-w-0 max-sm:shrink max-sm:basis-0 max-sm:flex-1"
                                    onClick={() => {
                                        planForm.setData('creation_mode', 'custom_schedule');
                                        planForm.clearErrors();
                                    }}
                                >
                                    {t('financing_plans.creation_mode_custom')}
                                </Button>
                            </ButtonGroup>
                        </div>

                        {planForm.data.creation_mode === 'total_and_count' ? (
                            <>
                                <div className="flex flex-col gap-3">
                                    <p className="text-xs text-muted-foreground">{t('financing_plans.total_and_count_help')}</p>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <label htmlFor="financing_total" className={compactLabelClass()}>
                                        {t('financing_plans.total_amount_label')}
                                    </label>
                                    <NumericFormat
                                        id="financing_total"
                                        customInput={TextInput}
                                        value={planForm.data.total_amount}
                                        onValueChange={(vals) => planForm.setData('total_amount', vals.value)}
                                        thousandSeparator={amountThousandSeparator}
                                        decimalSeparator={amountDecimalSeparator}
                                        decimalScale={2}
                                        fixedDecimalScale={false}
                                        allowNegative={false}
                                        aria-invalid={planForm.errors.total_amount ? true : undefined}
                                    />
                                    <FieldError message={planForm.errors.total_amount} />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <label htmlFor="financing_count" className={compactLabelClass()}>
                                        {t('financing_plans.installment_count_label')}
                                    </label>
                                    <TextInput
                                        id="financing_count"
                                        inputMode="numeric"
                                        value={planForm.data.installment_count}
                                        onChange={(e) => planForm.setData('installment_count', e.target.value)}
                                        aria-invalid={planForm.errors.installment_count ? true : undefined}
                                    />
                                    <FieldError message={planForm.errors.installment_count} />
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-xs text-muted-foreground">{t('financing_plans.custom_rows_help')}</p>
                                <div className="flex flex-col gap-3">
                                    {planForm.data.installments.map((row, index) => (
                                        <div
                                            key={index}
                                            className="flex flex-col gap-3 rounded-lg border border-border/80 p-3"
                                            aria-label={t('financing_plans.installment_row_aria', { index: index + 1 })}
                                        >
                                            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <RecurringPlanMonthField
                                                        label={t('financing_plans.installment_month_label')}
                                                        yearStr={row.year}
                                                        monthStr={row.month}
                                                        onYearMonthChange={(y, m) => {
                                                            const next = [...planForm.data.installments];
                                                            next[index] = { ...next[index], year: y, month: m };
                                                            planForm.setData('installments', next);
                                                            planForm.clearErrors('installments');
                                                        }}
                                                        fallbackDisplayMonth={installmentRowFallbackDate(
                                                            row,
                                                            defaultYear,
                                                            defaultMonth,
                                                        )}
                                                        buttonAriaLabel={t('financing_plans.installment_month_row_aria', {
                                                            index: index + 1,
                                                        })}
                                                        errorYear={planForm.errors[`installments.${index}.year`]}
                                                        errorMonth={planForm.errors[`installments.${index}.month`]}
                                                        inclusiveMinYearMonth={recurringStartInclusiveMin}
                                                    />
                                                </div>
                                                <div className="flex w-full min-w-0 flex-col gap-0.5 sm:max-w-[12rem]">
                                                    <span className={compactLabelClass()}>{t('financing_plans.row_amount_label')}</span>
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <NumericFormat
                                                            customInput={TextInput}
                                                            className="h-9 min-w-0 flex-1"
                                                            value={row.amount}
                                                            onValueChange={(vals) => {
                                                                const next = [...planForm.data.installments];
                                                                next[index] = { ...next[index], amount: vals.value };
                                                                planForm.setData('installments', next);
                                                            }}
                                                            thousandSeparator={amountThousandSeparator}
                                                            decimalSeparator={amountDecimalSeparator}
                                                            decimalScale={2}
                                                            allowNegative={false}
                                                        />
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="size-9 shrink-0"
                                                                    onClick={() => removeCustomRow(index)}
                                                                    aria-label={t('financing_plans.remove_installment_row')}
                                                                >
                                                                    <X className="size-4" aria-hidden />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" sideOffset={4}>
                                                                {t('financing_plans.remove_installment_row')}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <FieldError message={planForm.errors[`installments.${index}.amount`]} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {typeof planForm.errors.installments === 'string' ? (
                                    <FieldError message={planForm.errors.installments} />
                                ) : null}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="self-start gap-2"
                                    onClick={() => addCustomRow()}
                                >
                                    <Plus className="size-4 shrink-0" aria-hidden />
                                    {t('financing_plans.add_installment_row')}
                                </Button>
                            </>
                        )}

                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="financing_category_trigger" className={compactLabelClass()}>
                                {t('expenses.category_label')}
                            </label>
                            <Button
                                type="button"
                                id="financing_category_trigger"
                                variant="outline"
                                className="h-9 w-full justify-start gap-2 px-2.5 font-normal"
                                onClick={() => setCategoryPickerOpen(true)}
                                aria-expanded={categoryPickerOpen}
                                aria-haspopup="dialog"
                                aria-invalid={planForm.errors.expense_category_id ? true : undefined}
                                aria-required={true}
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
                                        <span className="min-w-0 flex-1 truncate text-left text-sm">{selectedCategory.name}</span>
                                    </>
                                ) : (
                                    <span className="min-w-0 flex-1 truncate text-left text-sm text-muted-foreground">
                                        {t('expenses.category_placeholder')}
                                    </span>
                                )}
                                <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
                            </Button>
                            <FieldError message={planForm.errors.expense_category_id} />
                        </div>

                        <ExpenseCategorySelectDialog
                            open={categoryPickerOpen}
                            onOpenChange={setCategoryPickerOpen}
                            myCategories={myCategories}
                            defaultCategories={defaultCategories}
                            selectedId={planForm.data.expense_category_id}
                            onSelect={(id) => {
                                planForm.setData('expense_category_id', String(id));
                            }}
                            title={t('expenses.category_picker_title')}
                            closeAriaLabel={t('expense_categories.close_dialog')}
                        />

                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="financing_description" className={compactLabelClass()}>
                                {t('financing_plans.description_label')}
                            </label>
                            <TextInput
                                id="financing_description"
                                value={planForm.data.description}
                                onChange={(e) => planForm.setData('description', e.target.value)}
                                aria-invalid={planForm.errors.description ? true : undefined}
                                aria-required={true}
                                autoComplete="off"
                            />
                            <FieldError message={planForm.errors.description} />
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="financing_note" className={compactLabelClass()}>
                                {t('financing_plans.note_label')} <span className="font-normal text-muted-foreground">{t('upcoming_expenses.optional_suffix')}</span>
                            </label>
                            <textarea
                                id="financing_note"
                                ref={planNoteTextareaRef}
                                value={planForm.data.note}
                                onChange={(e) => planForm.setData('note', e.target.value)}
                                rows={2}
                                className="flex min-h-[2.5rem] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-invalid={planForm.errors.note ? true : undefined}
                            />
                            <FieldError message={planForm.errors.note} />
                        </div>

                        {planForm.data.creation_mode === 'total_and_count' ? (
                            <RecurringPlanMonthField
                                label={t('financing_plans.start_month_label')}
                                yearStr={planForm.data.start_year}
                                monthStr={planForm.data.start_month}
                                onYearMonthChange={(y, m) => {
                                    planForm.setData('start_year', y);
                                    planForm.setData('start_month', m);
                                }}
                                fallbackDisplayMonth={planMonthFallback}
                                buttonAriaLabel={t('financing_plans.start_month_aria')}
                                errorYear={planForm.errors.start_year}
                                errorMonth={planForm.errors.start_month}
                                inclusiveMinYearMonth={recurringStartInclusiveMin}
                            />
                        ) : null}

                        <DialogFooter className="gap-3">
                            <Button type="button" variant="outline" onClick={() => closeCreateDialog()}>
                                {t('financing_plans.close_dialog')}
                            </Button>
                            <Button type="submit" disabled={planForm.processing}>
                                {planForm.processing ? t('financing_plans.submitting') : t('financing_plans.submit')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deletingPlan !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingPlan(null);
                    }
                }}
            >
                <DialogContent className="max-w-md" closeAriaLabel={t('financing_plans.close_dialog')}>
                    <DialogHeader>
                        <DialogTitle>{t('financing_plans.delete_modal_title')}</DialogTitle>
                        <DialogDescription>{t('financing_plans.delete_modal_description')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3">
                        <Button type="button" variant="outline" onClick={() => setDeletingPlan(null)}>
                            {t('financing_plans.close_dialog')}
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={deleteSubmitting}
                            onClick={() => performDeletePlan()}
                        >
                            {deleteSubmitting ? t('financing_plans.deleting') : t('financing_plans.delete_confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppDashboardLayout>
    );
}
