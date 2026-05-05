/** Ícono por defecto si la categoría no define uno (nombre Lucide, coincide con categorías). */
export const DEFAULT_EXPENSE_CATEGORY_ICON = 'Tag';

/** Cada fila de gasto (card estándar). */
export const EXPENSE_CARD_CLASS_NAME =
    'rounded-xl border border-border bg-card px-4 py-2 text-card-foreground shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-primary/20 motion-safe:hover:shadow-md motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-sm sm:px-5 sm:py-2';

/** Resumen del día: gama theme-green (shadcn). */
export const EXPENSE_TOTAL_SUMMARY_CARD_CLASS_NAME =
    'rounded-xl border border-theme-green-2/55 bg-theme-green-1/25 px-4 py-2 text-card-foreground shadow-sm transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-theme-green-3/80 motion-safe:hover:bg-theme-green-1/45 motion-safe:hover:shadow-md motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-sm sm:px-5 sm:py-2 dark:border-theme-green-5/45 dark:bg-theme-green-5/25 dark:motion-safe:hover:border-theme-green-4/70 dark:motion-safe:hover:bg-theme-green-5/40';

/** Misma card de totales cuando aún hay monto pendiente (gama theme-red). */
export const EXPENSE_TOTAL_SUMMARY_CARD_UNPAID_ALERT_CLASS_NAME =
    'rounded-xl border border-theme-red-2/55 bg-theme-red-1/22 px-4 py-2 text-card-foreground shadow-sm transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-theme-red-3/80 motion-safe:hover:bg-theme-red-1/40 motion-safe:hover:shadow-md motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-sm sm:px-5 sm:py-2 dark:border-theme-red-5/45 dark:bg-theme-red-5/25 dark:motion-safe:hover:border-theme-red-4/70 dark:motion-safe:hover:bg-theme-red-5/40';
