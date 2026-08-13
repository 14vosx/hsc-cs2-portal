import 'apexcharts/line';

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { ChartCoreComponent } from 'ng-apexcharts';
import type { ApexAxisChartSeries, ApexChart, ApexFill, ApexStroke, ApexTooltip } from 'ng-apexcharts';

import {
  analyticsChartTranslationKeys,
  analyticsFontFamily,
  axisSeriesForChartCore,
  chartAnimationsEnabled,
} from '../analytics-chart-presentation';
import { LocaleService } from '../../../../../core/i18n/locale.service';

@Component({
  selector: 'app-competitive-metric-sparkline',
  imports: [ChartCoreComponent],
  template: `
    @if (hasData()) {
      <apx-chart-core
        [series]="series()"
        [chart]="chart"
        [colors]="colors()"
        [fill]="fill"
        [stroke]="stroke"
        [tooltip]="tooltip()"
      />
    }
  `,
  styles: `:host { display: block; width: 100%; min-height: 54px; } apx-chart-core { width: 100%; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompetitiveMetricSparkline {
  private readonly localeService = inject(LocaleService);
  private readonly translate = inject(TranslateService);
  private readonly valueLabel = toSignal(this.translate.stream(analyticsChartTranslationKeys.value), {
    initialValue: this.translate.instant(analyticsChartTranslationKeys.value),
  });
  readonly values = input<readonly (number | null)[]>([]);
  readonly color = input<'cyan' | 'orange'>('cyan');

  protected readonly hasData = computed(() => this.values().some((value) => value !== null));
  protected readonly series = computed(() => axisSeriesForChartCore([
    { name: this.valueLabel(), data: [...this.values()] },
  ] satisfies ApexAxisChartSeries));
  protected readonly colors = computed(() => [
    this.color() === 'orange' ? '#f37b21' : '#32d1ff',
  ]);
  protected readonly chart: ApexChart = {
    type: 'area',
    height: 54,
    sparkline: { enabled: true },
    background: 'transparent',
    fontFamily: analyticsFontFamily,
    animations: { enabled: chartAnimationsEnabled(), speed: 320 },
    toolbar: { show: false },
    zoom: { enabled: false },
  };
  protected readonly fill: ApexFill = {
    type: 'gradient',
    gradient: { shadeIntensity: 0.25, opacityFrom: 0.38, opacityTo: 0.02, stops: [0, 100] },
  };
  protected readonly stroke: ApexStroke = { curve: 'smooth', width: 2 };
  protected readonly tooltip = computed<ApexTooltip>(() => {
    const locale = this.localeService.currentLocale();
    return {
      enabled: true,
      theme: 'dark',
      x: { show: false },
      y: { formatter: (value) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value) },
      marker: { show: false },
    };
  });
}
