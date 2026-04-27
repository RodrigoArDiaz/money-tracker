import * as React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function ExpenseRowActions({
    onEdit,
    onDelete,
    editAriaLabel,
    deleteAriaLabel,
    editTooltip,
    deleteTooltip,
}: {
    onEdit: () => void;
    onDelete: () => void;
    editAriaLabel: string;
    deleteAriaLabel: string;
    editTooltip: string;
    deleteTooltip: string;
}): React.ReactElement {
    return (
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={onEdit}
                        aria-label={editAriaLabel}
                    >
                        <Pencil className="size-4" aria-hidden />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={4}>
                    {editTooltip}
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={onDelete}
                        aria-label={deleteAriaLabel}
                    >
                        <Trash2 className="size-4" aria-hidden />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={4}>
                    {deleteTooltip}
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
