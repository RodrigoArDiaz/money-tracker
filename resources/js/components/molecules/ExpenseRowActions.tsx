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
    showEdit = true,
    showDelete = true,
    presentation = 'toolbar',
}: {
    onEdit: () => void;
    onDelete: () => void;
    editAriaLabel: string;
    deleteAriaLabel: string;
    editTooltip: string;
    deleteTooltip: string;
    /** Si es false, no se muestra editar (p. ej. cuotas de un plan de financiación). */
    showEdit?: boolean;
    /** Si es false, solo se muestra editar (p. ej. cuotas de un plan de financiación). */
    showDelete?: boolean;
    /** `toolbar`: iconos con tooltip (fila). `drawerList`: filas ancho completo para menú móvil. */
    presentation?: 'toolbar' | 'drawerList';
}): React.ReactElement | null {
    if (!showEdit && !showDelete) {
        return null;
    }

    if (presentation === 'drawerList') {
        return (
            <div className="flex w-full flex-col gap-2">
                {showEdit ? (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-auto min-h-11 w-full justify-start gap-3 py-2.5"
                        onClick={onEdit}
                        aria-label={editAriaLabel}
                    >
                        <Pencil className="size-4 shrink-0" aria-hidden />
                        <span className="text-left text-sm font-medium">{editTooltip}</span>
                    </Button>
                ) : null}
                {showDelete ? (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-auto min-h-11 w-full justify-start gap-3 py-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={onDelete}
                        aria-label={deleteAriaLabel}
                    >
                        <Trash2 className="size-4 shrink-0" aria-hidden />
                        <span className="text-left text-sm font-medium">{deleteTooltip}</span>
                    </Button>
                ) : null}
            </div>
        );
    }

    return (
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            {showEdit ? (
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
            ) : null}
            {showDelete ? (
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
            ) : null}
        </div>
    );
}
