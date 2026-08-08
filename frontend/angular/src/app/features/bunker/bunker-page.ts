import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  firstValueFrom,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';

import { PlayerIdentityApiService } from '../player/data-access/player-identity-api.service';
import { PlayerAuthApiService } from '../player/data-access/player-auth-api.service';
import type { PlayerIdentity } from '../player/domain/player-identity.model';
import { BunkerApiService } from './data-access/bunker-api.service';
import type {
  BunkerMapPerformance,
  BunkerPlayerStats,
  BunkerRecentMap,
  BunkerSummary,
  BunkerTimelineItem,
} from './domain/bunker.model';
import { BunkerAuthCard } from './components/bunker-auth-card/bunker-auth-card';
import { BunkerPlayerHeader } from './components/bunker-player-header/bunker-player-header';
import { BunkerSeasonInfo, type BunkerSummaryState } from './components/bunker-season-info/bunker-season-info';
import { BunkerSectionNav } from './components/bunker-section-nav/bunker-section-nav';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

interface BunkerAuthenticatedVm {
  state: 'authenticated';
  player: PlayerIdentity;
  summary: BunkerSummary;
  summaryState: BunkerSummaryState;
}

type BunkerVm =
  | BunkerAuthenticatedVm
  | { state: 'loading' }
  | { state: 'unauthenticated' }
  | { state: 'error' };

type BunkerReloadAction = 'load' | 'signed-out';

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
    EmptyState,
    BunkerAuthCard,
    BunkerPlayerHeader,
    BunkerSeasonInfo,
    BunkerSectionNav,
  ],
  templateUrl: './bunker-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './bunker-page.css',
})
export class BunkerPage {
  private readonly playerIdentityApi = inject(PlayerIdentityApiService);
  private readonly bunkerApi = inject(BunkerApiService);
  private readonly playerAuthApi = inject(PlayerAuthApiService);

  protected readonly logoutPending = signal(false);
  protected readonly logoutFailed = signal(false);
  protected readonly steamLoginUrl = this.playerAuthApi.steamLoginUrl;

  private readonly reload$ = new BehaviorSubject<BunkerReloadAction>('load');

