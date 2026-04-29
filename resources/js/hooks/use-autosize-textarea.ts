import * as React from 'react';

/** Equivalente práctico a `h-9` (inputs / Select alineados a 36px). */
export const AUTOSIZE_TEXTAREA_MIN_HEIGHT_PX = 36;

export type AutosizeTextareaOptions = {
    /** Tope antes de aparecer scroll interno (px). */
    maxHeightPx?: number;
    /** Altura mínima en px (por defecto alineado a `h-9`). */
    minHeightPx?: number;
    /** Si es false no mide (p. ej. diálogo cerrado con display:none). */
    enabled?: boolean;
};

/**
 * Ajusta la altura de un textarea al contenido (crece / encoge al escribir o borrar).
 */
export function useAutosizeTextarea(
    value: string,
    options: AutosizeTextareaOptions | number = {},
): React.RefObject<HTMLTextAreaElement | null> {
    const ref = React.useRef<HTMLTextAreaElement>(null);

    const normalized =
        typeof options === 'number'
            ? ({ maxHeightPx: options } satisfies AutosizeTextareaOptions)
            : options;

    const maxHeight = normalized.maxHeightPx ?? 280;
    const minHeight = normalized.minHeightPx ?? AUTOSIZE_TEXTAREA_MIN_HEIGHT_PX;
    const enabled = normalized.enabled ?? true;

    React.useLayoutEffect(() => {
        if (!enabled) {
            return;
        }

        const el = ref.current;
        if (!el) {
            return;
        }

        el.style.height = '0px';
        const natural = el.scrollHeight;
        const capped = Math.min(Math.max(natural, minHeight), maxHeight);
        el.style.height = `${capped}px`;
        el.style.overflowY = natural > maxHeight ? 'auto' : 'hidden';
    }, [value, maxHeight, minHeight, enabled]);

    return ref;
}
