import * as React from 'react';
import { Toaster } from 'sonner';

import { useTheme } from '@/components/theme-provider';

export function AppToaster(): React.ReactElement {
    const { resolvedTheme } = useTheme();

    return (
        <Toaster
            theme={resolvedTheme}
            position="top-center"
            richColors
            closeButton
            toastOptions={{
                classNames: {
                    toast: 'font-sans',
                },
            }}
        />
    );
}
