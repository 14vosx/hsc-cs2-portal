import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { LocaleService } from '../../../../core/i18n/locale.service';
import type { AnalyticsContext } from '../../bunker-analytics.types';
import type { BunkerPlayerStats, BunkerTimelineItem } from '../../domain/bunker.model';
import { BunkerMotionRegistry } from '../../motion/bunker-motion-registry';
import { ViewportOnce } from '../../motion/viewport-once';
import { CompetitiveImpactTrendChart } from '../analytics/competitive-impact-trend-chart/competitive-impact-trend-chart';

interface ChartRelease {
  readonly key: string;
  readonly animate: boolean;
}

@Component({
  selector: 'app-bunker-overview-panel',
  standalone: true,
  imports: [TranslatePipe, ViewportOnce, CompetitiveImpactTrendChart],
  templateUrl: './bunker-overview-panel.html',
  styleUrl: './bunker-overview-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BunkerOverviewPanel {
  private readonly localeService = inject(LocaleService);
  protected readonly motionRegistry = inject(BunkerMotionRegistry);

  readonly summary = input<BunkerPlayerStats | null>(null);
  readonly timeline = input<readonly BunkerTimelineItem[]>([]);
  readonly context = input.required<AnalyticsContext>();

  protected readonly hasImpactTimeline = computed(() =>
    this.timeline().some((item) => isFiniteNumber(item.impactRating)),
  );
  protected readonly motionKey = computed(() => `overview:${this.context()}:impact`);
  protected readonly chartRelease = signal<ChartRelease | null>(null);
  private readonly trendViewport = viewChild(ViewportOnce);

  constructor() {
    effect(() => {
      if (!this.hasImpactTimeline()) {
        return;
      }

      const reducedMotion = this.motionRegistry.reducedMotion();
      if (!reducedMotion && !this.trendViewport()?.hasEnteredViewport()) {
        return;
      }

      const key = this.motionKey();
      this.releaseChart(key, !reducedMotion && !this.motionRegistry.hasPlayed(key));
    });
  }

  protected formatDecimal(value: number | null | undefined, digits = 2): string {
    return this.formatNumber(value, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  protected formatInteger(value: number | null | undefined): string {
    return this.formatNumber(value, { maximumFractionDigits: 0 });
  }

  protected formatHumanPercent(value: number | null | undefined): string {
    if (!isFiniteNumber(value)) {
      return '—';
    }

    return `${this.formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  }

  protected formatRatioPercent(value: number | null | undefined): string {
    if (!isFiniteNumber(value)) {
      return '—';
    }

    return new Intl.NumberFormat(this.localeService.currentLocale(), {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  private releaseChart(key: string, animate: boolean): void {
    if (this.chartRelease()?.key === key) {
      return;
    }

    this.chartRelease.set({ key, animate });
    this.motionRegistry.markPlayed(key);
  }

  private formatNumber(value: number | null | undefined, options: Intl.NumberFormatOptions): string {
    if (!isFiniteNumber(value)) {
      return '—';
    }

    return new Intl.NumberFormat(this.localeService.currentLocale(), options).format(value);
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
