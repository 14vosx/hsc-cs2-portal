import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ViewEncapsulation, inject, signal } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';

import { Cs2ApiService } from '../../core/api/cs2-api.service';
import {
  PlayerBunkerSeasonPlayerMapDto,
  PlayerBunkerSeasonPlayerRecentMapDto,
  PlayerBunkerSeasonPlayerSummaryDto,
  PlayerBunkerSeasonPlayerTimelineItemDto,
  PlayerBunkerSummaryDataDto,
  PlayerBunkerSummaryDto,
  PlayerIdentityDto,
  PlayerMeDto,
} from '../../core/api/dto/player-bunker.dto';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

interface BunkerPlayer {
  displayName: string;
  steamid64: string;
}

interface BunkerAuthenticatedVm {
  state: 'authenticated';
  player: BunkerPlayer;
  summary: PlayerBunkerSummaryDataDto;
  summaryState: 'ready' | 'error';
}

type BunkerVm =
  | BunkerAuthenticatedVm
  | { state: 'loading' }
  | { state: 'unauthenticated' }
  | { state: 'error' };
type BunkerReloadAction = 'load' | 'signed-out';

@Component({
  selector: 'app-bunker-page',
  imports: [AsyncPipe, EmptyState],
  templateUrl: './bunker-page.html',
  styleUrl: './bunker-page.css',
  encapsulation: ViewEncapsulation.None,
})
export class BunkerPage {
  private readonly cs2Api = inject(Cs2ApiService);
  private readonly reload$ = new BehaviorSubject<BunkerReloadAction>('load');

  protected readonly logoutPending = signal(false);
  protected readonly logoutFailed = signal(false);

