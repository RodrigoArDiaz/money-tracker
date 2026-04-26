import { Head, router, useForm, usePage } from '@inertiajs/react';
import * as React from 'react';

import Alert from '@/components/atoms/Alert';
import FieldError from '@/components/atoms/FieldError';
import Label from '@/components/atoms/Label';
import PrimaryButton from '@/components/atoms/PrimaryButton';
import TextInput from '@/components/atoms/TextInput';
import AppDashboardLayout from '@/components/layouts/AppDashboardLayout';
import FormField from '@/components/molecules/FormField';
import { ExpenseCategoryIconGrid } from '@/components/molecules/ExpenseCategoryIconGrid';
import { ExpenseCategoryIconPickerDialog } from '@/components/molecules/ExpenseCategoryIconPickerDialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useExpenseCategoryIconProgressiveList } from '@/hooks/use-expense-category-icon-progressive-list';
import { useTranslate } from '@/hooks/use-translate';
import { ExpenseCategoryIcon, EXPENSE_CATEGORY_ICON_MAP } from '@/lib/expense-category-icons';

type CategoryRow = {
    id: number;
    name: string;
    icon: string | null;
    expenses_count: number;
};

const DEFAULT_CATEGORY_ICON = 'Tag';

export default function Index({
    categories,
    expenseCategoryIconNames,
}: {
    categories: CategoryRow[];
    expenseCategoryIconNames: string[];
}) {
    const { t } = useTranslate();
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const [editingCategory, setEditingCategory] = React.useState<CategoryRow | null>(null);
    const [deletingCategory, setDeletingCategory] = React.useState<CategoryRow | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = React.useState(false);
    const [iconPickerOpen, setIconPickerOpen] = React.useState(false);

    const safeIconNames = React.useMemo(
        () => expenseCategoryIconNames.filter((n) => EXPENSE_CATEGORY_ICON_MAP[n] !== undefined),
        [expenseCategoryIconNames],
    );

    const editIconProgress = useExpenseCategoryIconProgressiveList(
        safeIconNames.length,
        editingCategory?.id ?? null,
    );
    const editIconNamesSlice = safeIconNames.slice(0, editIconProgress.visibleCount);

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
            {flash?.success ? (
                <Alert variant="success" role="status">
                    {flash.success}
                </Alert>
            ) : null}
            {flash?.error ? (
                <Alert variant="danger" role="alert">
                    {flash.error}
                </Alert>
            ) : null}
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
                    <div className="min-w-0 w-full md:w-150 md:shrink-0">
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
            {categories.length === 0 ? (
                <section className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                    {t('expense_categories.empty')}
                </section>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
                    <table className="w-full min-w-[28rem] text-left text-sm text-card-foreground">
                        <thead className="border-b border-border bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3">{t('expense_categories.name_label')}</th>
                                <th className="px-4 py-3 text-right">{t('expense_categories.expenses_count_label')}</th>
                                <th className="px-4 py-3 text-right">{t('expense_categories.edit')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {categories.map((row) => (
                                <tr key={row.id} className="bg-card hover:bg-muted/20">
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-2 font-medium">
                                            <ExpenseCategoryIcon
                                                name={row.icon}
                                                className="size-4 shrink-0 text-muted-foreground"
                                            />
                                            {row.name}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                        {row.expenses_count}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex flex-wrap justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                onClick={() => openEdit(row)}
                                            >
                                                {t('expense_categories.edit')}
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                type="button"
                                                onClick={() => openDeleteModal(row)}
                                            >
                                                {t('expense_categories.delete')}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

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
                            <div
                                className="max-h-48 overflow-y-auto overscroll-contain rounded-lg border border-border bg-background p-3"
                                onScroll={editIconProgress.onScroll}
                            >
                                <ExpenseCategoryIconGrid
                                    names={editIconNamesSlice}
                                    selected={editForm.data.icon}
                                    onSelect={(name) => editForm.setData('icon', name)}
                                />
                            </div>
                            {editIconProgress.hasMore ? (
                                <Button type="button" variant="outline" size="sm" onClick={editIconProgress.loadMore}>
                                    {t('expense_categories.icons_load_more')}
                                </Button>
                            ) : null}
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
