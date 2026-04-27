import type { ApexOptions } from 'apexcharts';
import * as React from 'react';
import ReactApexChart from 'react-apexcharts';

import { useTheme } from '@/components/theme-provider';
import { useTranslate } from '@/hooks/use-translate';
import { formatAmountDisplay } from '@/lib/expense-format';

const SERIES_COLORS = [
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f59e0b',
    '#ef4444',
    '#22c55e',
    '#3b82f6',
    '#a855f7',
    '#f97316',
    '#84cc16',
    '#06b6d4',
];

type Row = { id: number; name: string; total: string };

export function CategorySpendingDonutChart({
    rows,
    valueLabel,
    chartAriaLabel,
}: {
    rows: Row[];
    /** Etiqueta del total en el centro del anillo. */
    valueLabel: string;
    /** Descripción accesible del gráfico. */
    chartAriaLabel: string;
}): React.ReactElement {
    const { resolvedTheme } = useTheme();
    const { locale } = useTranslate();
    const isDark = resolvedTheme === 'dark';
    const labelColor = isDark ? '#e5e7eb' : '#1f2937';

    const totalNumeric = React.useMemo(
        () => rows.reduce((acc, r) => acc + Number.parseFloat(r.total), 0),
        [rows],
    );
    const totalFormatted = formatAmountDisplay(totalNumeric.toFixed(2), locale);

    const { series, labels } = React.useMemo(() => {
        const s = rows.map((r) => Number.parseFloat(r.total));

        return {
            series: s,
            labels: rows.map((r) => r.name),
        };
    }, [rows]);

    const options = React.useMemo<ApexOptions>(
        () => ({
            chart: {
                type: 'donut',
                background: 'transparent',
                toolbar: { show: false },
                animations: {
                    enabled: false,
                },
            },
            labels,
            theme: { mode: isDark ? 'dark' : 'light' },
            colors: SERIES_COLORS.slice(0, Math.max(rows.length, 1)),
            dataLabels: {
                enabled: true,
                formatter: (val: string | number | undefined) =>
                    val !== undefined && val !== null ? `${Number(val).toFixed(1)}%` : '',
            },
            legend: {
                show: false,
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '70%',
                        labels: {
                            show: rows.length > 0,
                            name: { color: labelColor },
                            // Al pasar el cursor por un arco, el centro muestra categoría + monto (Apex pasa el valor de la serie).
                            value: {
                                color: labelColor,
                                formatter: (val: string) => {
                                    const n = Number.parseFloat(String(val).replaceAll(',', ''));
                                    if (Number.isNaN(n)) {
                                        return String(val);
                                    }

                                    return formatAmountDisplay(n.toFixed(2), locale);
                                },
                            },
                            total: {
                                show: rows.length > 0,
                                label: valueLabel,
                                color: labelColor,
                                formatter: () => totalFormatted,
                            },
                        },
                    },
                },
            },
            stroke: { width: 0 },
            tooltip: {
                y: {
                    formatter: (val: number) => formatAmountDisplay(val.toFixed(2), locale),
                },
            },
        }),
        [isDark, labels, labelColor, locale, rows.length, totalFormatted, valueLabel],
    );

    if (rows.length === 0) {
        return <div className="min-h-[120px]" />;
    }

    return (
        <div className="w-full overflow-visible" role="img" aria-label={chartAriaLabel}>
            <ReactApexChart options={options} series={series} type="donut" height={320} />
        </div>
    );
}
