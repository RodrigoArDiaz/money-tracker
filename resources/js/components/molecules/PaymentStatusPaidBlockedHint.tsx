import * as React from 'react';
import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslate } from '@/hooks/use-translate';

/** Explicación cuando no se puede marcar «Pagado» (ej. mes planificado posterior al mes actual). */
export function PaymentStatusPaidBlockedHint({ visible }: { visible: boolean }): React.ReactElement | null {
    const { t } = useTranslate();

    if (!visible) {
        return null;
    }

    return (
        <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9 shrink-0"
                    aria-label={t('upcoming_expenses.payment_paid_blocked_info_aria')}
                >
                    <Info className="size-4 text-primary/90" aria-hidden />
                </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="max-w-xs font-normal leading-snug">
                {t('upcoming_expenses.paid_disabled_future_month_title')}
            </TooltipContent>
        </Tooltip>
    );
}
