import * as React from 'react';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslate } from '@/hooks/use-translate';
import { ExpenseCategoryIcon } from '@/lib/expense-category-icons';
import { cn } from '@/lib/utils';

export type ExpenseCategoryOption = {
    id: number;
    name: string;
    icon: string | null;
};

const DEFAULT_CATEGORY_ICON = 'Tag';

const categoryGridClassName =
    'm-0 grid list-none justify-between gap-2.5 p-0 [grid-template-columns:repeat(auto-fill,minmax(6.25rem,7rem))]';

function CategoryPickCard({
    row,
    variant,
    isSelected,
    onPick,
}: {
    row: ExpenseCategoryOption;
    variant: 'mine' | 'default';
    isSelected: boolean;
    onPick: () => void;
}): React.ReactElement {
    return (
        <li className="min-w-0">
            <button
                type="button"
                onClick={onPick}
                className={cn(
                    'group flex h-full w-full flex-col rounded-lg border bg-card px-2 pb-2 pt-2 text-left text-card-foreground shadow-sm transition-[transform,box-shadow,border-color,background-color,ring] duration-200 ease-out will-change-transform',
                    'motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-md motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-sm',
                    'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                    variant === 'default'
                        ? 'border-dashed border-muted-foreground/25 bg-muted/10 motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-muted-foreground/40 motion-safe:hover:shadow-sm motion-reduce:hover:translate-y-0'
                        : 'border-border hover:border-primary/25 hover:bg-muted/15',
                    isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                )}
            >
                <div
                    className={cn(
                        'mx-auto mb-2 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-primary transition-transform duration-200 ease-out motion-safe:group-hover:scale-110 motion-reduce:group-hover:scale-100',
                        variant === 'default' ? 'bg-background/80 motion-safe:group-hover:scale-105' : 'bg-muted/30',
                    )}
                    aria-hidden
                >
                    <ExpenseCategoryIcon
                        name={row.icon ?? DEFAULT_CATEGORY_ICON}
                        className="size-[1.35rem]"
                    />
                </div>
                <span className="line-clamp-2 min-h-8 text-center text-xs font-semibold leading-tight tracking-tight">
                    {row.name}
                </span>
            </button>
        </li>
    );
}

export function ExpenseCategorySelectDialog({
    open,
    onOpenChange,
    defaultCategories,
    myCategories,
    selectedId,
    onSelect,
    title,
    closeAriaLabel,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultCategories: ExpenseCategoryOption[];
    myCategories: ExpenseCategoryOption[];
    selectedId: string;
    onSelect: (id: number) => void;
    title: string;
    closeAriaLabel: string;
}): React.ReactElement {
    const { t } = useTranslate();
    const selectedNum = selectedId === '' ? null : Number(selectedId);

    function pick(id: number): void {
        onSelect(id);
        onOpenChange(false);
    }

    const hasAny = defaultCategories.length > 0 || myCategories.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-h-[min(90vh,40rem)] w-[calc(100%-2rem)] max-w-2xl gap-4 overflow-hidden p-6 sm:max-w-2xl"
                closeAriaLabel={closeAriaLabel}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[min(65vh,28rem)] overflow-y-auto overscroll-contain px-3 pt-2 pb-6 sm:px-4">
                    {!hasAny ? (
                        <p className="rounded-xl border border-border bg-muted/10 p-6 text-center text-sm text-muted-foreground">
                            {t('expense_categories.empty')}
                        </p>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {myCategories.length > 0 ? (
                                <section className="flex flex-col gap-3" aria-labelledby="pick-categories-mine">
                                    <h2
                                        id="pick-categories-mine"
                                        className="text-sm font-semibold tracking-tight"
                                    >
                                        {t('expense_categories.my_categories_heading')}
                                    </h2>
                                    <ul className={categoryGridClassName}>
                                        {myCategories.map((row) => (
                                            <CategoryPickCard
                                                key={row.id}
                                                row={row}
                                                variant="mine"
                                                isSelected={selectedNum === row.id}
                                                onPick={() => pick(row.id)}
                                            />
                                        ))}
                                    </ul>
                                </section>
                            ) : null}
                            {defaultCategories.length > 0 ? (
                                <section className="flex flex-col gap-3" aria-labelledby="pick-categories-default">
                                    <h2
                                        id="pick-categories-default"
                                        className="text-sm font-semibold tracking-tight"
                                    >
                                        {t('expense_categories.default_categories_heading')}
                                    </h2>
                                    <ul className={categoryGridClassName}>
                                        {defaultCategories.map((row) => (
                                            <CategoryPickCard
                                                key={row.id}
                                                row={row}
                                                variant="default"
                                                isSelected={selectedNum === row.id}
                                                onPick={() => pick(row.id)}
                                            />
                                        ))}
                                    </ul>
                                </section>
                            ) : null}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
