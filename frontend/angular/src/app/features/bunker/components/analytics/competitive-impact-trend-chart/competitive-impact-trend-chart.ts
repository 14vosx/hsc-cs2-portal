import 'apexcharts/line';

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
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
import {
  analyticsFontFamily,
  axisSeriesForChartCore,
  chartAnimationsEnabled,
  isFiniteNumber,
} from '../analytics-chart-presentation';

interface ImpactPoint {
  readonly timestamp: number;
  readonly mapName: string | null;
  readonly value: number | null;
}

@Component({
  selector: 'app-competitive-impact-trend-chart',
  imports: [ChartCoreComponent],
  template: `
    <apx-chart-core
      [series]="series()"
      [chart]="chart"
      [colors]="colors"
      [fill]="fill"
      [grid]="grid"
      [markers]="markers"
      [stroke]="stroke"
      [tooltip]="tooltip()"
      [xaxis]="xaxis"
      [yaxis]="yaxis"
    />
  `,
  styles: `:host { display: block; min-width: 0; } apx-chart-core { width: 100%; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompetitiveImpactTrendChart {
  readonly timeline = input<readonly BunkerTimelineItem[]>([]);

  protected readonly points = computed<readonly ImpactPoint[]>(() =>
    this.timeline().flatMap((item) => {
      if (!item.at) {
        return [];
      }

      const timestamp = new Date(item.at).getTime();

      if (!Number.isFinite(timestamp)) {
        return [];
      }

      return [{
        timestamp,
        mapName: item.mapName,
        value: isFiniteNumber(item.impactRating) ? item.impactRating : null,
      }];
    }),
  );
  protected readonly series = computed(() => axisSeriesForChartCore([{
    name: 'Impact',
    data: this.points().map((point) => ({ x: point.timestamp, y: point.value })),
  }] satisfies ApexAxisChartSeries));
  protected readonly tooltip = computed<ApexTooltip>(() => ({
    enabled: true,
    theme: 'dark',
    custom: (options: ApexTooltipCustomOpts) => this.tooltipContent(options.dataPointIndex),
  }));
  protected readonly chart: ApexChart = {
    type: 'area',
    height: 310,
    background: 'transparent',
    fontFamily: analyticsFontFamily,
    animations: { enabled: chartAnimationsEnabled(), speed: 480 },
    toolbar: { show: false },
    zoom: { enabled: false },
  };
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
    type: 'datetime',
    labels: { style: { colors: '#6f7d89', fontFamily: analyticsFontFamily } },
    axisBorder: { color: 'rgba(193, 203, 210, 0.12)' },
    axisTicks: { color: 'rgba(193, 203, 210, 0.12)' },
  };
  protected readonly yaxis: ApexYAxis = {
    labels: {
      formatter: (value) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value),
      style: { colors: ['#6f7d89'], fontFamily: analyticsFontFamily },
    },
  };

  private tooltipContent(index: number): string {
    const point = this.points()[index];

    if (!point) {
      return '';
    }

    const date = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(point.timestamp));
    const map = escapeHtml(point.mapName || 'Mapa não informado');
    const impact = point.value === null
      ? '—'
      : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(point.value);

    return `<div class="competitive-chart-tooltip"><strong>${map}</strong><span>${date}</span><b>Impact ${impact}</b></div>`;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
