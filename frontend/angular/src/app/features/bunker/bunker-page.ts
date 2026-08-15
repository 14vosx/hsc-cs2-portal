import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable, catchError, map, of, shareReplay, startWith, switchMap } from 'rxjs';

import { LocaleService } from '../../core/i18n/locale.service';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { PlayerAvatar } from '../../shared/components/player-avatar/player-avatar';
import { PlayerAuthApiService } from '../player/data-access/player-auth-api.service';
import { PlayerIdentityApiService } from '../player/data-access/player-identity-api.service';
import type { PlayerIdentity } from '../player/domain/player-identity.model';
import { BunkerAuthCard } from './components/bunker-auth-card/bunker-auth-card';
import { CompetitiveImpactTrendChart } from './components/analytics/competitive-impact-trend-chart/competitive-impact-trend-chart';
import { CompetitiveMapWinrateChart } from './components/analytics/competitive-map-winrate-chart/competitive-map-winrate-chart';
import { CompetitiveMetricSparkline } from './components/analytics/competitive-metric-sparkline/competitive-metric-sparkline';
import { CompetitiveMultikillChart } from './components/analytics/competitive-multikill-chart/competitive-multikill-chart';
import { CompetitiveWinRateChart } from './components/analytics/competitive-win-rate-chart/competitive-win-rate-chart';
import { BunkerApiService } from './data-access/bunker-api.service';
import type {
  BunkerMapPerformance,
  BunkerPlayerStats,
  BunkerRecentMap,
  BunkerSummary,
  BunkerTimelineItem,
} from './domain/bunker.model';

type BunkerSummaryState = 'ready' | 'error';

interface BunkerAuthenticatedVm {
  readonly state: 'authenticated';
  readonly player: PlayerIdentity;
  readonly summary: BunkerSummary;
  readonly summaryState: BunkerSummaryState;
}

type BunkerVm =
  | BunkerAuthenticatedVm
  | { readonly state: 'loading' }
  | { readonly state: 'unauthenticated' }
  | { readonly state: 'error' };

const unavailableBunkerSummary: BunkerSummary = {
  status: null,
  seasonFirst: null,
  statsAvailable: null,
  currentSeason: null,
  seasonPlayer: null,
  competitiveProfile: null,
};

