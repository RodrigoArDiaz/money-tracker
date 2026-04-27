import { Head, useForm } from '@inertiajs/react';
import * as React from 'react';
import { NumericFormat } from 'react-number-format';

import FieldError from '@/components/atoms/FieldError';
import Label from '@/components/atoms/Label';
import PrimaryButton from '@/components/atoms/PrimaryButton';
import TextInput from '@/components/atoms/TextInput';
import AppDashboardLayout from '@/components/layouts/AppDashboardLayout';
import FormField from '@/components/molecules/FormField';
import { ExpenseCategorySelectDialog } from '@/components/molecules/ExpenseCategorySelectDialog';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/hooks/use-translate';
import { ExpenseCategoryIcon } from '@/lib/expense-category-icons';
import { Tags } from 'lucide-react';

type CategoryOption = {
    id: number;
    name: string;
    icon: string | null;
};

type ExpenseRow = {
    id: number;
    description: string;
    amount: string;
    category_name: string;
    category_icon: string | null;
};

const DEFAULT_CATEGORY_ICON = 'Tag';

function formatAmountDisplay(amount: string, locale: string): string {
    const n = Number.parseFloat(amount);
    if (Number.isNaN(n)) {
        return amount;
    }

    return new Intl.NumberFormat(locale === 'es' ? 'es' : 'en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
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

    const amountThousandSeparator = locale === 'es' ? '.' : ',';
    const amountDecimalSeparator = locale === 'es' ? ',' : '.';

    const form = useForm({
        expense_category_id: '',
        description: '',
        amount: '',
    });

    const [categoryPickerOpen, setCategoryPickerOpen] = React.useState(false);

    const selectedCategory = React.useMemo(() => {
        const raw = form.data.expense_category_id;
        if (raw === '') {
            return null;
        }
        const id = Number(raw);
        return [...myCategories, ...defaultCategories].find((c) => c.id === id) ?? null;
    }, [form.data.expense_category_id, myCategories, defaultCategories]);

    function submitExpense(e: React.FormEvent): void {
        e.preventDefault();
        form.post('/expenses', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
            },
        });
    }

    return (
        <AppDashboardLayout title={t('expenses.title')}>
            <Head title={t('expenses.head_title')} />
            <div className="space-y-8">
                <header>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                        {t('expenses.date_heading', { date: formattedDateLabel })}
                    </h1>
                </header>

                <section className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm md:p-6">
                    <h2 className="text-base font-semibold tracking-tight">{t('expenses.add_heading')}</h2>
                    <form onSubmit={submitExpense} className="mt-4 space-y-4">
                        <FormField
                            label={t('expenses.category_label')}
                            htmlFor="expense_category_trigger"
                            error={form.errors.expense_category_id}
                        >
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    id="expense_category_trigger"
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0"
                                    onClick={() => setCategoryPickerOpen(true)}
                                    aria-label={t('expenses.open_category_picker_aria')}
                                    aria-expanded={categoryPickerOpen}
                                    aria-haspopup="dialog"
                                    aria-invalid={form.errors.expense_category_id ? true : undefined}
                                    aria-required
                                >
                                    <Tags className="size-4" aria-hidden />
                                </Button>
                                {selectedCategory ? (
                                    <span className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-lg border border-border bg-muted/20 px-2.5 py-1 text-sm text-foreground">
                                        <ExpenseCategoryIcon
                                            name={selectedCategory.icon ?? DEFAULT_CATEGORY_ICON}
                                            className="size-4 shrink-0 text-muted-foreground"
                                        />
                                        <span className="truncate">{selectedCategory.name}</span>
                                    </span>
                                ) : (
                                    <span className="text-sm text-muted-foreground">
                                        {t('expenses.category_placeholder')}
                                    </span>
                                )}
                            </div>
                        </FormField>

                        <ExpenseCategorySelectDialog
                            open={categoryPickerOpen}
                            onOpenChange={setCategoryPickerOpen}
                            defaultCategories={defaultCategories}
                            myCategories={myCategories}
                            selectedId={form.data.expense_category_id}
                            onSelect={(id) => form.setData('expense_category_id', String(id))}
                            title={t('expenses.category_picker_title')}
                            closeAriaLabel={t('expense_categories.close_dialog')}
                        />

                        <FormField
                            label={t('expenses.description_label')}
                            htmlFor="expense_description"
                            error={form.errors.description}
                        >
                            <TextInput
                                id="expense_description"
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                placeholder={t('expenses.description_placeholder')}
                                autoComplete="off"
                                required
                            />
                        </FormField>

                        <div>
                            <Label htmlFor="expense_amount">{t('expenses.amount_label')}</Label>
                            <NumericFormat
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
                                className="mt-1.5"
                                required
                            />
                            <FieldError message={form.errors.amount} />
                        </div>

                        <PrimaryButton type="submit" disabled={form.processing}>
                            {form.processing ? t('expenses.submitting') : t('expenses.submit')}
                        </PrimaryButton>
                    </form>
                </section>

                <section className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm md:p-6">
                    <h2 className="text-base font-semibold tracking-tight">{t('expenses.today_list_heading')}</h2>
                    {expenses.length === 0 ? (
                        <p className="mt-4 text-sm text-muted-foreground">{t('expenses.empty_today')}</p>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full min-w-[20rem] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="pb-2 pr-3 font-medium">{t('expenses.list_description')}</th>
                                        <th className="pb-2 pr-3 font-medium">{t('expenses.list_category')}</th>
                                        <th className="pb-2 text-right font-medium">{t('expenses.list_amount')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map((row) => (
                                        <tr key={row.id} className="border-b border-border/60 last:border-0">
                                            <td className="py-2.5 pr-3 align-middle text-foreground">{row.description}</td>
                                            <td className="py-2.5 pr-3 align-middle">
                                                <span className="inline-flex items-center gap-2">
                                                    <ExpenseCategoryIcon
                                                        name={row.category_icon ?? DEFAULT_CATEGORY_ICON}
                                                        className="size-4 shrink-0 text-muted-foreground"
                                                    />
                                                    <span>{row.category_name}</span>
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-right align-middle tabular-nums text-foreground">
                                                {formatAmountDisplay(row.amount, locale)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </AppDashboardLayout>
    );
}
