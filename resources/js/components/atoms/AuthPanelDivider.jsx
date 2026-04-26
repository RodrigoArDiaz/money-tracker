/**
 * Línea horizontal con etiqueta centrada (p. ej. "o con email").
 * `panelBgClass` debe coincidir con el fondo de la tarjeta para tapar la línea.
 */
export default function AuthPanelDivider({ children, panelBgClass = 'bg-[#FDFDFC] dark:bg-[#161615]' }) {
    return (
        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/10 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
                <span className={`${panelBgClass} px-2 text-gray-500 dark:text-gray-400`}>{children}</span>
            </div>
        </div>
    );
}
