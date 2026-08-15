import 'apexcharts/bar';

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
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

import { LocaleService } from '../../../../../core/i18n/locale.service';
import {
  analyticsFontFamily,
  axisSeriesForChartCore,
  chartAnimationsEnabled,
  isFiniteNumber,
} from '../analytics-chart-presentation';

@Component({
  selector: 'app-competitive-kda-chart',
  imports: [ChartCoreComponent],
  template: `
    <apx-chart-core
      [series]="series()"
      [chart]="chart"
      [colors]="colors"
      [dataLabels]="dataLabels()"
      [grid]="grid"
      [plotOptions]="plotOptions"
      [tooltip]="tooltip()"
      [xaxis]="xaxis"
      [yaxis]="yaxis()"
    />
  `,
  styles: `:host { display: block; min-width: 0; } apx-chart-core { width: 100%; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompetitiveKdaChart {
  private readonly localeService = inject(LocaleService);
  private readonly translate = inject(TranslateService);

  readonly kills = input<number | null>(null);
  readonly deaths = input<number | null>(null);
  readonly assists = input<number | null>(null);

  protected readonly values = computed(() => [this.kills(), this.deaths(), this.assists()]);
  protected readonly labels = computed(() => [
    this.translate.instant('bunker.matchHistory.labels.kills'),
    this.translate.instant('bunker.matchHistory.labels.deaths'),
    this.translate.instant('bunker.matchHistory.labels.assists'),
  ]);
  protected readonly series = computed(() => axisSeriesForChartCore([{
    name: this.translate.instant('bunker.matchHistory.performance'),
    data: this.values().map((value, index) => ({ x: this.labels()[index], y: isFiniteNumber(value) ? value : null })),
  }] satisfies ApexAxisChartSeries));
  protected readonly chart: ApexChart = {
    type: 'bar',
    height: 188,
    background: 'transparent',
    fontFamily: analyticsFontFamily,
    animations: {
      enabled: chartAnimationsEnabled(),
      speed: 320,
      animateGradually: { enabled: true, delay: 70 },
      dynamicAnimation: { enabled: true, speed: 280 },
    },
    toolbar: { show: false },
    zoom: { enabled: false },
  };
  protected readonly colors = ['#32d1ff', '#f37b21', '#8b9aaa'];
  protected readonly dataLabels = computed<ApexDataLabels>(() => {
    const locale = this.localeService.currentLocale();
    return {
      enabled: true,
      formatter: (value) => this.formatValue(typeof value === 'number' ? value : undefined, locale),
      style: { colors: ['#f3f8fb'], fontFamily: analyticsFontFamily, fontSize: '11px' },
      offsetX: 6,
    };
  });
  protected readonly grid: ApexGrid = {
    borderColor: 'rgba(193, 203, 210, 0.09)',
    strokeDashArray: 3,
    padding: { left: 4, right: 24, top: -8, bottom: -8 },
  };
  protected readonly plotOptions: ApexPlotOptions = {
    bar: { horizontal: true, distributed: true, borderRadius: 3, barHeight: '46%' },
  };
  protected readonly xaxis: ApexXAxis = {
    min: 0,
    labels: { show: false },
    axisBorder: { show: false },
    axisTicks: { show: false },
  };
  protected readonly yaxis = computed<ApexYAxis>(() => ({
    labels: {
      style: { colors: ['#a2afb8'], fontFamily: analyticsFontFamily, fontSize: '10px', fontWeight: 700 },
    },
  }));
  protected readonly tooltip = computed<ApexTooltip>(() => {
    const locale = this.localeService.currentLocale();
    return {
      enabled: true,
      theme: 'dark',
      y: { formatter: (_value, options) => this.formatValue(this.values()[options?.dataPointIndex ?? -1], locale) },
    };
  });

  private formatValue(value: number | null | undefined, locale: string): string {
    return isFiniteNumber(value)
      ? new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)
      : '—';
  }
}
