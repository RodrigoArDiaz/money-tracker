import * as React from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { ExpenseCategoryIconGrid } from './ExpenseCategoryIconGrid';

export function ExpenseCategoryIconPickerDialog({
    open,
    onOpenChange,
    names,
    selected,
    onPick,
    title,
    description,
    closeAriaLabel,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    names: string[];
    selected: string;
    onPick: (name: string) => void;
    title: string;
    description: string;
    closeAriaLabel: string;
}): React.ReactElement {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl" closeAriaLabel={closeAriaLabel}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="max-h-[min(60vh,22rem)] overflow-y-auto overscroll-contain pr-1">
                    <ExpenseCategoryIconGrid
                        names={names}
                        selected={selected}
                        onSelect={(name) => {
                            onPick(name);
                            onOpenChange(false);
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
