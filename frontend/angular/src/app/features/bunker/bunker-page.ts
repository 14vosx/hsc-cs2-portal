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
  avatarMedium?: string | null;
  steamProfileUrl?: string | null;
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
  protected readonly activeSection = signal('bunker-summary');

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

  protected playedLabel(summary: PlayerBunkerSeasonPlayerSummaryDto): string {
    return this.isFiniteNumber(summary.mapsPlayed) ? 'Mapas jogados' : 'Partidas jogadas';
  }

  protected playedValue(summary: PlayerBunkerSeasonPlayerSummaryDto): string {
    return this.formatInteger(summary.mapsPlayed ?? summary.matchesPlayed);
  }

  protected mapPlayedValue(mapSummary: PlayerBunkerSeasonPlayerMapDto): string {
    return this.formatInteger(mapSummary.mapsPlayed ?? mapSummary.matchesPlayed);
  }

  protected playerName(vm: BunkerAuthenticatedVm): string {
    return (
      vm.summary.seasonPlayer?.name?.trim() ||
      vm.summary.competitiveProfile?.name?.trim() ||
      vm.player.displayName ||
      'Jogador HSC'
    );
  }

  protected playerSteamId(vm: BunkerAuthenticatedVm): string {
    return (
      vm.summary.seasonPlayer?.steamid64?.trim() ||
      vm.summary.competitiveProfile?.steamid64?.trim() ||
      vm.player.steamid64
    );
  }

  protected playerAvatarUrl(vm: BunkerAuthenticatedVm): string | null {
    return vm.summary.competitiveProfile?.avatarMedium || vm.player.avatarMedium || null;
  }

  protected playerSteamProfileUrl(vm: BunkerAuthenticatedVm): string | null {
    return vm.summary.competitiveProfile?.steamProfileUrl || vm.player.steamProfileUrl || null;
  }

  protected hasCompetitiveLifetime(summary: PlayerBunkerSummaryDataDto): boolean {
    return Boolean(summary.competitiveProfile?.lifetime);
  }

  protected playerInitials(vm: BunkerAuthenticatedVm): string {
    const name = this.playerName(vm);
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('');

    return initials.toUpperCase() || 'HSC';
  }

  protected seasonSlugLabel(summary: PlayerBunkerSummaryDataDto): string {
    return this.seasonTitle(summary);
  }

  protected seasonScopeLabel(summary: PlayerBunkerSummaryDataDto): string {
    const scope = summary.currentSeason?.scope;

    if (!scope?.startAt && !scope?.endAt) {
      return 'Período —';
    }

    return `${this.formatDateLabel(scope.startAt)} a ${this.formatDateLabel(scope.endAt)}`;
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

  protected formatDateTimeLabel(value?: string | null): string {
    const date = this.parseDate(value);

    if (!date) {
      return this.textOrFallback(value);
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected scrollToSection(id: string): void {
    this.activeSection.set(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected navButtonClass(id: string): string {
    return this.activeSection() === id ? 'is-active' : '';
  }

  protected seasonTitle(summary: PlayerBunkerSummaryDataDto): string {
    return summary.currentSeason?.name || (summary.currentSeason?.slug ? `Season ${summary.currentSeason.slug}` : 'Season —');
  }

  protected seasonStatusLabel(summary: PlayerBunkerSummaryDataDto): string {
    const status = `${summary.currentSeason?.status || summary.status || ''}`.toLowerCase();

    if (['active', 'ativo'].includes(status)) {
      return 'active';
    }

    if (['inactive', 'inativo', 'closed', 'archived'].includes(status)) {
      return status;
    }

    return summary.currentSeason?.status || summary.status || 'preparando';
  }

  protected seasonStatusToneClass(summary: PlayerBunkerSummaryDataDto): string {
    const status = `${summary.currentSeason?.status || summary.status || ''}`.toLowerCase();

    if (['active', 'ativo'].includes(status)) {
      return 'bpill is-win';
    }

    if (['inactive', 'inativo', 'closed', 'archived'].includes(status)) {
      return 'bpill is-loss';
    }

    return 'bpill';
  }

  protected dataUpdatedLabel(summary: PlayerBunkerSummaryDataDto): string {
    return this.formatDateTimeLabel(
      summary.seasonPlayer?.generatedAt ||
      summary.competitiveProfile?.generatedAt ||
      null,
    );
  }

  protected recentMapResultLabel(item: PlayerBunkerSeasonPlayerRecentMapDto): string {
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
    timeline: PlayerBunkerSeasonPlayerTimelineItemDto[],
  ): PlayerBunkerSeasonPlayerTimelineItemDto[] {
    const matches = timeline.filter((item) => {
      const event = `${item.event ?? item.type ?? ''}`.toLowerCase();
      return Boolean(item.matchId ?? item.matchid) || event.includes('match') || event.includes('partida');
    });

    return matches.length > 0 ? matches : timeline;
  }

  protected timelineDateLabel(item: PlayerBunkerSeasonPlayerTimelineItemDto): string {
    return this.formatDateLabel(item.at ?? item.timestamp ?? item.startedAt ?? item.startTime ?? item.start_time);
  }

  protected timelineResultToneClass(item: PlayerBunkerSeasonPlayerTimelineItemDto): string {
    return this.resultToneClass(item);
  }

  protected timelineResultLabel(item: PlayerBunkerSeasonPlayerTimelineItemDto): string {
    return item.result || item.outcome || 'Resultado —';
  }

  protected recentMapScoreLabel(item: PlayerBunkerSeasonPlayerRecentMapDto): string {
    if (this.isFiniteNumber(item.team1_score) && this.isFiniteNumber(item.team2_score)) {
      return `${item.team1_score} x ${item.team2_score}`;
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

  protected recentMapKd(item: PlayerBunkerSeasonPlayerRecentMapDto): number | null {
    if (this.isFiniteNumber(item.kdRatio)) {
      return item.kdRatio;
    }

    if (!this.isFiniteNumber(item.kills) || !this.isFiniteNumber(item.deaths)) {
      return null;
    }

    return item.deaths > 0 ? item.kills / item.deaths : item.kills;
  }

  protected recentMapAdr(item: PlayerBunkerSeasonPlayerRecentMapDto): number | null {
    if (this.isFiniteNumber(item.adr)) {
      return item.adr;
    }

    if (!this.isFiniteNumber(item.damage) || !this.isFiniteNumber(item.rounds) || item.rounds <= 0) {
      return null;
    }

    return item.damage / item.rounds;
  }

  protected recentMapHsPct(item: PlayerBunkerSeasonPlayerRecentMapDto): number | null {
    if (!this.isFiniteNumber(item.head_shot_kills) || !this.isFiniteNumber(item.kills) || item.kills <= 0) {
      return null;
    }

    return item.head_shot_kills / item.kills;
  }

  protected recentMapAccuracy(item: PlayerBunkerSeasonPlayerRecentMapDto): number | null {
    if (
      !this.isFiniteNumber(item.shots_on_target_total) ||
      !this.isFiniteNumber(item.shots_fired_total) ||
      item.shots_fired_total <= 0
    ) {
      return null;
    }

    return item.shots_on_target_total / item.shots_fired_total;
  }

  protected multiKillLabel(item: {
    enemy2ks?: number | null;
    enemy3ks?: number | null;
    enemy4ks?: number | null;
    enemy5ks?: number | null;
  }): string {
    const parts = [
      ['2K', item.enemy2ks],
      ['3K', item.enemy3ks],
      ['4K', item.enemy4ks],
      ['5K', item.enemy5ks],
    ]
      .filter(([, value]) => this.isFiniteNumber(value))
      .map(([label, value]) => `${label} ${this.formatInteger(value as number)}`);

    return parts.length > 0 ? parts.join(' · ') : 'Multi-kills —';
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

  protected clutchLabel(item: {
    v1Count?: number | null;
    v1Wins?: number | null;
    v1WinRate?: number | null;
    v2Count?: number | null;
    v2Wins?: number | null;
    v2WinRate?: number | null;
    v1_count?: number | null;
    v1_wins?: number | null;
    v2_count?: number | null;
    v2_wins?: number | null;
  }): string {
    const v1Count = item.v1Count ?? item.v1_count;
    const v1Wins = item.v1Wins ?? item.v1_wins;
    const v2Count = item.v2Count ?? item.v2_count;
    const v2Wins = item.v2Wins ?? item.v2_wins;
    const v1Rate = this.isFiniteNumber(item.v1WinRate) ? ` ${this.formatRatePercent(item.v1WinRate)}` : '';
    const v2Rate = this.isFiniteNumber(item.v2WinRate) ? ` ${this.formatRatePercent(item.v2WinRate)}` : '';
    const parts = [
      this.isFiniteNumber(v1Count) || this.isFiniteNumber(v1Wins)
        ? `1v1 ${this.formatInteger(v1Wins)}/${this.formatInteger(v1Count)}${v1Rate}`
        : null,
      this.isFiniteNumber(v2Count) || this.isFiniteNumber(v2Wins)
        ? `1v2 ${this.formatInteger(v2Wins)}/${this.formatInteger(v2Count)}${v2Rate}`
        : null,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(' · ') : 'Clutches —';
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

  protected mostPlayedMap(byMap: PlayerBunkerSeasonPlayerMapDto[]): PlayerBunkerSeasonPlayerMapDto | null {
    return this.bestMapBy(byMap, (item) => item.mapsPlayed ?? item.matchesPlayed);
  }

  protected bestAdrMap(byMap: PlayerBunkerSeasonPlayerMapDto[]): PlayerBunkerSeasonPlayerMapDto | null {
    return this.bestMapBy(byMap, (item) => item.adr);
  }

  protected bestWinRateMap(byMap: PlayerBunkerSeasonPlayerMapDto[]): PlayerBunkerSeasonPlayerMapDto | null {
    return this.bestMapBy(byMap, (item) => item.winRate);
  }

  protected attentionMap(byMap: PlayerBunkerSeasonPlayerMapDto[]): PlayerBunkerSeasonPlayerMapDto | null {
    return this.bestMapBy(byMap, (item) => (this.isFiniteNumber(item.winRate) ? 1 - item.winRate : null));
  }

  protected bestTimelineItem(
    timeline: PlayerBunkerSeasonPlayerTimelineItemDto[],
  ): PlayerBunkerSeasonPlayerTimelineItemDto | null {
    return this.bestTimelineBy(timeline, 1);
  }

  protected worstTimelineItem(
    timeline: PlayerBunkerSeasonPlayerTimelineItemDto[],
  ): PlayerBunkerSeasonPlayerTimelineItemDto | null {
    return this.bestTimelineBy(timeline, -1);
  }

  protected timelineSparklinePoints(timeline: PlayerBunkerSeasonPlayerTimelineItemDto[]): string {
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
    const responsePlayer = payload.data?.player;
    const competitiveProfile = payload.data?.competitiveProfile ?? summary.competitiveProfile;
    const currentSeason = payload.data?.currentSeason ?? summary.currentSeason;
    const seasonPlayer = payload.data?.seasonPlayer ?? summary.seasonPlayer;

    return {
      status: summary.status ?? null,
      seasonFirst: summary.seasonFirst ?? null,
      statsAvailable: summary.statsAvailable ?? null,
      currentSeason: this.normalizeCurrentSeason(currentSeason),
      seasonPlayer: this.normalizeSeasonPlayer(seasonPlayer),
      competitiveProfile: this.normalizeCompetitiveProfile(competitiveProfile, responsePlayer),
    };
  }

  private normalizeCompetitiveProfile(
    competitiveProfile: unknown,
    responsePlayer?: PlayerIdentityDto | null,
  ): PlayerBunkerSummaryDataDto['competitiveProfile'] {
    if (!this.isRecord(competitiveProfile) && !this.isRecord(responsePlayer)) {
      return null;
    }

    const profile = this.isRecord(competitiveProfile) ? competitiveProfile : {};
    const player = this.isRecord(responsePlayer) ? responsePlayer : {};
    const lifetime = this.normalizeCompetitiveLifetime(profile['lifetime']);
    const normalized = {
      generatedAt: this.toOptionalString(profile['generatedAt']),
      steamid64: this.toOptionalString(
        profile['steamid64'] ?? profile['steamId64'] ?? player['steamid64'] ?? player['steamId64'],
      ),
      name: this.toOptionalString(profile['name'] ?? player['displayName']),
      avatarMedium: this.toOptionalString(profile['avatarMedium'] ?? player['avatarMedium']),
      steamProfileUrl: this.toOptionalString(profile['steamProfileUrl'] ?? player['steamProfileUrl']),
      lifetime,
    };

    if (
      !normalized.generatedAt &&
      !normalized.steamid64 &&
      !normalized.name &&
      !normalized.avatarMedium &&
      !normalized.steamProfileUrl &&
      !normalized.lifetime
    ) {
      return null;
    }

    return normalized;
  }

  private normalizeCompetitiveLifetime(lifetime: unknown): NonNullable<
    PlayerBunkerSummaryDataDto['competitiveProfile']
  >['lifetime'] {
    if (!this.isRecord(lifetime)) {
      return null;
    }

    const normalized = {
      matchesPlayed: this.toOptionalNumber(lifetime['matchesPlayed']),
      mapsPlayed: this.toOptionalNumber(lifetime['mapsPlayed']),
      roundsPlayed: this.toOptionalNumber(lifetime['roundsPlayed']),
      wins: this.toOptionalNumber(lifetime['wins']),
      losses: this.toOptionalNumber(lifetime['losses']),
      winRate: this.toOptionalNumber(lifetime['winRate']),
      kdRatio: this.toOptionalNumber(lifetime['kdRatio']),
      adr: this.toOptionalNumber(lifetime['adr']),
      impactRating: this.toOptionalNumber(lifetime['impactRating']),
      kills: this.toOptionalNumber(lifetime['kills']),
      deaths: this.toOptionalNumber(lifetime['deaths']),
      assists: this.toOptionalNumber(lifetime['assists']),
      headshotPct: this.toOptionalNumber(lifetime['headshotPct']),
      accuracy: this.toOptionalNumber(lifetime['accuracy']),
      utilityDmgPerRound: this.toOptionalNumber(lifetime['utilityDmgPerRound']),
      killsPerRound: this.toOptionalNumber(lifetime['killsPerRound']),
      assistsPerRound: this.toOptionalNumber(lifetime['assistsPerRound']),
      deathsPerRound: this.toOptionalNumber(lifetime['deathsPerRound']),
      entryWinRate: this.toOptionalNumber(lifetime['entryWinRate']),
      v1Count: this.toOptionalNumber(lifetime['v1Count']),
      v1Wins: this.toOptionalNumber(lifetime['v1Wins']),
      v1WinRate: this.toOptionalNumber(lifetime['v1WinRate']),
      v2Count: this.toOptionalNumber(lifetime['v2Count']),
      v2Wins: this.toOptionalNumber(lifetime['v2Wins']),
      v2WinRate: this.toOptionalNumber(lifetime['v2WinRate']),
      enemy2ks: this.toOptionalNumber(lifetime['enemy2ks']),
      enemy3ks: this.toOptionalNumber(lifetime['enemy3ks']),
      enemy4ks: this.toOptionalNumber(lifetime['enemy4ks']),
      enemy5ks: this.toOptionalNumber(lifetime['enemy5ks']),
      sampleWeight: this.toOptionalNumber(lifetime['sampleWeight']),
      score: this.toOptionalNumber(lifetime['score']),
    };

    return Object.values(normalized).some((value) => this.isFiniteNumber(value)) ? normalized : null;
  }

  private normalizeCurrentSeason(
    currentSeason: unknown,
  ): PlayerBunkerSummaryDataDto['currentSeason'] {
    if (!this.isRecord(currentSeason)) {
      return null;
    }

    const scope = this.isRecord(currentSeason['scope']) ? currentSeason['scope'] : null;

    return {
      slug: this.toOptionalString(currentSeason['slug']),
      name: this.toOptionalString(currentSeason['name']),
      status: this.toOptionalString(currentSeason['status']),
      scope: {
        startAt: this.toOptionalString(scope?.['startAt']),
        endAt: this.toOptionalString(scope?.['endAt']),
      },
    };
  }

  private normalizeSeasonPlayer(seasonPlayer: unknown): PlayerBunkerSummaryDataDto['seasonPlayer'] {
    if (!this.isRecord(seasonPlayer)) {
      return null;
    }

    const name = this.toOptionalString(seasonPlayer['name']);
    const steamid64 = this.toOptionalString(seasonPlayer['steamid64'] ?? seasonPlayer['steamId64']);
    const generatedAt = this.toOptionalString(seasonPlayer['generatedAt']);
    const summary = this.normalizeSeasonPlayerSummary(seasonPlayer['summary']);
    const byMap = this.normalizeSeasonPlayerByMap(seasonPlayer['byMap']);
    const recentMaps = this.normalizeSeasonPlayerRecentMaps(seasonPlayer['recentMaps']);
    const timeline = this.normalizeSeasonPlayerTimeline(seasonPlayer['timeline']);

    if (!name && !steamid64 && !generatedAt && !summary && byMap.length === 0 && recentMaps.length === 0 && timeline.length === 0) {
      return null;
    }

    return {
      name,
      steamid64,
      generatedAt,
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
      roundsPlayed: this.toOptionalNumber(summary['roundsPlayed']),
      losses: this.toOptionalNumber(summary['losses']),
      headshotPct: this.toOptionalNumber(summary['headshotPct']),
      accuracy: this.toOptionalNumber(summary['accuracy']),
      utilityDmgPerRound: this.toOptionalNumber(summary['utilityDmgPerRound']),
      killsPerRound: this.toOptionalNumber(summary['killsPerRound']),
      assistsPerRound: this.toOptionalNumber(summary['assistsPerRound']),
      deathsPerRound: this.toOptionalNumber(summary['deathsPerRound']),
      entryWinRate: this.toOptionalNumber(summary['entryWinRate']),
      v1Count: this.toOptionalNumber(summary['v1Count']),
      v1Wins: this.toOptionalNumber(summary['v1Wins']),
      v1WinRate: this.toOptionalNumber(summary['v1WinRate']),
      v2Count: this.toOptionalNumber(summary['v2Count']),
      v2Wins: this.toOptionalNumber(summary['v2Wins']),
      v2WinRate: this.toOptionalNumber(summary['v2WinRate']),
      enemy2ks: this.toOptionalNumber(summary['enemy2ks']),
      enemy3ks: this.toOptionalNumber(summary['enemy3ks']),
      enemy4ks: this.toOptionalNumber(summary['enemy4ks']),
      enemy5ks: this.toOptionalNumber(summary['enemy5ks']),
      sampleWeight: this.toOptionalNumber(summary['sampleWeight']),
      score: this.toOptionalNumber(summary['score']),
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
      roundsPlayed: this.toOptionalNumber(item['roundsPlayed']),
      kills: this.toOptionalNumber(item['kills']),
      deaths: this.toOptionalNumber(item['deaths']),
      assists: this.toOptionalNumber(item['assists']),
      headshotPct: this.toOptionalNumber(item['headshotPct']),
      accuracy: this.toOptionalNumber(item['accuracy']),
      utilityDmgPerRound: this.toOptionalNumber(item['utilityDmgPerRound']),
      entryWinRate: this.toOptionalNumber(item['entryWinRate']),
      enemy2ks: this.toOptionalNumber(item['enemy2ks']),
      enemy3ks: this.toOptionalNumber(item['enemy3ks']),
      enemy4ks: this.toOptionalNumber(item['enemy4ks']),
      enemy5ks: this.toOptionalNumber(item['enemy5ks']),
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
      outcome: this.toOptionalString(item['outcome']),
      score: this.toOptionalString(item['score']),
      team: this.toOptionalString(item['team']),
      winner: this.toOptionalString(item['winner']),
      isWin: this.toOptionalBoolean(item['isWin']),
      team1_score: this.toOptionalNumber(item['team1_score']),
      team2_score: this.toOptionalNumber(item['team2_score']),
      rounds: this.toOptionalNumber(item['rounds']),
      damage: this.toOptionalNumber(item['damage']),
      utility_damage: this.toOptionalNumber(item['utility_damage']),
      head_shot_kills: this.toOptionalNumber(item['head_shot_kills']),
      entry_count: this.toOptionalNumber(item['entry_count']),
      entry_wins: this.toOptionalNumber(item['entry_wins']),
      v1_count: this.toOptionalNumber(item['v1_count']),
      v1_wins: this.toOptionalNumber(item['v1_wins']),
      v2_count: this.toOptionalNumber(item['v2_count']),
      v2_wins: this.toOptionalNumber(item['v2_wins']),
      enemy2ks: this.toOptionalNumber(item['enemy2ks']),
      enemy3ks: this.toOptionalNumber(item['enemy3ks']),
      enemy4ks: this.toOptionalNumber(item['enemy4ks']),
      enemy5ks: this.toOptionalNumber(item['enemy5ks']),
      shots_fired_total: this.toOptionalNumber(item['shots_fired_total']),
      shots_on_target_total: this.toOptionalNumber(item['shots_on_target_total']),
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
      avatarMedium: identity.avatarMedium?.trim() || null,
      steamProfileUrl: identity.steamProfileUrl?.trim() || null,
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

  private toOptionalBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();

      if (['true', '1', 'win', 'won', 'vitória', 'vitoria'].includes(normalized)) {
        return true;
      }

      if (['false', '0', 'loss', 'lost', 'derrota'].includes(normalized)) {
        return false;
      }
    }

    return null;
  }

  private bestMapBy(
    byMap: PlayerBunkerSeasonPlayerMapDto[],
    valueFor: (item: PlayerBunkerSeasonPlayerMapDto) => number | null | undefined,
  ): PlayerBunkerSeasonPlayerMapDto | null {
    return byMap.reduce<PlayerBunkerSeasonPlayerMapDto | null>((best, item) => {
      const value = valueFor(item);

      if (!this.isFiniteNumber(value)) {
        return best;
      }

      const bestValue = best ? valueFor(best) : null;
      return !this.isFiniteNumber(bestValue) || value > bestValue ? item : best;
    }, null);
  }

  private bestTimelineBy(
    timeline: PlayerBunkerSeasonPlayerTimelineItemDto[],
    direction: 1 | -1,
  ): PlayerBunkerSeasonPlayerTimelineItemDto | null {
    return timeline.reduce<PlayerBunkerSeasonPlayerTimelineItemDto | null>((best, item) => {
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
      item.roundsPlayed,
      item.kills,
      item.deaths,
      item.assists,
      item.headshotPct,
      item.accuracy,
      item.utilityDmgPerRound,
      item.entryWinRate,
      item.enemy2ks,
      item.enemy3ks,
      item.enemy4ks,
      item.enemy5ks,
    ].some((value) => this.isFiniteNumber(value));
  }

  private hasRecentMapIdentity(item: PlayerBunkerSeasonPlayerRecentMapDto): boolean {
    return [
      item.mapName,
      item.startedAt,
      item.matchId,
      item.result,
      item.outcome,
      item.score,
      item.team,
      item.winner,
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
      item.team1_score,
      item.team2_score,
      item.rounds,
      item.damage,
      item.utility_damage,
      item.head_shot_kills,
      item.entry_count,
      item.entry_wins,
      item.v1_count,
      item.v1_wins,
      item.v2_count,
      item.v2_wins,
      item.enemy2ks,
      item.enemy3ks,
      item.enemy4ks,
      item.enemy5ks,
      item.shots_fired_total,
      item.shots_on_target_total,
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
