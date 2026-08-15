import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { LocaleService } from '../../../../core/i18n/locale.service';
import { bunkerMapImage, displayBunkerMapName } from '../../bunker-map-assets';
import { bunkerMatchStableKey } from '../../bunker-match-key';
import type { BunkerRecentMap } from '../../domain/bunker.model';
import { CompetitiveKdaChart } from '../analytics/competitive-kda-chart/competitive-kda-chart';

type PublishedResult = 'win' | 'loss' | null;
type ResultFilter = 'all' | 'win' | 'loss';
type MultikillState = 'positive' | 'zero' | 'unavailable';

const RECENT_FORM_LIMIT = 12;

@Component({
  selector: 'app-bunker-match-history-panel',
  standalone: true,
  imports: [TranslatePipe, CompetitiveKdaChart],
  templateUrl: './bunker-match-history-panel.html',
  styleUrl: './bunker-match-history-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BunkerMatchHistoryPanel {
  private readonly localeService = inject(LocaleService);
  private readonly translate = inject(TranslateService);

  readonly recentMaps = input<readonly BunkerRecentMap[] | null | undefined>([]);
  protected readonly mapFilter = signal('all');
  protected readonly resultFilter = signal<ResultFilter>('all');
  protected readonly selectedMatchKey = signal<string | null>(null);
  protected readonly detailRevealAlternate = signal(false);
  protected readonly recentFormMatches = computed(() => (this.recentMaps() ?? []).slice(0, RECENT_FORM_LIMIT));
  protected readonly mapOptions = computed<readonly string[]>(() => {
    const seen = new Set<string>();
    const options: string[] = [];
    for (const match of this.recentMaps() ?? []) {
      if (match.mapName && !seen.has(match.mapName)) {
        seen.add(match.mapName);
        options.push(match.mapName);
      }
    }
    return options;
  });
  protected readonly filteredMatches = computed(() => {
    const mapFilter = this.mapFilter();
    const resultFilter = this.resultFilter();
    return (this.recentMaps() ?? []).filter((match) =>
      (mapFilter === 'all' || match.mapName === mapFilter) &&
      (resultFilter === 'all' || this.resultOf(match) === resultFilter),
    );
  });
  protected readonly selectedMatch = computed(() => {
    const matches = this.filteredMatches();
    const selectedKey = this.selectedMatchKey();
    return matches.find((match) => this.matchStableKey(match) === selectedKey) ?? matches[0] ?? null;
  });
  constructor() {
    effect(() => {
      const matches = this.filteredMatches();
      const selectedKey = this.selectedMatchKey();
      if (matches.length === 0) {
        this.updateSelectedMatchKey(null);
      } else if (!matches.some((match) => this.matchStableKey(match) === selectedKey)) {
        this.updateSelectedMatchKey(this.matchStableKey(matches[0]));
      }
    });
  }

  protected selectMatch(match: BunkerRecentMap): void {
    if (this.filteredMatches().includes(match)) {
      this.updateSelectedMatchKey(this.matchStableKey(match));
    }
  }

  protected isSelected(match: BunkerRecentMap): boolean {
    return this.selectedMatchKey() === this.matchStableKey(match);
  }

  protected matchStableKey(match: BunkerRecentMap): string {
    return bunkerMatchStableKey(match);
  }

  protected selectMapFilter(value: string): void {
    this.mapFilter.set(value);
  }

  protected selectResultFilter(value: string): void {
    if (value === 'all' || value === 'win' || value === 'loss') {
      this.resultFilter.set(value);
    }
  }

  protected displayMapName(value: string | null | undefined): string {
    return displayBunkerMapName(value);
  }

  protected mapImage(value: string | null | undefined): string | null {
    return bunkerMapImage(value);
  }

  protected formatInteger(value: number | null | undefined): string {
    return isFiniteNumber(value)
      ? new Intl.NumberFormat(this.localeService.currentLocale(), { maximumFractionDigits: 0 }).format(value)
      : '—';
  }

  protected formatDecimal(value: number | null | undefined, digits: number): string {
    return isFiniteNumber(value)
      ? new Intl.NumberFormat(this.localeService.currentLocale(), {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }).format(value)
      : '—';
  }

  protected formatDate(value: string | null | undefined, long = false): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(this.localeService.currentLocale(), long
      ? { day: '2-digit', month: 'short', year: 'numeric' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }

  protected textOrFallback(value: string | null | undefined): string {
    return value?.trim() || '—';
  }

  protected resultOf(match: BunkerRecentMap): PublishedResult {
    if (match.isWin === true) return 'win';
    if (match.isWin === false) return 'loss';
    for (const publishedValue of [match.outcome, match.result]) {
      const result = publishedValue?.trim().toLowerCase();
      if (result === 'win' || result === 'loss') return result;
    }
    return null;
  }

  protected resultLabel(match: BunkerRecentMap): string {
    const result = this.resultOf(match);
    return result ? this.translate.instant(`bunker.matchHistory.results.${result}`) : '—';
  }

  protected resultShortLabel(match: BunkerRecentMap): string {
    const result = this.resultOf(match);
    return result ? this.translate.instant(`bunker.matchHistory.results.${result}Short`) : '—';
  }

  protected attemptPips(count: number | null | undefined): readonly number[] {
    return isFiniteNumber(count) && count > 0
      ? Array.from({ length: Math.floor(count) }, (_, index) => index)
      : [];
  }

  protected isWonPip(index: number, wins: number | null | undefined): boolean {
    return isFiniteNumber(wins) && index < wins;
  }

  protected positiveMultikills(match: BunkerRecentMap): readonly { readonly label: string; readonly value: number }[] {
    return [
      { label: '2K', value: match.enemy2ks },
      { label: '3K', value: match.enemy3ks },
      { label: '4K', value: match.enemy4ks },
      { label: '5K', value: match.enemy5ks },
    ].filter((item): item is { label: string; value: number } => isFiniteNumber(item.value) && item.value > 0);
  }

  protected multikillState(match: BunkerRecentMap): MultikillState {
    if (this.positiveMultikills(match).length > 0) return 'positive';
    const values = [match.enemy2ks, match.enemy3ks, match.enemy4ks, match.enemy5ks];
    return values.every((value) => isFiniteNumber(value)) ? 'zero' : 'unavailable';
  }

  private updateSelectedMatchKey(key: string | null): void {
    if (this.selectedMatchKey() === key) return;
    this.selectedMatchKey.set(key);
    this.detailRevealAlternate.update((value) => !value);
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
