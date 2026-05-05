import { Expand, Shrink } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslate } from '@/hooks/use-translate';

/**
 * Entrada/salida de pantalla completa en el documento (Full Screen API).
 * No se muestra si el navegador no admite `requestFullscreen` (p. ej. algunos móviles).
 */
export default function FullscreenToggle(): React.ReactElement | null {
    const { t } = useTranslate();
    const [supported, setSupported] = React.useState(false);
    const [active, setActive] = React.useState(false);

    React.useEffect(() => {
        const root = document.documentElement;
        setSupported(typeof root.requestFullscreen === 'function');

        const sync = (): void => {
            setActive(Boolean(document.fullscreenElement));
        };

        sync();
        document.addEventListener('fullscreenchange', sync);

        return () => document.removeEventListener('fullscreenchange', sync);
    }, []);

    const toggle = React.useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch {
            /* usuario o política del navegador puede rechazar */
        }
    }, []);

    if (!supported) {
        return null;
    }

    const label = active ? t('layout.fullscreen_exit_aria') : t('layout.fullscreen_enter_aria');

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0"
                        aria-label={label}
                        aria-pressed={active}
                        onClick={() => void toggle()}
                    >
                        {active ? <Shrink /> : <Expand />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                    {label}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
