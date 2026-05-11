import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Icon size for the + control: 25% larger than size-7 (1.75rem → 2.1875rem). */
export const mobileFabPlusIconClassName = 'size-[2.1875rem]';

type MobileFabProps = React.ComponentProps<typeof Button>;

/** Floating primary action on small screens only; positioned above the mobile bottom nav. */
export function MobileFab({ className, ...props }: MobileFabProps) {
    return (
        <Button
            type="button"
            variant="default"
            size="icon"
            className={cn(
                'fixed right-4 z-40 rounded-full shadow-lg sm:hidden touch-manipulation mobile-fab-bottom mobile-fab-size',
                className,
            )}
            {...props}
        />
    );
}
