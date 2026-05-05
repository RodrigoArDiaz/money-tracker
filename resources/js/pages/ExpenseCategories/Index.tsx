import { Head, router, useForm } from '@inertiajs/react';
import * as React from 'react';

import FieldError from '@/components/atoms/FieldError';
import Label from '@/components/atoms/Label';
import TextInput from '@/components/atoms/TextInput';
import AppDashboardLayout from '@/components/layouts/AppDashboardLayout';
import FormField from '@/components/molecules/FormField';
import { ExpenseCategoryIconGrid } from '@/components/molecules/ExpenseCategoryIconGrid';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
import { cn } from '@/lib/utils';
import { Pencil, Plus, Trash2 } from 'lucide-react';

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
    const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
    const nameInputRef = React.useRef<HTMLInputElement>(null);

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
        closeCreateDialog();
        editForm.clearErrors();
        editForm.setData('name', row.name);
        editForm.setData('icon', row.icon ?? DEFAULT_CATEGORY_ICON);
        setEditingCategory(row);
    }

    function closeEdit(): void {
        setEditingCategory(null);
        editForm.reset();
    }

    function openCreateDialog(): void {
        closeEdit();
        createForm.clearErrors();
        setCreateDialogOpen(true);
    }

    React.useEffect(() => {
        if (!createDialogOpen) {
            return undefined;
        }
        const id = window.requestAnimationFrame(() => {
            nameInputRef.current?.focus();
        });

        return () => window.cancelAnimationFrame(id);
    }, [createDialogOpen]);

    function closeCreateDialog(): void {
        setCreateDialogOpen(false);
        createForm.clearErrors();
        createForm.reset();
    }

    function submitCreate(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault();
        createForm.post('/expense-categories', {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setCreateDialogOpen(false);
            },
        });
    }

    function submitEdit(e: React.SubmitEvent<HTMLFormElement>): void {
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
        closeCreateDialog();
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
        <AppDashboardLayout>
            <Head title={t('expense_categories.head_title_index')} />
            <div className="space-y-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
                <div
                    className={cn(
                        'flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground shadow-sm',
                        'sm:flex-row sm:flex-nowrap sm:items-start sm:justify-between sm:gap-3 sm:p-4',
                    )}
                >
                    <div className="min-w-0 flex-1">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="intro">
                                <AccordionTrigger>{t('expense_categories.index_description_accordion_label')}</AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        {t('expense_categories.index_description')}
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        className="hidden h-9 shrink-0 gap-1.5 font-medium sm:inline-flex md:h-10"
                        onClick={() => openCreateDialog()}
                        aria-label={t('expense_categories.open_new_category_modal_aria')}
                    >
                        <Plus className="size-4 shrink-0" aria-hidden />
                        {t('expense_categories.new_category_button')}
                    </Button>
                </div>

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
                                                className="shrink-0 border-theme-green-4/35 text-theme-green-4 hover:border-theme-green-4/55 hover:bg-theme-green-3/10 hover:text-theme-green-5 dark:border-theme-green-3/40 dark:text-theme-green-2 dark:hover:border-theme-green-3/60 dark:hover:bg-theme-green-5/15 dark:hover:text-theme-green-1"
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
            </div>

            <Button
                type="button"
                variant="default"
                size="icon"
                className={cn(
                    'fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-4 z-40 size-14 rounded-full shadow-lg sm:hidden',
                    'touch-manipulation',
                )}
                onClick={() => openCreateDialog()}
                aria-label={t('expense_categories.open_new_category_modal_aria')}
            >
                <Plus className="size-7" aria-hidden />
            </Button>

            <Dialog
                open={createDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeCreateDialog();
                    }
                }}
            >
                <DialogContent closeAriaLabel={t('expense_categories.close_dialog')} className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('expense_categories.create_heading')}</DialogTitle>
                        <DialogDescription>{t('expense_categories.create_modal_description')}</DialogDescription>
                    </DialogHeader>
                    <form id="create-expense-category-form" onSubmit={submitCreate} className="grid gap-4">
                        <FormField
                            label={t('expense_categories.name_label')}
                            htmlFor="new-category-name"
                            error={createForm.errors.name}
                        >
                            <TextInput
                                ref={nameInputRef}
                                id="new-category-name"
                                type="text"
                                value={createForm.data.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    createForm.setData('name', e.target.value)
                                }
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
                                    selected={createForm.data.icon}
                                    onSelect={(name) => createForm.setData('icon', name)}
                                />
                            </div>
                            <FieldError message={createForm.errors.icon} />
                        </div>
                    </form>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => closeCreateDialog()}>
                            {t('expense_categories.cancel')}
                        </Button>
                        <Button type="submit" form="create-expense-category-form" disabled={createForm.processing}>
                            {createForm.processing
                                ? t('expense_categories.submitting_create')
                                : t('expense_categories.submit_create')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    editForm.setData('name', e.target.value)
                                }
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
                        <Button type="submit" form="edit-expense-category-form" disabled={editForm.processing}>
                            {editForm.processing
                                ? t('expense_categories.submitting_edit')
                                : t('expense_categories.submit_edit')}
                        </Button>
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
