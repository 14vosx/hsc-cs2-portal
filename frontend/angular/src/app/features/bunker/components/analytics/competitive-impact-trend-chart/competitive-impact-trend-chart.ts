import 'apexcharts/line';

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { ChartCoreComponent } from 'ng-apexcharts';
import type {
  ApexAxisChartSeries,
  ApexChart,
  ApexFill,
  ApexGrid,
  ApexMarkers,
  ApexStroke,
  ApexTooltip,
  ApexTooltipCustomOpts,
  ApexXAxis,
  ApexYAxis,
} from 'apexcharts';

import type { BunkerTimelineItem } from '../../../domain/bunker.model';
import { LocaleService } from '../../../../../core/i18n/locale.service';
import {
  analyticsChartTranslationKeys,
  analyticsFontFamily,
  axisSeriesForChartCore,
  chartAnimationsEnabled,
  isFiniteNumber,
} from '../analytics-chart-presentation';

interface ImpactPoint {
  readonly position: number;
  readonly at: string | null;
  readonly mapName: string | null;
  readonly matchId: string | null;
  readonly value: number | null;
}

@Component({
  selector: 'app-competitive-impact-trend-chart',
  imports: [ChartCoreComponent],
  template: `
    <apx-chart-core
      [series]="series()"
      [chart]="chart()"
      [colors]="colors"
      [fill]="fill"
      [grid]="grid"
      [markers]="markers"
      [stroke]="stroke"
      [tooltip]="tooltip()"
      [xaxis]="xaxis"
      [yaxis]="yaxis()"
    />
  `,
  styles: `:host { display: block; min-width: 0; } apx-chart-core { width: 100%; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompetitiveImpactTrendChart {
  private readonly localeService = inject(LocaleService);
  private readonly translate = inject(TranslateService);
  private readonly mapUnavailable = toSignal(this.translate.stream(analyticsChartTranslationKeys.mapUnavailable), {
    initialValue: this.translate.instant(analyticsChartTranslationKeys.mapUnavailable),
  });
  readonly timeline = input<readonly BunkerTimelineItem[]>([]);
  readonly animate = input(true);

  protected readonly points = computed<readonly ImpactPoint[]>(() =>
    this.timeline().map((item, index) => ({
      position: index + 1,
      at: item.at,
      mapName: item.mapName,
      matchId: item.matchId,
      value: isFiniteNumber(item.impactRating) ? item.impactRating : null,
    })),
  );
  protected readonly series = computed(() => axisSeriesForChartCore([{
    name: 'Impact',
    data: this.points().map((point) => ({ x: point.position, y: point.value })),
  }] satisfies ApexAxisChartSeries));
  protected readonly tooltip = computed<ApexTooltip>(() => {
    const locale = this.localeService.currentLocale();
    return {
      enabled: true,
      theme: 'dark',
      custom: (options: ApexTooltipCustomOpts) => this.tooltipContent(options.dataPointIndex, locale),
    };
  });
  protected readonly chart = computed<ApexChart>(() => ({
    type: 'area',
    height: 310,
    background: 'transparent',
    fontFamily: analyticsFontFamily,
    animations: { enabled: this.animate() && chartAnimationsEnabled(), speed: 480 },
    toolbar: { show: false },
    zoom: { enabled: false },
  }));
  protected readonly colors = ['#32d1ff'];
  protected readonly fill: ApexFill = {
    type: 'gradient',
    gradient: { shadeIntensity: 0.35, opacityFrom: 0.38, opacityTo: 0.03, stops: [0, 92] },
  };
  protected readonly grid: ApexGrid = {
    borderColor: 'rgba(193, 203, 210, 0.10)',
    strokeDashArray: 3,
    padding: { left: 10, right: 16 },
  };
  protected readonly markers: ApexMarkers = {
    size: 4,
    strokeWidth: 2,
    strokeColors: '#0b1118',
    hover: { size: 6 },
  };
  protected readonly stroke: ApexStroke = { curve: 'smooth', width: 2.5 };
  protected readonly xaxis: ApexXAxis = {
    type: 'numeric',
    decimalsInFloat: 0,
    labels: {
      formatter: (value) => `${Math.round(Number(value))}`,
      style: { colors: '#6f7d89', fontFamily: analyticsFontFamily },
    },
    axisBorder: { color: 'rgba(193, 203, 210, 0.12)' },
    axisTicks: { color: 'rgba(193, 203, 210, 0.12)' },
  };
  protected readonly yaxis = computed<ApexYAxis>(() => {
    const locale = this.localeService.currentLocale();
    return {
      labels: {
        formatter: (value) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value),
        style: { colors: ['#6f7d89'], fontFamily: analyticsFontFamily },
      },
    };
  });

  private tooltipContent(index: number, locale: string): string {
    const point = this.points()[index];

    if (!point) {
      return '';
    }

    const date = formatTimelineDate(point.at, locale);
    const map = escapeHtml(point.mapName || this.mapUnavailable());
    const impact = point.value === null
      ? '—'
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(point.value);

    return `<div class="competitive-chart-tooltip"><strong>${map}</strong><span>${date}</span><b>Impact ${impact}</b></div>`;
  }
}

function formatTimelineDate(value: string | null, locale: string): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
