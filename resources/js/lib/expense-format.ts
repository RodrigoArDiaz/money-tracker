/**
 * Formato de montos para listados y totales (alineado al locale de la app).
 */
export function formatAmountDisplay(amount: string, locale: string): string {
    const n = Number.parseFloat(amount);
    if (Number.isNaN(n)) {
        return amount.startsWith('$') ? amount : `$ ${amount}`;
    }

    const formatted = new Intl.NumberFormat(locale === 'es' ? 'es' : 'en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);

    return `$ ${formatted}`;
}

/** Primera letra en mayúscula (p. ej. fecha en español: "lunes…" → "Lunes…"). */
export function capitalizeFirstLetter(value: string): string {
    if (value.length === 0) {
        return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
}
