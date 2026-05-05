import type { ApexOptions } from 'apexcharts';
import * as React from 'react';
import ReactApexChart from 'react-apexcharts';

import { useTheme } from '@/components/theme-provider';
import { useTranslate } from '@/hooks/use-translate';
import { formatAmountDisplay } from '@/lib/expense-format';
import { DONUT_CATEGORY_COLORS, sliceDataLabelTextColors } from '@/lib/theme-chart-colors';

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
    /** Texto del centro del donut: mismo tono que foreground del tema (olive base). */
    const centerLabelColor = isDark ? 'oklch(0.988 0.003 106.5)' : 'oklch(0.153 0.006 107.1)';

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

    const sliceColors = React.useMemo(
        () => DONUT_CATEGORY_COLORS.slice(0, Math.max(rows.length, 1)),
        [rows.length],
    );

    const arcPercentColors = React.useMemo(() => sliceDataLabelTextColors(sliceColors), [sliceColors]);

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
            colors: sliceColors,
            dataLabels: {
                enabled: true,
                formatter: (val: string | number | undefined) =>
                    val !== undefined && val !== null ? `${Number(val).toFixed(1)}%` : '',
                style: {
                    fontSize: '11px',
                    fontWeight: 600,
                    colors: arcPercentColors,
                },
                dropShadow: {
                    enabled: true,
                    top: 0,
                    left: 0,
                    blur: 2,
                    opacity: 0.28,
                    color: '#000000',
                },
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
                            name: { color: centerLabelColor },
                            // Al pasar el cursor por un arco, el centro muestra categoría + monto (Apex pasa el valor de la serie).
                            value: {
                                color: centerLabelColor,
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
                                color: centerLabelColor,
                                formatter: () => totalFormatted,
                            },
                        },
                    },
                },
            },
            stroke: { width: 0 },
            tooltip: {
                fillSeriesColor: false,
                style: {
                    fontSize: '13px',
                },
                y: {
                    formatter: (val: number) => formatAmountDisplay(val.toFixed(2), locale),
                },
            },
        }),
        [arcPercentColors, centerLabelColor, isDark, labels, locale, rows.length, sliceColors, totalFormatted, valueLabel],
    );

    if (rows.length === 0) {
        return <div className="min-h-[120px]" />;
    }

    return (
        <div
            className="category-spending-donut-chart w-full overflow-visible"
            role="img"
            aria-label={chartAriaLabel}
        >
            <ReactApexChart options={options} series={series} type="donut" height={320} />
        </div>
    );
}