@Component({
  selector: 'app-bunker-page',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    TranslatePipe,
    EmptyState,
    PlayerAvatar,
    BunkerAuthCard,
    CompetitiveWinRateChart,
    CompetitiveMetricSparkline,
    CompetitiveImpactTrendChart,
    CompetitiveMapWinrateChart,
    CompetitiveMultikillChart,
  ],
  templateUrl: './bunker-page.html',
  styleUrl: './bunker-page.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class BunkerPage {
  private readonly localeService = inject(LocaleService);
  private readonly playerIdentityApi = inject(PlayerIdentityApiService);
  private readonly bunkerApi = inject(BunkerApiService);
  private readonly playerAuthApi = inject(PlayerAuthApiService);
  private readonly translate = inject(TranslateService);

  protected readonly steamLoginUrl = this.playerAuthApi.steamLoginUrl;
  protected readonly vm$: Observable<BunkerVm> = this.loadVm().pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected formatInteger(value: number | null | undefined): string {
    if (!isFiniteNumber(value)) {
      return '—';
    }

    return new Intl.NumberFormat(this.localeService.currentLocale(), { maximumFractionDigits: 0 }).format(value);
  }

  protected formatDecimal(value: number | null | undefined, digits = 2): string {
    if (!isFiniteNumber(value)) {
      return '—';
    }

    return new Intl.NumberFormat(this.localeService.currentLocale(), {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  }

  protected formatRate(value: number | null | undefined): string {
    if (!isFiniteNumber(value)) {
      return '—';
    }

    const normalized = value > 1 ? value / 100 : value;

    return new Intl.NumberFormat(this.localeService.currentLocale(), {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(normalized);
  }

  protected formatDate(value: string | null | undefined): string {
    const date = parseDate(value);

    if (!date) {
      return textOrFallback(value);
    }

    return new Intl.DateTimeFormat(this.localeService.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  protected formatDateTime(value: string | null | undefined): string {
    const date = parseDate(value);

    if (!date) {
      return textOrFallback(value);
    }

    return new Intl.DateTimeFormat(this.localeService.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected textOrFallback(value: string | null | undefined): string {
    return textOrFallback(value);
  }

  protected recentMapResult(item: BunkerRecentMap): string {
    if (item.isWin === true) {
      return this.translate.instant('bunker.results.win');
    }

    if (item.isWin === false) {
      return this.translate.instant('bunker.results.loss');
    }

    return item.outcome || item.result || '—';
  }

  protected recentMapTone(item: BunkerRecentMap): string {
    if (item.isWin === true) {
      return 'is-win';
    }

    if (item.isWin === false) {
      return 'is-loss';
    }

    return '';
  }

  protected recentMapTeamScore(item: BunkerRecentMap): string {
    if (!isFiniteNumber(item.team1Score) || !isFiniteNumber(item.team2Score)) {
      return '—';
    }

    return `${this.formatInteger(item.team1Score)} x ${this.formatInteger(item.team2Score)}`;
  }

  protected timelineOutcomeClass(result: string | null): string {
    if (result === 'win') {
      return 'is-win';
    }

    if (result === 'loss') {
      return 'is-loss';
    }

    return '';
  }

  protected canonicalTrend(
    timeline: readonly BunkerTimelineItem[],
    metric: 'kdRatio' | 'impactRating',
  ): readonly (number | null)[] {
    return timeline.map((item) => {
      const value = item[metric];
      return isFiniteNumber(value) ? value : null;
    });
  }

  protected hasImpactTrend(timeline: readonly BunkerTimelineItem[]): boolean {
    return timeline.some((item) => Boolean(parseDate(item.at)) && isFiniteNumber(item.impactRating));
  }

  protected periodEntries(
    periods: Readonly<Record<string, BunkerPlayerStats>>,
  ): readonly (readonly [string, BunkerPlayerStats])[] {
    return Object.entries(periods);
  }

  protected displayedMaps(maps: readonly BunkerMapPerformance[]): readonly BunkerMapPerformance[] {
    return maps.length <= 6 ? maps : maps.slice(0, 6);
  }

  protected displayedRecentMaps(maps: readonly BunkerRecentMap[]): readonly BunkerRecentMap[] {
    return maps.length <= 5 ? maps : maps.slice(0, 5);
  }

  protected displayedTimeline(
    timeline: readonly BunkerTimelineItem[],
  ): readonly BunkerTimelineItem[] {
    return timeline.length <= 8 ? timeline : timeline.slice(0, 8);
  }

  private loadVm(): Observable<BunkerVm> {
    return this.playerIdentityApi.getCurrentIdentity().pipe(
      switchMap((identity) => {
        if (!identity) {
          return of({ state: 'unauthenticated' } satisfies BunkerVm);
        }

        return this.bunkerApi.getSummary().pipe(
          map(
            (summary): BunkerVm => ({
              state: 'authenticated',
              player: identity,
              summary,
              summaryState: 'ready',
            }),
          ),
          catchError(() =>
            of({
              state: 'authenticated',
              player: identity,
              summary: unavailableBunkerSummary,
              summaryState: 'error',
            } satisfies BunkerVm),
          ),
        );
      }),
      startWith({ state: 'loading' } satisfies BunkerVm),
      catchError((error: unknown) => of(this.errorVm(error))),
    );
  }

  private errorVm(error: unknown): BunkerVm {
    return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)
      ? { state: 'unauthenticated' }
      : { state: 'error' };
  }
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function textOrFallback(value: string | null | undefined): string {
  return value?.trim() || '—';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
