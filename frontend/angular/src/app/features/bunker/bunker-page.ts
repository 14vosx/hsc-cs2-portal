import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable, catchError, map, of, shareReplay, startWith, switchMap } from 'rxjs';

import { LocaleService } from '../../core/i18n/locale.service';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { PlayerAuthApiService } from '../player/data-access/player-auth-api.service';
import { PlayerIdentityApiService } from '../player/data-access/player-identity-api.service';
import type { PlayerIdentity } from '../player/domain/player-identity.model';
import { BunkerAnalyticsHeader } from './components/bunker-analytics-header/bunker-analytics-header';
import { BunkerAuthCard } from './components/bunker-auth-card/bunker-auth-card';
import { BunkerCombatPanel } from './components/bunker-combat-panel/bunker-combat-panel';
import { BunkerMatchHistoryPanel } from './components/bunker-match-history-panel/bunker-match-history-panel';
import { BunkerMapsPanel } from './components/bunker-maps-panel/bunker-maps-panel';
import { BunkerOverviewPanel } from './components/bunker-overview-panel/bunker-overview-panel';
import { BunkerSectionNav } from './components/bunker-section-nav/bunker-section-nav';
import type {
  AnalyticsContext,
  AnalyticsTab,
  SelectedAnalyticsData,
} from './bunker-analytics.types';
import { BunkerMotionRegistry } from './motion/bunker-motion-registry';
import { BunkerApiService } from './data-access/bunker-api.service';
import type { BunkerSummary } from './domain/bunker.model';

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
    TranslatePipe,
    EmptyState,
    BunkerAnalyticsHeader,
    BunkerAuthCard,
    BunkerCombatPanel,
    BunkerMatchHistoryPanel,
    BunkerMapsPanel,
    BunkerOverviewPanel,
    BunkerSectionNav,
  ],
  templateUrl: './bunker-page.html',
  styleUrl: './bunker-page.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [BunkerMotionRegistry],
})
export class BunkerPage {
  private readonly localeService = inject(LocaleService);
  private readonly playerIdentityApi = inject(PlayerIdentityApiService);
  private readonly bunkerApi = inject(BunkerApiService);
  private readonly playerAuthApi = inject(PlayerAuthApiService);

  protected readonly steamLoginUrl = this.playerAuthApi.steamLoginUrl;
  protected readonly activeTab = signal<AnalyticsTab>('overview');
  protected readonly analyticsContext = signal<AnalyticsContext>('season');
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

  protected selectTab(tab: AnalyticsTab): void {
    this.activeTab.set(tab);
  }

  protected selectAnalyticsContext(context: AnalyticsContext): void {
    this.analyticsContext.set(context);
  }

  protected selectedAnalyticsData(summary: BunkerSummary): SelectedAnalyticsData | null {
    if (this.analyticsContext() === 'season') {
      const season = summary.seasonPlayer;

      return season
        ? {
            summary: season.summary,
            periods: season.periods,
            byMap: season.byMap,
            recentMaps: season.recentMaps,
            timeline: season.timeline,
          }
        : null;
    }

    const lifetime = summary.competitiveProfile;

    return lifetime
      ? {
          summary: lifetime.lifetime,
          periods: lifetime.periods,
          byMap: lifetime.byMap,
          recentMaps: lifetime.recentMaps,
          timeline: lifetime.timeline,
        }
      : null;
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
