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

import type { BunkerPlayerStats } from '../../../domain/bunker.model';
import { LocaleService } from '../../../../../core/i18n/locale.service';
import {
  analyticsChartTranslationKeys,
  analyticsFontFamily,
  axisSeriesForChartCore,
  chartAnimationsEnabled,
} from '../analytics-chart-presentation';

@Component({
  selector: 'app-competitive-multikill-chart',
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
      [xaxis]="xaxis"
      [yaxis]="yaxis"
    />
  `,
  styles: `:host { display: block; min-width: 0; } apx-chart-core { width: 100%; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompetitiveMultikillChart {
  private readonly localeService = inject(LocaleService);
  private readonly translate = inject(TranslateService);
  private readonly occurrencesLabel = toSignal(this.translate.stream(analyticsChartTranslationKeys.occurrences), {
    initialValue: this.translate.instant(analyticsChartTranslationKeys.occurrences),
  });
  readonly stats = input.required<BunkerPlayerStats>();

  protected readonly series = computed(() => axisSeriesForChartCore([{
    name: this.occurrencesLabel(),
    data: [
      this.stats().enemy2ks,
      this.stats().enemy3ks,
      this.stats().enemy4ks,
      this.stats().enemy5ks,
    ],
  }] satisfies ApexAxisChartSeries));
  protected readonly chart: ApexChart = {
    type: 'bar',
    height: 230,
    background: 'transparent',
    fontFamily: analyticsFontFamily,
    animations: { enabled: chartAnimationsEnabled(), speed: 420 },
    toolbar: { show: false },
    zoom: { enabled: false },
  };
  protected readonly colors = ['#f37b21'];
  protected readonly dataLabels: ApexDataLabels = {
    enabled: true,
    style: { colors: ['#f3f8fb'], fontFamily: analyticsFontFamily, fontWeight: 600 },
  };
  protected readonly grid: ApexGrid = {
    show: false,
    padding: { left: 0, right: 0 },
  };
  protected readonly plotOptions: ApexPlotOptions = {
    bar: { horizontal: false, borderRadius: 4, columnWidth: '48%' },
  };
  protected readonly tooltip = computed<ApexTooltip>(() => {
    const locale = this.localeService.currentLocale();
    return {
      enabled: true,
      theme: 'dark',
      y: { formatter: (value) => new Intl.NumberFormat(locale).format(value) },
    };
  });
  protected readonly xaxis: ApexXAxis = {
    categories: ['2K', '3K', '4K', '5K'],
    labels: { style: { colors: ['#a2afb8', '#a2afb8', '#a2afb8', '#a2afb8'], fontFamily: analyticsFontFamily } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  };
  protected readonly yaxis: ApexYAxis = { show: false };
}
