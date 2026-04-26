import * as React from 'react';

import { cn } from '@/lib/utils';
import { EXPENSE_CATEGORY_ICON_MAP } from '@/lib/expense-category-icons';

export function ExpenseCategoryIconGrid({
    names,
    selected,
    onSelect,
    className,
}: {
    names: string[];
    selected: string;
    onSelect: (name: string) => void;
    className?: string;
}): React.ReactElement {
    return (
        <div className={cn('grid grid-cols-6 gap-2 sm:grid-cols-8', className)}>
            {names.map((name) => {
                const Icon = EXPENSE_CATEGORY_ICON_MAP[name];
                if (Icon === undefined) {
                    return null;
                }
                const isSelected = selected === name;

                return (
                    <button
                        key={name}
                        type="button"
                        onClick={() => onSelect(name)}
                        className={cn(
                            'flex size-10 items-center justify-center rounded-lg border transition-colors',
                            isSelected
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-background hover:bg-muted',
                        )}
                        aria-label={name}
                        aria-pressed={isSelected}
                    >
                        <Icon className="size-5 shrink-0" aria-hidden />
                    </button>
                );
            })}
        </div>
    );
}
