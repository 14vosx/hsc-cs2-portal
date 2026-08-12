import type { ApexAxisChartSeries, ApexNonAxisChartSeries } from 'ng-apexcharts';

export const analyticsFontFamily = '"Chakra Petch", ui-sans-serif, system-ui, sans-serif';

export function chartAnimationsEnabled(): boolean {
  return !(
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function rateToPercent(value: number | null): number | null {
  if (!isFiniteNumber(value)) {
    return null;
  }

  return value > 1 ? value : value * 100;
}

export function formatRate(value: number | null): string {
  const percent = rateToPercent(value);

  if (percent === null) {
    return '—';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(percent / 100);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function axisSeriesForChartCore(series: ApexAxisChartSeries): ApexNonAxisChartSeries {
  // ng-apexcharts exposes ChartCore.series narrowly; Apex still accepts axis series at runtime.
  return series as unknown as ApexNonAxisChartSeries;
}
