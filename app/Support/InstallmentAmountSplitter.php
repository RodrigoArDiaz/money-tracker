<?php

namespace App\Support;

/**
 * Reparte un total en N importes en centavos sin pérdida (el resto se reparte en las primeras cuotas).
 */
final class InstallmentAmountSplitter
{
    /**
     * @return list<string> Cada elemento es un decimal con 2 decimales ("123.45").
     */
    public static function splitEven(string $total, int $installmentCount): array
    {
        if ($installmentCount < 1) {
            return [];
        }

        $totalCents = (int) round((float) $total * 100);
        $baseCents = intdiv($totalCents, $installmentCount);
        $remainder = $totalCents % $installmentCount;

        $out = [];
        for ($i = 0; $i < $installmentCount; $i++) {
            $cents = $baseCents + ($i < $remainder ? 1 : 0);
            $out[] = number_format($cents / 100, 2, '.', '');
        }

        return $out;
    }
}
