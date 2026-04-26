import * as React from 'react';

import { EXPENSE_CATEGORY_ICON_CHUNK_SIZE } from '@/lib/expense-category-icons';

/**
 * Muestra iconos de a chunks y permite cargar más al hacer scroll al final o con loadMore().
 */
export function useExpenseCategoryIconProgressiveList(length: number, resetKey: unknown): {
    visibleCount: number;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    loadMore: () => void;
    hasMore: boolean;
} {
    const [visibleCount, setVisibleCount] = React.useState(EXPENSE_CATEGORY_ICON_CHUNK_SIZE);

    React.useLayoutEffect(() => {
        setVisibleCount(EXPENSE_CATEGORY_ICON_CHUNK_SIZE);
    }, [resetKey, length]);

    const visibleSliceEnd = Math.min(visibleCount, length);

    const loadMore = React.useCallback(() => {
        setVisibleCount((v) => Math.min(v + EXPENSE_CATEGORY_ICON_CHUNK_SIZE, length));
    }, [length]);

    const onScroll = React.useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            const el = e.currentTarget;
            if (el.scrollHeight - el.scrollTop - el.clientHeight < 72) {
                loadMore();
            }
        },
        [loadMore],
    );

    return {
        visibleCount: visibleSliceEnd,
        onScroll,
        loadMore,
        hasMore: visibleSliceEnd < length,
    };
}
