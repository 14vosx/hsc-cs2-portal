import 'apexcharts/radialBar';

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { ChartCoreComponent } from 'ng-apexcharts';
import type {
  ApexChart,
  ApexDataLabels,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexStroke,
  ApexTooltip,
} from 'ng-apexcharts';

import { LocaleService } from '../../../../../core/i18n/locale.service';
import {
  analyticsChartTranslationKeys,
  analyticsFontFamily,
  chartAnimationsEnabled,
  formatRate,
  rateToPercent,
} from '../analytics-chart-presentation';

@Component({
  selector: 'app-competitive-win-rate-chart',
  imports: [ChartCoreComponent],
  template: `
    @if (series().length > 0) {
      <apx-chart-core
        [series]="series()"
        [chart]="chart"
        [colors]="colors"
        [dataLabels]="dataLabels"
        [labels]="labels()"
        [plotOptions]="plotOptions()"
        [stroke]="stroke"
        [tooltip]="tooltip()"
      />
    } @else {
      <span class="chart-empty">—</span>
    }
  `,
  styles: `
    :host { display: grid; min-height: 176px; place-items: center; }
    apx-chart-core { width: 100%; }
    .chart-empty { color: var(--color-text-subtle); font-family: var(--font-display); font-size: 2rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompetitiveWinRateChart {
  private readonly localeService = inject(LocaleService);
  private readonly translate = inject(TranslateService);
  private readonly winRateLabel = toSignal(this.translate.stream(analyticsChartTranslationKeys.winRate), {
    initialValue: this.translate.instant(analyticsChartTranslationKeys.winRate),
  });
  protected readonly labels = computed(() => [this.winRateLabel()]);
  readonly value = input<number | null>(null);
  protected readonly series = computed<ApexNonAxisChartSeries>(() => {
    const percent = rateToPercent(this.value());
    return percent === null ? [] : [percent];
  });
  protected readonly chart: ApexChart = {
    type: 'radialBar',
    height: 176,
    background: 'transparent',
    fontFamily: analyticsFontFamily,
    animations: { enabled: chartAnimationsEnabled(), speed: 420 },
    toolbar: { show: false },
  };
  protected readonly colors = ['#32d1ff'];
  protected readonly dataLabels: ApexDataLabels = { enabled: true };
  protected readonly stroke: ApexStroke = { lineCap: 'round' };
  protected readonly tooltip = computed<ApexTooltip>(() => {
    const locale = this.localeService.currentLocale();
    return {
      enabled: true,
      theme: 'dark',
      y: { formatter: () => formatRate(this.value(), locale) },
    };
  });
  protected readonly plotOptions = computed<ApexPlotOptions>(() => {
    const locale = this.localeService.currentLocale();
    return {
      radialBar: {
        startAngle: -132,
        endAngle: 132,
        hollow: { size: '66%', background: '#0b1118' },
        track: { background: '#222d39', strokeWidth: '92%', margin: 2 },
        dataLabels: {
          name: { show: false },
          value: {
            color: '#f3f8fb',
            fontFamily: analyticsFontFamily,
            fontSize: '22px',
            fontWeight: 700,
            offsetY: 7,
            formatter: () => formatRate(this.value(), locale),
          },
        },
      },
    };
  });
}
