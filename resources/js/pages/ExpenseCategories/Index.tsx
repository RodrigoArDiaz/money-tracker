import { Head, router, useForm } from '@inertiajs/react';
import * as React from 'react';

import FieldError from '@/components/atoms/FieldError';
import Label from '@/components/atoms/Label';
import PrimaryButton from '@/components/atoms/PrimaryButton';
import TextInput from '@/components/atoms/TextInput';
import AppDashboardLayout from '@/components/layouts/AppDashboardLayout';
import FormField from '@/components/molecules/FormField';
import { ExpenseCategoryIconGrid } from '@/components/molecules/ExpenseCategoryIconGrid';
import { ExpenseCategoryIconPickerDialog } from '@/components/molecules/ExpenseCategoryIconPickerDialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslate } from '@/hooks/use-translate';
import { ExpenseCategoryIcon, EXPENSE_CATEGORY_ICON_MAP } from '@/lib/expense-category-icons';
import { Pencil, Trash2 } from 'lucide-react';

type CategoryRow = {
    id: number;
    name: string;
    icon: string | null;
    expenses_count: number;
};

type DefaultCategoryRow = {
    id: number;
    name: string;
    icon: string;
};

const DEFAULT_CATEGORY_ICON = 'Tag';

const categoryGridClassName =
    'm-0 grid list-none justify-start gap-2.5 p-0 [grid-template-columns:repeat(auto-fill,minmax(6.25rem,7rem))]';

