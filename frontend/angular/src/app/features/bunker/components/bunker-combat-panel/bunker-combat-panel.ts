import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { LocaleService } from '../../../../core/i18n/locale.service';
import type { BunkerPlayerStats } from '../../domain/bunker.model';

type MultikillState = 'data' | 'zero' | 'partial' | 'empty';

interface MultikillRow {
  readonly label: '2K' | '3K' | '4K' | '5K';
  readonly value: number;
}

@Component({
  selector: 'app-bunker-combat-panel',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './bunker-combat-panel.html',
  styleUrl: './bunker-combat-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BunkerCombatPanel {
  private readonly localeService = inject(LocaleService);

  readonly summary = input<BunkerPlayerStats | null>(null);

  protected readonly multikillValues = computed(() => {
    const stats = this.summary();
    return stats ? [stats.enemy2ks, stats.enemy3ks, stats.enemy4ks, stats.enemy5ks] as const : [];
  });
  protected readonly multikillState = computed<MultikillState>(() => {
    const values = this.multikillValues();

    const hasFiniteValue = values.some(
      (value) => typeof value === 'number' && Number.isFinite(value),
    );

    if (!hasFiniteValue) {
      return 'empty';
    }

    const hasMissingValue = values.some(
      (value) => typeof value !== 'number' || !Number.isFinite(value),
    );

    if (hasMissingValue) {
      return 'partial';
    }

    const hasPositiveValue = values.some(
      (value) =>
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value > 0,
    );

    return hasPositiveValue ? 'data' : 'zero';
  });
  protected readonly distributionRows = computed<readonly MultikillRow[]>(() => {
    const stats = this.summary();
    return stats ? [
      { label: '2K', value: stats.enemy2ks as number },
      { label: '3K', value: stats.enemy3ks as number },
      { label: '4K', value: stats.enemy4ks as number },
      { label: '5K', value: stats.enemy5ks as number },
    ] : [];
  });
  protected readonly visualMax = computed(() =>
    Math.max(...this.distributionRows().map((row) => row.value)),
  );

  protected formatCounter(value: number | null | undefined): string {
    if (!isFiniteNumber(value)) {
      return '—';
    }

    return new Intl.NumberFormat(this.localeService.currentLocale(), { maximumFractionDigits: 0 }).format(value);
  }

  protected formatSuccess(wins: number | null | undefined, count: number | null | undefined): string {
    return `${this.formatCounter(wins)} / ${this.formatCounter(count)}`;
  }

  protected formatRate(value: number | null | undefined): string {
    if (!isFiniteNumber(value)) {
      return '—';
    }

    return new Intl.NumberFormat(this.localeService.currentLocale(), {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  protected rateWidth(value: number | null | undefined): string {
    if (!isFiniteNumber(value)) {
      return '0%';
    }

    return `${Math.min(100, Math.max(0, value * 100))}%`;
  }

  protected hasRate(value: number | null | undefined): value is number {
    return isFiniteNumber(value);
  }

  protected distributionWidth(value: number): string {
    return `${(value / this.visualMax()) * 100}%`;
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
