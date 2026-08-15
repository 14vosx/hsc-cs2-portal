import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { LocaleService } from '../../../../core/i18n/locale.service';
import { bunkerMapImage, displayBunkerMapName } from '../../bunker-map-assets';
import { bunkerMatchStableKey } from '../../bunker-match-key';
import type { BunkerMapPerformance, BunkerRecentMap } from '../../domain/bunker.model';

const RECENT_MATCH_LIMIT = 3;

type PublishedResult = 'win' | 'loss' | null;

@Component({
  selector: 'app-bunker-maps-panel',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './bunker-maps-panel.html',
  styleUrl: './bunker-maps-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BunkerMapsPanel {
  private readonly localeService = inject(LocaleService);
  private readonly translate = inject(TranslateService);

  readonly byMap = input<readonly BunkerMapPerformance[] | null | undefined>([]);
  readonly recentMaps = input<readonly BunkerRecentMap[] | null | undefined>([]);
  protected readonly selectedMapName = signal<string | null>(null);
  protected readonly selectedMap = computed(() => {
    const maps = this.byMap() ?? [];
    return maps.find((map) => map.mapName === this.selectedMapName()) ?? maps[0] ?? null;
  });
  protected readonly selectedRecentMaps = computed(() => {
    const selectedName = this.selectedMap()?.mapName;
    if (!selectedName) return [];
    return (this.recentMaps() ?? [])
      .filter((item) => item.mapName === selectedName)
      .slice(0, RECENT_MATCH_LIMIT);
  });

  constructor() {
    effect(() => {
      const maps = this.byMap() ?? [];
      const selectedName = this.selectedMapName();
      if (maps.length === 0) {
        this.selectedMapName.set(null);
      } else if (!maps.some((map) => map.mapName === selectedName)) {
        this.selectedMapName.set(maps[0].mapName);
      }
    });
  }

  protected selectMap(mapName: string | null): void {
    if ((this.byMap() ?? []).some((map) => map.mapName === mapName)) {
      this.selectedMapName.set(mapName);
    }
  }

  protected displayMapName(value: string | null | undefined): string {
    return displayBunkerMapName(value);
  }

  protected mapImage(value: string | null | undefined): string | null {
    return bunkerMapImage(value);
  }

  protected matchStableKey(match: BunkerRecentMap): string {
    return bunkerMatchStableKey(match);
  }

  protected formatVolume(value: number | null | undefined): string {
    if (!isFiniteNumber(value)) return '—';
    const count = this.formatInteger(value);
    return this.translate.instant(value === 1 ? 'bunker.maps.volume.one' : 'bunker.maps.volume.other', { count });
  }

  protected formatInteger(value: number | null | undefined): string {
    return isFiniteNumber(value)
      ? new Intl.NumberFormat(this.localeService.currentLocale(), { maximumFractionDigits: 0 }).format(value)
      : '—';
  }

  protected formatDecimal(value: number | null | undefined, digits: number): string {
    return isFiniteNumber(value)
      ? new Intl.NumberFormat(this.localeService.currentLocale(), {
          minimumFractionDigits: digits, maximumFractionDigits: digits,
        }).format(value)
      : '—';
  }

  protected formatRate(value: number | null | undefined): string {
    return isFiniteNumber(value)
      ? new Intl.NumberFormat(this.localeService.currentLocale(), {
          style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1,
        }).format(value)
      : '—';
  }

  protected formatHumanPercent(value: number | null | undefined): string {
    return isFiniteNumber(value) ? `${this.formatDecimal(value, 1)}%` : '—';
  }

  protected hasRate(value: number | null | undefined): value is number {
    return isFiniteNumber(value);
  }

  protected rateWidth(value: number | null | undefined): string {
    return isFiniteNumber(value) ? `${Math.min(100, Math.max(0, value * 100))}%` : '0%';
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat(this.localeService.currentLocale(), {
          day: '2-digit', month: '2-digit', year: 'numeric',
        }).format(date);
  }

  protected resultOf(item: BunkerRecentMap): PublishedResult {
    if (item.isWin === true) return 'win';
    if (item.isWin === false) return 'loss';
    const result = (item.outcome || item.result)?.trim().toLowerCase();
    return result === 'win' || result === 'loss' ? result : null;
  }

  protected resultLabel(item: BunkerRecentMap): string {
    const result = this.resultOf(item);
    return result ? this.translate.instant(`bunker.maps.results.${result}`) : '—';
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
