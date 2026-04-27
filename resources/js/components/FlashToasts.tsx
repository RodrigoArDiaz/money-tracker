import type { GlobalEvent } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import * as React from 'react';
import { toast } from 'sonner';

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
}

type FlashShape = {
    success?: unknown;
    error?: unknown;
};

function mergeFlashFromPage(page: { flash?: unknown; props?: Record<string, unknown> }): {
    success?: string;
    error?: string;
} {
    const out: { success?: string; error?: string } = {};

    const apply = (raw: unknown): void => {
        if (raw === null || raw === undefined || typeof raw !== 'object') {
            return;
        }
        const f = raw as FlashShape;
        if (isNonEmptyString(f.success)) {
            out.success = f.success;
        }
        if (isNonEmptyString(f.error)) {
            out.error = f.error;
        }
    };

    /** Raíz: respuestas que usan `Inertia::flash()` / `resolveFlashData` en Laravel. */
    apply(page.flash);
    /** Props: `HandleInertiaRequests` + `redirect()->with('success'|'error')` (Laravel session). */
    apply(page.props?.flash);

    return out;
}

const DEDUPE_MS = 200;

/**
 * Muestra toasts cuando hay mensajes en `props.flash` (sesión Laravel vía middleware)
 * o en `page.flash` (Inertia flash). El evento global `flash` solo cubre la raíz;
 * por eso también se escuchan `navigate` y `success`.
 */
export function FlashToasts(): null {
    const lastSigRef = React.useRef<string>('');
    const lastAtRef = React.useRef<number>(0);

    const emit = React.useCallback((page: { flash?: unknown; props?: Record<string, unknown> }) => {
        const { success, error } = mergeFlashFromPage(page);
        if (!success && !error) {
            return;
        }

        const sig = `${success ?? ''}\0${error ?? ''}`;
        const now = Date.now();
        if (sig === lastSigRef.current && now - lastAtRef.current < DEDUPE_MS) {
            return;
        }
        lastSigRef.current = sig;
        lastAtRef.current = now;

        if (success) {
            toast.success(success);
        }
        if (error) {
            toast.error(error);
        }
    }, []);

    React.useEffect(() => {
        const offNavigate = router.on('navigate', (event: GlobalEvent<'navigate'>) => {
            emit(event.detail.page);
        });
        const offSuccess = router.on('success', (event: GlobalEvent<'success'>) => {
            emit(event.detail.page);
        });
        const offFlash = router.on('flash', (event: GlobalEvent<'flash'>) => {
            emit({ flash: event.detail.flash, props: {} });
        });

        return () => {
            offNavigate();
            offSuccess();
            offFlash();
        };
    }, [emit]);

    return null;
}
