/**
 * Literales OKLch alineados con `resources/css/app.css` (--chart-*, --theme-green-*, --theme-red-*).
 * ApexCharts no interpola bien `var(...)` en todos los casos; mantener sincronizado si cambias tokens en CSS.
 */
export const THEME_CHART = {
    chart1: 'oklch(0.905 0.182 98.111)',
    chart2: 'oklch(0.795 0.184 86.047)',
    chart3: 'oklch(0.681 0.162 75.834)',
    chart4: 'oklch(0.554 0.135 66.442)',
    chart5: 'oklch(0.476 0.114 61.907)',
    green1: 'oklch(0.871 0.15 154.449)',
    green2: 'oklch(0.723 0.219 149.579)',
    green3: 'oklch(0.627 0.194 149.214)',
    green4: 'oklch(0.527 0.154 150.069)',
    green5: 'oklch(0.448 0.119 151.328)',
    red1: 'oklch(0.808 0.114 19.571)',
    red2: 'oklch(0.637 0.237 25.331)',
    red3: 'oklch(0.577 0.245 27.325)',
    red4: 'oklch(0.505 0.213 27.518)',
    red5: 'oklch(0.444 0.177 26.899)',
} as const;

/** Serie donut categorías: alterna chart (amarillo) con gamas theme green/red. */
export const DONUT_CATEGORY_COLORS: string[] = [
    THEME_CHART.chart1,
    THEME_CHART.green1,
    THEME_CHART.chart2,
    THEME_CHART.green2,
    THEME_CHART.chart3,
    THEME_CHART.red1,
    THEME_CHART.chart4,
    THEME_CHART.green3,
    THEME_CHART.red2,
    THEME_CHART.chart5,
    THEME_CHART.green4,
    THEME_CHART.red3,
];

/** Texto oscuro / claro sobre cada arco según luminancia OKL del relleno (contraste WCAG-friendly). */
const DATA_LABEL_ON_LIGHT_SLICE = 'oklch(0.18 0.045 107)';
const DATA_LABEL_ON_DARK_SLICE = 'oklch(0.98 0.01 106)';

export function sliceDataLabelTextColors(sliceFillColors: string[]): string[] {
    return sliceFillColors.map((color) => {
        const m = /oklch\(\s*([\d.]+)/.exec(color);
        const l = m ? parseFloat(m[1]) : 0.55;

        return l >= 0.52 ? DATA_LABEL_ON_LIGHT_SLICE : DATA_LABEL_ON_DARK_SLICE;
    });
}
