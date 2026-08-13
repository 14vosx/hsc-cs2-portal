import 'apexcharts/bar';

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { ChartCoreComponent } from 'ng-apexcharts';
import type {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexGrid,
  ApexPlotOptions,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
} from 'ng-apexcharts';

import type { BunkerMapPerformance } from '../../../domain/bunker.model';
import {
  analyticsChartTranslationKeys,
  analyticsFontFamily,
  axisSeriesForChartCore,
  chartAnimationsEnabled,
  formatRate,
  rateToPercent,
} from '../analytics-chart-presentation';

@Component({
  selector: 'app-competitive-map-winrate-chart',
  imports: [ChartCoreComponent],
  template: `
    <apx-chart-core
      [series]="series()"
      [chart]="chart"
      [colors]="colors"
      [dataLabels]="dataLabels"
      [grid]="grid"
      [plotOptions]="plotOptions"
      [tooltip]="tooltip()"
      [xaxis]="xaxis()"
      [yaxis]="yaxis"
    />
  `,
  styles: `:host { display: block; min-width: 0; } apx-chart-core { width: 100%; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompetitiveMapWinrateChart {
  private readonly translate = inject(TranslateService);
  private readonly winRateLabel = toSignal(this.translate.stream(analyticsChartTranslationKeys.winRate), {
    initialValue: this.translate.instant(analyticsChartTranslationKeys.winRate),
  });
  readonly maps = input<readonly BunkerMapPerformance[]>([]);

  protected readonly series = computed(() => axisSeriesForChartCore([{
    name: this.winRateLabel(),
    data: this.maps().map((map) => rateToPercent(map.winRate)),
  }] satisfies ApexAxisChartSeries));
  protected readonly yaxis: ApexYAxis = {
    labels: {
      style: { colors: ['#a2afb8'], fontFamily: analyticsFontFamily },
    },
  };
  protected readonly tooltip = computed<ApexTooltip>(() => ({
    enabled: true,
    theme: 'dark',
    y: {
      formatter: (_value, options) => formatRate(this.maps()[options?.dataPointIndex ?? -1]?.winRate ?? null),
    },
  }));
  protected readonly chart: ApexChart = {
    type: 'bar',
    height: 300,
    background: 'transparent',
    fontFamily: analyticsFontFamily,
    animations: { enabled: chartAnimationsEnabled(), speed: 420 },
    toolbar: { show: false },
    zoom: { enabled: false },
  };
  protected readonly colors = ['#32d1ff'];
  protected readonly dataLabels: ApexDataLabels = { enabled: false };
  protected readonly grid: ApexGrid = {
    borderColor: 'rgba(193, 203, 210, 0.10)',
    strokeDashArray: 3,
  };
  protected readonly plotOptions: ApexPlotOptions = {
    bar: { horizontal: true, borderRadius: 4, barHeight: '48%' },
  };
  protected readonly xaxis = computed<ApexXAxis>(() => ({
    categories: this.maps().map((map) => map.mapName || '—'),
    min: 0,
    max: 100,
    tickAmount: 4,
    labels: {
      formatter: (value) => `${Number(value).toLocaleString('pt-BR')}%`,
      style: { colors: '#6f7d89', fontFamily: analyticsFontFamily },
    },
    axisBorder: { color: 'rgba(193, 203, 210, 0.12)' },
    axisTicks: { color: 'rgba(193, 203, 210, 0.12)' },
  }));
}
