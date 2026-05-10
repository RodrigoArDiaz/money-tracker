/**
 * Mobile dashboard chrome: main column padding clears `MobileBottomNav`.
 * Class string must stay literal for Tailwind (see matching `@source inline` in app.css).
 */
export const mobileMainContentBottomPaddingClass =
    'max-sm:pb-[calc(3.75rem+env(safe-area-inset-bottom,0px)+0.75rem)]';