  protected readonly vm$: Observable<BunkerVm> = this.reload$.pipe(
    switchMap((action) => this.loadVm(action)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected async logout(): Promise<void> {
    if (this.logoutPending()) {
      return;
    }

    this.logoutPending.set(true);
    this.logoutFailed.set(false);

    try {
      await firstValueFrom(this.playerAuthApi.logout());
      this.reload$.next('signed-out');
    } catch {
      this.logoutFailed.set(true);
    } finally {
      this.logoutPending.set(false);
    }
  }

  private loadVm(action: BunkerReloadAction): Observable<BunkerVm> {
    if (action === 'signed-out') {
      return of({ state: 'unauthenticated' } satisfies BunkerVm);
    }

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

  protected summaryMessage(
    summary: BunkerSummary,
    summaryState: BunkerSummaryState,
  ): string {
    if (summaryState === 'error') {
      return 'Sessão de jogador ativa. O resumo do Bunker não pôde ser carregado agora.';
    }

    const hasLifetime = this.hasCompetitiveLifetime(summary);
    const hasSeason = summary.statsAvailable === true && Boolean(summary.seasonPlayer?.summary);

    if (hasLifetime && !hasSeason) {
      return 'Histórico competitivo geral carregado. Ainda não há estatísticas do jogador nesta Season.';
    }

    if (hasLifetime && hasSeason) {
      return 'Histórico competitivo geral e estatísticas da temporada carregados.';
    }

    if (!hasLifetime && summary.statsAvailable === false) {
      return 'Sessão e identidade do jogador conectadas. Perfil competitivo ainda pendente.';
    }

    if (hasSeason) {
      return 'Resumo competitivo da temporada carregado com dados do artifact do jogador.';
    }

    return 'Sessão de jogador ativa. O Bunker está pronto para carregar dados competitivos quando disponíveis.';
  }

  protected formatInteger(value?: number | null): string {
    if (!this.isFiniteNumber(value)) {
      return '—';
    }

    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value);
  }

  protected formatDecimal(value?: number | null, digits = 2): string {
    if (!this.isFiniteNumber(value)) {
      return '—';
    }

    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  }

  protected formatPercent(value?: number | null): string {
    if (!this.isFiniteNumber(value)) {
      return '—';
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  protected formatRatePercent(value?: number | null, digits = 1): string {
    if (!this.isFiniteNumber(value)) {
      return '—';
    }

    const rate = value > 1 ? value / 100 : value;

    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(rate);
  }

  protected playedLabel(summary: BunkerPlayerStats): string {
    return this.isFiniteNumber(summary.mapsPlayed) ? 'Mapas jogados' : 'Partidas jogadas';
  }

  protected playedValue(summary: BunkerPlayerStats): string {
    return this.formatInteger(summary.mapsPlayed ?? summary.matchesPlayed);
  }

  protected mapPlayedValue(mapSummary: BunkerMapPerformance): string {
    return this.formatInteger(mapSummary.mapsPlayed ?? mapSummary.matchesPlayed);
  }

  protected hasCompetitiveLifetime(summary: BunkerSummary): boolean {
    return Boolean(summary.competitiveProfile?.lifetime);
  }

  protected formatDateLabel(value?: string | null): string {
    const date = this.parseDate(value);

    if (!date) {
      return this.textOrFallback(value);
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  protected recentMapResultLabel(item: BunkerRecentMap): string {
    if (item.isWin === true) {
      return 'Vitória';
    }

    if (item.isWin === false) {
      return 'Derrota';
    }

    return item.result || item.outcome || 'Resultado —';
  }

  protected resultToneClass(item: { isWin?: boolean | null; result?: string | null; outcome?: string | null }): string {
    const result = `${item.result ?? item.outcome ?? ''}`.toLowerCase();

    if (item.isWin === true || result.includes('vit') || result.includes('win')) {
      return 'is-win';
    }

    if (item.isWin === false || result.includes('der') || result.includes('loss')) {
      return 'is-loss';
    }

    return '';
  }

  protected timelineMatchItems(
    timeline: readonly BunkerTimelineItem[],
  ): readonly BunkerTimelineItem[] {
    const matches = timeline.filter((item) => {
      const event = `${item.event ?? ''}`.toLowerCase();
      return Boolean(item.matchId) || event.includes('match') || event.includes('partida');
    });

    return matches.length > 0 ? matches : timeline;
  }

  protected timelineDateLabel(item: BunkerTimelineItem): string {
    return this.formatDateLabel(item.at);
  }

  protected timelineResultToneClass(item: BunkerTimelineItem): string {
    return this.resultToneClass(item);
  }

  protected timelineResultLabel(item: BunkerTimelineItem): string {
    return item.result || 'Resultado —';
  }

  protected recentMapScoreLabel(item: BunkerRecentMap): string {
    if (this.isFiniteNumber(item.team1Score) && this.isFiniteNumber(item.team2Score)) {
      return `${item.team1Score} x ${item.team2Score}`;
    }

    return item.score || 'Score —';
  }

  protected rateToneClass(value?: number | null): string {
    if (!this.isFiniteNumber(value)) {
      return '';
    }

    const rate = value > 1 ? value / 100 : value;

    if (rate >= 0.55) {
      return 'is-good';
    }

    if (rate < 0.5) {
      return 'is-bad';
    }

    return '';
  }

  protected recentMapKd(item: BunkerRecentMap): number | null {
    if (this.isFiniteNumber(item.kdRatio)) {
      return item.kdRatio;
    }

    if (!this.isFiniteNumber(item.kills) || !this.isFiniteNumber(item.deaths)) {
      return null;
    }

    return item.deaths > 0 ? item.kills / item.deaths : item.kills;
  }

  protected recentMapAdr(item: BunkerRecentMap): number | null {
    if (this.isFiniteNumber(item.adr)) {
      return item.adr;
    }

    if (!this.isFiniteNumber(item.damage) || !this.isFiniteNumber(item.rounds) || item.rounds <= 0) {
      return null;
    }

    return item.damage / item.rounds;
  }

  protected recentMapHsPct(item: BunkerRecentMap): number | null {
    if (!this.isFiniteNumber(item.headShotKills) || !this.isFiniteNumber(item.kills) || item.kills <= 0) {
      return null;
    }

    return item.headShotKills / item.kills;
  }

  protected recentMapAccuracy(item: BunkerRecentMap): number | null {
    if (
      !this.isFiniteNumber(item.shotsOnTargetTotal) ||
      !this.isFiniteNumber(item.shotsFiredTotal) ||
      item.shotsFiredTotal <= 0
    ) {
      return null;
    }

    return item.shotsOnTargetTotal / item.shotsFiredTotal;
  }

  protected multiKillItems(item: {
    enemy2ks?: number | null;
    enemy3ks?: number | null;
    enemy4ks?: number | null;
    enemy5ks?: number | null;
  }): { label: string; value: string }[] {
    return [
      { label: '2K', value: this.formatInteger(item.enemy2ks) },
      { label: '3K', value: this.formatInteger(item.enemy3ks) },
      { label: '4K', value: this.formatInteger(item.enemy4ks) },
      { label: '5K', value: this.formatInteger(item.enemy5ks) },
    ];
  }

  protected clutchItems(item: {
    v1Count?: number | null;
    v1Wins?: number | null;
    v1WinRate?: number | null;
    v2Count?: number | null;
    v2Wins?: number | null;
    v2WinRate?: number | null;
  }): { label: string; value: string; rate: string }[] {
    return [
      {
        label: '1v1',
        value: `${this.formatInteger(item.v1Wins)}/${this.formatInteger(item.v1Count)}`,
        rate: this.formatRatePercent(item.v1WinRate),
      },
      {
        label: '1v2',
        value: `${this.formatInteger(item.v2Wins)}/${this.formatInteger(item.v2Count)}`,
        rate: this.formatRatePercent(item.v2WinRate),
      },
    ];
  }

  protected mostPlayedMap(byMap: readonly BunkerMapPerformance[]): BunkerMapPerformance | null {
    return this.bestMapBy(byMap, (item) => item.mapsPlayed ?? item.matchesPlayed);
  }

  protected bestAdrMap(byMap: readonly BunkerMapPerformance[]): BunkerMapPerformance | null {
    return this.bestMapBy(byMap, (item) => item.adr);
  }

  protected bestWinRateMap(byMap: readonly BunkerMapPerformance[]): BunkerMapPerformance | null {
    return this.bestMapBy(byMap, (item) => item.winRate);
  }

  protected attentionMap(byMap: readonly BunkerMapPerformance[]): BunkerMapPerformance | null {
    return this.bestMapBy(byMap, (item) => (this.isFiniteNumber(item.winRate) ? 1 - item.winRate : null));
  }

  protected bestTimelineItem(
    timeline: readonly BunkerTimelineItem[],
  ): BunkerTimelineItem | null {
    return this.bestTimelineBy(timeline, 1);
  }

  protected worstTimelineItem(
    timeline: readonly BunkerTimelineItem[],
  ): BunkerTimelineItem | null {
    return this.bestTimelineBy(timeline, -1);
  }

  protected timelineSparklinePoints(timeline: readonly BunkerTimelineItem[]): string {
    const values = this.timelineMatchItems(timeline)
      .map((item) => item.impactRating ?? item.adr ?? item.kdRatio)
      .filter((value): value is number => this.isFiniteNumber(value));

    if (values.length === 0) {
      return '';
    }

    if (values.length === 1) {
      return '0,20 100,20';
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min || 1;

    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * 100;
        const y = 36 - ((value - min) / spread) * 32;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  protected ringValue(value?: number | null, max = 1): string {
    if (!this.isFiniteNumber(value) || max <= 0) {
      return '0%';
    }

    return `${Math.min(Math.max((value / max) * 100, 0), 100)}%`;
  }

  protected textOrFallback(value?: string | null): string {
    return value || '—';
  }

  private isAuthMiss(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
  }

  private errorVm(error: unknown): BunkerVm {
    return this.isAuthMiss(error) ? { state: 'unauthenticated' } : { state: 'error' };
  }

  private parseDate(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (dateOnly) {
      return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private bestMapBy(
    byMap: readonly BunkerMapPerformance[],
    valueFor: (item: BunkerMapPerformance) => number | null | undefined,
  ): BunkerMapPerformance | null {
    return byMap.reduce<BunkerMapPerformance | null>((best, item) => {
      const value = valueFor(item);

      if (!this.isFiniteNumber(value)) {
        return best;
      }

      const bestValue = best ? valueFor(best) : null;
      return !this.isFiniteNumber(bestValue) || value > bestValue ? item : best;
    }, null);
  }

  private bestTimelineBy(
    timeline: readonly BunkerTimelineItem[],
    direction: 1 | -1,
  ): BunkerTimelineItem | null {
    return timeline.reduce<BunkerTimelineItem | null>((best, item) => {
      const value = item.impactRating ?? item.adr ?? item.kdRatio;

      if (!this.isFiniteNumber(value)) {
        return best;
      }

      const bestValue = best ? best.impactRating ?? best.adr ?? best.kdRatio : null;

      if (!this.isFiniteNumber(bestValue)) {
        return item;
      }

      return direction === 1 ? (value > bestValue ? item : best) : value < bestValue ? item : best;
    }, null);
  }

  private isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }
}