export default function Index({
    categories,
    defaultExpenseCategories,
    expenseCategoryIconNames,
}: {
    categories: CategoryRow[];
    defaultExpenseCategories: DefaultCategoryRow[];
    expenseCategoryIconNames: string[];
}) {
    const { t } = useTranslate();
    const [editingCategory, setEditingCategory] = React.useState<CategoryRow | null>(null);
    const [deletingCategory, setDeletingCategory] = React.useState<CategoryRow | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = React.useState(false);
    const [iconPickerOpen, setIconPickerOpen] = React.useState(false);

    const safeIconNames = React.useMemo(
        () => expenseCategoryIconNames.filter((n) => EXPENSE_CATEGORY_ICON_MAP[n] !== undefined),
        [expenseCategoryIconNames],
    );

    const createForm = useForm({
        name: '',
        icon: DEFAULT_CATEGORY_ICON,
    });

    const editForm = useForm({
        name: '',
        icon: DEFAULT_CATEGORY_ICON,
    });

    function openEdit(row: CategoryRow): void {
        editForm.clearErrors();
        editForm.setData('name', row.name);
        editForm.setData('icon', row.icon ?? DEFAULT_CATEGORY_ICON);
        setEditingCategory(row);
    }

    function closeEdit(): void {
        setEditingCategory(null);
        editForm.reset();
    }

    function submitCreate(e: React.FormEvent): void {
        e.preventDefault();
        createForm.post('/expense-categories', {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
        });
    }

    function submitEdit(e: React.FormEvent): void {
        e.preventDefault();
        if (editingCategory === null) {
            return;
        }
        editForm.put(`/expense-categories/${editingCategory.id}`, {
            preserveScroll: true,
            onSuccess: () => closeEdit(),
        });
    }

    function openDeleteModal(row: CategoryRow): void {
        closeEdit();
        setDeletingCategory(row);
    }

    function closeDeleteModal(): void {
        setDeletingCategory(null);
        setDeleteSubmitting(false);
    }

    function performDelete(): void {
        if (deletingCategory === null) {
            return;
        }
        setDeleteSubmitting(true);
        router.delete(`/expense-categories/${deletingCategory.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleteSubmitting(false);
                closeDeleteModal();
            },
        });
    }

    return (
        <AppDashboardLayout title={t('expense_categories.title')}>
            <Head title={t('expense_categories.head_title_index')} />
            <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
                {t('expense_categories.index_description')}
            </p>
            <section
                className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm md:p-5"
                aria-labelledby="expense-categories-add-heading"
            >
                <h2 id="expense-categories-add-heading" className="text-sm font-semibold tracking-tight">
                    {t('expense_categories.create_heading')}
                </h2>
                <form
                    onSubmit={submitCreate}
                    className="mt-4 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:gap-x-3 md:gap-y-2"
                >
                    <div className="min-w-0 w-full md:w-64 md:shrink-0">
                        <FormField
                            label={t('expense_categories.name_label')}
                            htmlFor="new-category-name"
                            error={createForm.errors.name}
                        >
                            <TextInput
                                id="new-category-name"
                                type="text"
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                autoComplete="off"
                                required
                                maxLength={255}
                                placeholder={t('expense_categories.name_placeholder')}
                                className="h-9 py-1.5"
                            />
                        </FormField>
                    </div>
                    <div className="flex flex-col gap-1.5 md:shrink-0">
                        <Label>{t('expense_categories.icon_label')}</Label>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-11 shrink-0"
                            onClick={() => setIconPickerOpen(true)}
                            aria-label={t('expense_categories.pick_icon_aria')}
                        >
                            <ExpenseCategoryIcon name={createForm.data.icon} className="size-4" />
                        </Button>
                        <FieldError message={createForm.errors.icon} />
                    </div>
                    <PrimaryButton
                        type="submit"
                        disabled={createForm.processing}
                        className="h-9 w-full shrink-0 px-4 py-1.5 text-sm md:w-auto"
                    >
                        {createForm.processing
                            ? t('expense_categories.submitting_create')
                            : t('expense_categories.submit_create')}
                    </PrimaryButton>
                </form>
            </section>
            <section className="flex flex-col gap-3" aria-labelledby="expense-categories-mine-heading">
                <h2 id="expense-categories-mine-heading" className="text-sm font-semibold tracking-tight">
                    {t('expense_categories.my_categories_heading')}
                </h2>
                {categories.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                        {t(
                            defaultExpenseCategories.length > 0
                                ? 'expense_categories.empty_my_categories'
                                : 'expense_categories.empty',
                        )}
                    </div>
                ) : (
                    <ul className={categoryGridClassName}>
                    {categories.map((row) => (
                        <li key={row.id} className="min-w-0">
                            <article className="group flex h-full w-full flex-col rounded-lg border border-border bg-card px-2 pb-1.5 pt-2 text-card-foreground shadow-sm transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out will-change-transform hover:border-primary/25 hover:bg-muted/15 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-md motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-sm">
                                <div
                                    className="mx-auto mb-2 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/30 text-primary transition-transform duration-200 ease-out motion-safe:group-hover:scale-110 motion-reduce:group-hover:scale-100"
                                    aria-hidden
                                >
                                    <ExpenseCategoryIcon name={row.icon} className="size-[1.35rem]" />
                                </div>
                                <h3 className="line-clamp-2 min-h-8 text-center text-xs font-semibold leading-tight tracking-tight">
                                    {row.name}
                                </h3>
                                <div className="mt-auto flex items-center justify-around border-t border-border/50 px-0.5 pt-1.5">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon-sm"
                                                className="shrink-0 border-emerald-600/35 text-emerald-600 hover:border-emerald-600/55 hover:bg-emerald-500/10 hover:text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-400 dark:hover:border-emerald-400/60 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-300"
                                                onClick={() => openEdit(row)}
                                                aria-label={t('expense_categories.card_edit_aria')}
                                            >
                                                <Pencil className="size-3.5" aria-hidden />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" sideOffset={4}>
                                            {t('expense_categories.edit')}
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon-sm"
                                                className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => openDeleteModal(row)}
                                                aria-label={t('expense_categories.card_delete_aria')}
                                            >
                                                <Trash2 className="size-3.5" aria-hidden />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" sideOffset={4}>
                                            {t('expense_categories.delete')}
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </article>
                        </li>
                    ))}
                    </ul>
                )}
            </section>

            {defaultExpenseCategories.length > 0 ? (
                <>
                    <hr className="my-8 border-0 border-t border-border" />
                    <section
                        className="flex flex-col gap-3"
                        aria-labelledby="expense-categories-default-heading"
                    >
                        <h2
                            id="expense-categories-default-heading"
                            className="text-sm font-semibold tracking-tight"
                        >
                            {t('expense_categories.default_categories_heading')}
                        </h2>
                        <ul className={categoryGridClassName}>
                            {defaultExpenseCategories.map((row) => (
                                <li key={row.id} className="min-w-0">
                                    <article className="group flex h-full w-full flex-col rounded-lg border border-dashed border-muted-foreground/25 bg-muted/10 px-2 pb-2 pt-2 text-card-foreground shadow-sm transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-muted-foreground/40 motion-safe:hover:shadow-sm motion-reduce:hover:translate-y-0">
                                        <div
                                            className="mx-auto mb-2 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background/80 text-primary transition-transform duration-200 ease-out motion-safe:group-hover:scale-105 motion-reduce:group-hover:scale-100"
                                            aria-hidden
                                        >
                                            <ExpenseCategoryIcon name={row.icon} className="size-[1.35rem]" />
                                        </div>
                                        <h3 className="line-clamp-2 min-h-8 text-center text-xs font-semibold leading-tight tracking-tight">
                                            {row.name}
                                        </h3>
                                    </article>
                                </li>
                            ))}
                        </ul>
                    </section>
                </>
            ) : null}

            <ExpenseCategoryIconPickerDialog
                open={iconPickerOpen}
                onOpenChange={setIconPickerOpen}
                names={safeIconNames}
                selected={createForm.data.icon}
                onPick={(name) => createForm.setData('icon', name)}
                title={t('expense_categories.icon_picker_title')}
                description={t('expense_categories.icon_picker_description')}
                closeAriaLabel={t('expense_categories.close_dialog')}
            />

            <Dialog
                open={editingCategory !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeEdit();
                    }
                }}
            >
                <DialogContent closeAriaLabel={t('expense_categories.close_dialog')} className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('expense_categories.edit_heading')}</DialogTitle>
                        <DialogDescription>{t('expense_categories.edit_modal_description')}</DialogDescription>
                    </DialogHeader>
                    <form id="edit-expense-category-form" onSubmit={submitEdit} className="grid gap-4">
                        <FormField
                            label={t('expense_categories.name_label')}
                            htmlFor="edit-category-name"
                            error={editForm.errors.name}
                        >
                            <TextInput
                                id="edit-category-name"
                                type="text"
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                autoComplete="off"
                                required
                                maxLength={255}
                            />
                        </FormField>
                        <div className="grid gap-2">
                            <Label>{t('expense_categories.icon_label')}</Label>
                            <p className="text-xs text-muted-foreground">{t('expense_categories.edit_icon_hint')}</p>
                            <div className="max-h-48 overflow-y-auto overscroll-contain rounded-lg border border-border bg-background p-3">
                                <ExpenseCategoryIconGrid
                                    names={safeIconNames}
                                    selected={editForm.data.icon}
                                    onSelect={(name) => editForm.setData('icon', name)}
                                />
                            </div>
                            <FieldError message={editForm.errors.icon} />
                        </div>
                    </form>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => closeEdit()}>
                            {t('expense_categories.cancel')}
                        </Button>
                        <PrimaryButton type="submit" form="edit-expense-category-form" disabled={editForm.processing}>
                            {editForm.processing
                                ? t('expense_categories.submitting_edit')
                                : t('expense_categories.submit_edit')}
                        </PrimaryButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deletingCategory !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDeleteModal();
                    }
                }}
            >
                <DialogContent closeAriaLabel={t('expense_categories.close_dialog')}>
                    <DialogHeader>
                        <DialogTitle>{t('expense_categories.delete_modal_title')}</DialogTitle>
                        <DialogDescription>
                            {deletingCategory !== null
                                ? t('expense_categories.delete_modal_description', { name: deletingCategory.name })
                                : null}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={deleteSubmitting} onClick={() => closeDeleteModal()}>
                            {t('expense_categories.cancel')}
                        </Button>
                        <Button type="button" variant="destructive" disabled={deleteSubmitting} onClick={() => performDelete()}>
                            {deleteSubmitting ? t('expense_categories.deleting') : t('expense_categories.delete_confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppDashboardLayout>
    );
}