  protected readonly vm$: Observable<BunkerVm> = this.reload$.pipe(
    switchMap((action) => this.loadVm(action)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected loginWithSteam(): void {
    window.location.assign(this.cs2Api.playerAuthSteamStartUrl);
  }

  protected logout(): void {
    if (this.logoutPending()) {
      return;
    }

    this.logoutPending.set(true);
    this.logoutFailed.set(false);

    this.cs2Api.logoutPlayer().subscribe({
      next: () => {
        this.logoutPending.set(false);
        this.reload$.next('signed-out');
      },
      error: () => {
        this.logoutPending.set(false);
        this.logoutFailed.set(true);
      },
    });
  }

  private loadVm(action: BunkerReloadAction): Observable<BunkerVm> {
    if (action === 'signed-out') {
      return of({ state: 'unauthenticated' } satisfies BunkerVm);
    }

    return this.cs2Api.getPlayerMe().pipe(
      switchMap((payload) => this.playerVm(payload)),
      startWith({ state: 'loading' } satisfies BunkerVm),
      catchError((error: unknown) => of(this.errorVm(error))),
    );
  }

  protected summaryLabel(value?: boolean | null): string {
    if (value === true) {
      return 'sim';
    }

    if (value === false) {
      return 'não';
    }

    return 'aguardando';
  }

  protected statsAvailabilityLabel(value?: boolean | null): string {
    if (value === false) {
      return 'pendente';
    }

    return this.summaryLabel(value);
  }

  protected statusLabel(status?: string | null): string {
    if (status === 'ready') {
      return 'Identidade conectada';
    }

    return status || 'preparando';
  }

  protected summaryMessage(
    summary: PlayerBunkerSummaryDataDto,
    summaryState: BunkerAuthenticatedVm['summaryState'],
  ): string {
    if (summaryState === 'error') {
      return 'Sessão de jogador ativa. O resumo do Bunker não pôde ser carregado agora.';
    }

    if (summary.status === 'ready' && summary.statsAvailable === false) {
      return 'Sessão e identidade do jogador conectadas. Estatísticas reais ainda pendentes.';
    }

    if (summary.statsAvailable === true && summary.seasonPlayer?.summary) {
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

  protected playedLabel(summary: PlayerBunkerSeasonPlayerSummaryDto): string {
    return this.isFiniteNumber(summary.mapsPlayed) ? 'Mapas jogados' : 'Partidas jogadas';
  }

  protected playedValue(summary: PlayerBunkerSeasonPlayerSummaryDto): string {
    return this.formatInteger(summary.mapsPlayed ?? summary.matchesPlayed);
  }

  protected mapPlayedValue(mapSummary: PlayerBunkerSeasonPlayerMapDto): string {
    return this.formatInteger(mapSummary.mapsPlayed ?? mapSummary.matchesPlayed);
  }

  protected textOrFallback(value?: string | null): string {
    return value || '—';
  }

  private playerVm(payload: PlayerMeDto): Observable<BunkerVm> {
    const player = this.normalizePlayer(payload);

    if (!player) {
      return of({ state: 'unauthenticated' } satisfies BunkerVm);
    }

    return this.cs2Api.getPlayerBunkerSummary().pipe(
      map(
        (summary): BunkerVm => ({
          state: 'authenticated',
          player,
          summary: this.normalizeSummary(summary),
          summaryState: 'ready',
        }),
      ),
      catchError(() =>
        of({
          state: 'authenticated',
          player,
          summary: {},
          summaryState: 'error',
        } satisfies BunkerVm),
      ),
    );
  }

  private normalizeSummary(payload: PlayerBunkerSummaryDto): PlayerBunkerSummaryDataDto {
    const summary = payload.data?.bunker ?? payload;
    const seasonPlayer = payload.data?.seasonPlayer ?? summary.seasonPlayer;

    return {
      status: summary.status ?? null,
      seasonFirst: summary.seasonFirst ?? null,
      statsAvailable: summary.statsAvailable ?? null,
      seasonPlayer: this.normalizeSeasonPlayer(seasonPlayer),
    };
  }

  private normalizeSeasonPlayer(seasonPlayer: unknown): PlayerBunkerSummaryDataDto['seasonPlayer'] {
    if (!this.isRecord(seasonPlayer)) {
      return null;
    }

    const summary = this.normalizeSeasonPlayerSummary(seasonPlayer['summary']);
    const byMap = this.normalizeSeasonPlayerByMap(seasonPlayer['byMap']);
    const recentMaps = this.normalizeSeasonPlayerRecentMaps(seasonPlayer['recentMaps']);
    const timeline = this.normalizeSeasonPlayerTimeline(seasonPlayer['timeline']);

    if (!summary && byMap.length === 0 && recentMaps.length === 0 && timeline.length === 0) {
      return null;
    }

    return {
      summary,
      byMap,
      recentMaps,
      timeline,
    };
  }

  private normalizeSeasonPlayerSummary(summary: unknown): PlayerBunkerSeasonPlayerSummaryDto | null {
    if (!this.isRecord(summary)) {
      return null;
    }

    return {
      mapsPlayed: this.toOptionalNumber(summary['mapsPlayed']),
      matchesPlayed: this.toOptionalNumber(summary['matchesPlayed']),
      wins: this.toOptionalNumber(summary['wins']),
      winRate: this.toOptionalNumber(summary['winRate']),
      kdRatio: this.toOptionalNumber(summary['kdRatio']),
      adr: this.toOptionalNumber(summary['adr']),
      impactRating: this.toOptionalNumber(summary['impactRating']),
      kills: this.toOptionalNumber(summary['kills']),
      deaths: this.toOptionalNumber(summary['deaths']),
      assists: this.toOptionalNumber(summary['assists']),
    };
  }

  private normalizeSeasonPlayerByMap(byMap: unknown): PlayerBunkerSeasonPlayerMapDto[] {
    if (!Array.isArray(byMap)) {
      return [];
    }

    return byMap
      .map((item) => this.normalizeSeasonPlayerMap(item))
      .filter((item): item is PlayerBunkerSeasonPlayerMapDto => item !== null)
      .slice(0, 6);
  }

  private normalizeSeasonPlayerMap(item: unknown): PlayerBunkerSeasonPlayerMapDto | null {
    if (!this.isRecord(item)) {
      return null;
    }

    const mapSummary = {
      mapName: this.toOptionalString(item['mapName'] ?? item['mapname'] ?? item['map']),
      mapsPlayed: this.toOptionalNumber(item['mapsPlayed']),
      matchesPlayed: this.toOptionalNumber(item['matchesPlayed']),
      wins: this.toOptionalNumber(item['wins']),
      losses: this.toOptionalNumber(item['losses']),
      winRate: this.toOptionalNumber(item['winRate']),
      kdRatio: this.toOptionalNumber(item['kdRatio']),
      adr: this.toOptionalNumber(item['adr']),
      impactRating: this.toOptionalNumber(item['impactRating']),
    };

    if (!mapSummary.mapName && !this.hasMapStats(mapSummary)) {
      return null;
    }

    return mapSummary;
  }

  private normalizeSeasonPlayerRecentMaps(
    recentMaps: unknown,
  ): PlayerBunkerSeasonPlayerRecentMapDto[] {
    if (!Array.isArray(recentMaps)) {
      return [];
    }

    return recentMaps
      .map((item) => this.normalizeSeasonPlayerRecentMap(item))
      .filter((item): item is PlayerBunkerSeasonPlayerRecentMapDto => item !== null)
      .slice(0, 5);
  }

  private normalizeSeasonPlayerRecentMap(item: unknown): PlayerBunkerSeasonPlayerRecentMapDto | null {
    if (!this.isRecord(item)) {
      return null;
    }

    const recentMap = {
      mapName: this.toOptionalString(item['mapName'] ?? item['mapname'] ?? item['map']),
      startedAt: this.toOptionalString(item['startedAt'] ?? item['startTime'] ?? item['start_time']),
      matchId: this.toOptionalString(item['matchId'] ?? item['matchid']),
      mapNumber: this.toOptionalNumber(item['mapNumber'] ?? item['mapnumber']),
      result: this.toOptionalString(item['result'] ?? item['outcome']),
      score: this.toOptionalString(item['score']),
      kills: this.toOptionalNumber(item['kills']),
      deaths: this.toOptionalNumber(item['deaths']),
      assists: this.toOptionalNumber(item['assists']),
      kdRatio: this.toOptionalNumber(item['kdRatio']),
      adr: this.toOptionalNumber(item['adr']),
      impactRating: this.toOptionalNumber(item['impactRating']),
    };

    if (!this.hasRecentMapIdentity(recentMap) && !this.hasRecentMapStats(recentMap)) {
      return null;
    }

    return recentMap;
  }

  private normalizeSeasonPlayerTimeline(
    timeline: unknown,
  ): PlayerBunkerSeasonPlayerTimelineItemDto[] {
    if (!Array.isArray(timeline)) {
      return [];
    }

    return timeline
      .map((item) => this.normalizeSeasonPlayerTimelineItem(item))
      .filter((item): item is PlayerBunkerSeasonPlayerTimelineItemDto => item !== null)
      .slice(0, 8);
  }

  private normalizeSeasonPlayerTimelineItem(
    item: unknown,
  ): PlayerBunkerSeasonPlayerTimelineItemDto | null {
    if (!this.isRecord(item)) {
      return null;
    }

    const timelineItem = {
      at: this.toOptionalString(
        item['at'] ??
          item['timestamp'] ??
          item['startedAt'] ??
          item['startTime'] ??
          item['start_time'],
      ),
      event: this.toOptionalString(item['event'] ?? item['type']),
      mapName: this.toOptionalString(item['mapName'] ?? item['mapname'] ?? item['map']),
      matchId: this.toOptionalString(item['matchId'] ?? item['matchid']),
      mapNumber: this.toOptionalNumber(item['mapNumber'] ?? item['mapnumber']),
      result: this.toOptionalString(item['result'] ?? item['outcome']),
      score: this.toOptionalString(item['score']),
      kills: this.toOptionalNumber(item['kills']),
      deaths: this.toOptionalNumber(item['deaths']),
      assists: this.toOptionalNumber(item['assists']),
      kdRatio: this.toOptionalNumber(item['kdRatio']),
      adr: this.toOptionalNumber(item['adr']),
      impactRating: this.toOptionalNumber(item['impactRating']),
    };

    if (!this.hasTimelineIdentity(timelineItem) && !this.hasTimelineStats(timelineItem)) {
      return null;
    }

    return timelineItem;
  }

  private normalizePlayer(payload: PlayerMeDto): BunkerPlayer | null {
    if (payload.authenticated === false) {
      return null;
    }

    const identity = payload.player ?? payload.user ?? payload;
    const steamid64 = this.steamId(identity);

    if (!steamid64) {
      return null;
    }

    return {
      displayName: identity.displayName?.trim() || 'Jogador HSC',
      steamid64,
    };
  }

  private steamId(identity: PlayerIdentityDto): string | null {
    return identity.steamid64?.trim() || identity.steamId64?.trim() || null;
  }

  private isAuthMiss(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
  }

  private errorVm(error: unknown): BunkerVm {
    return this.isAuthMiss(error) ? { state: 'unauthenticated' } : { state: 'error' };
  }

  private toOptionalNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private toOptionalString(value: unknown): string | null {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    return null;
  }

  private hasMapStats(item: PlayerBunkerSeasonPlayerMapDto): boolean {
    return [
      item.mapsPlayed,
      item.matchesPlayed,
      item.wins,
      item.losses,
      item.winRate,
      item.kdRatio,
      item.adr,
      item.impactRating,
    ].some((value) => this.isFiniteNumber(value));
  }

  private hasRecentMapIdentity(item: PlayerBunkerSeasonPlayerRecentMapDto): boolean {
    return [
      item.mapName,
      item.startedAt,
      item.matchId,
      item.result,
      item.score,
    ].some((value) => Boolean(value));
  }

  private hasRecentMapStats(item: PlayerBunkerSeasonPlayerRecentMapDto): boolean {
    return [
      item.mapNumber,
      item.kills,
      item.deaths,
      item.assists,
      item.kdRatio,
      item.adr,
      item.impactRating,
    ].some((value) => this.isFiniteNumber(value));
  }

  private hasTimelineIdentity(item: PlayerBunkerSeasonPlayerTimelineItemDto): boolean {
    return [
      item.at,
      item.event,
      item.mapName,
      item.matchId,
      item.result,
      item.score,
    ].some((value) => Boolean(value));
  }

  private hasTimelineStats(item: PlayerBunkerSeasonPlayerTimelineItemDto): boolean {
    return [
      item.mapNumber,
      item.kills,
      item.deaths,
      item.assists,
      item.kdRatio,
      item.adr,
      item.impactRating,
    ].some((value) => this.isFiniteNumber(value));
  }

  private isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
