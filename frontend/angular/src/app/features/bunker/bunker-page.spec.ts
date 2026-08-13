import { HttpErrorResponse } from '@angular/common/http';
import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { PlayerAuthApiService } from '../player/data-access/player-auth-api.service';
import { PlayerIdentityApiService } from '../player/data-access/player-identity-api.service';
import type { PlayerIdentity } from '../player/domain/player-identity.model';
import { BunkerPage } from './bunker-page';
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

const BUNKER_TRANSLATIONS = {
  'pt-BR': {
    shared: { playerAvatar: { alt: 'Avatar de {{displayName}}' } },
    bunker: {
      header: { productName: 'Competitive Analytics', currentContext: 'Contexto atual' },
      states: { loading: { eyebrow: 'Carregando analytics' }, failure: { title: 'Competitive Analytics indisponível', description: 'Falha global.' }, partial: { eyebrow: 'Dados competitivos', title: 'Resumo temporariamente indisponível', description: 'Falha parcial.' }, empty: { lifetimeTitle: 'Perfil competitivo geral ainda indisponível.', lifetimeDescription: 'Nenhuma métrica lifetime foi publicada.', maps: 'Performance por mapa ainda indisponível.' } },
      auth: { eyebrow: 'Conta Steam', title: 'Entre para acessar o Competitive Analytics', description: 'Entre com Steam para validar sua sessão.', action: 'Entrar com Steam' },
      season: { label: 'Season', status: 'Status', period: 'Período', updated: 'Atualizado', unavailable: 'Season indisponível' },
      sections: { overview: { eyebrow: 'Visão geral', title: 'Perfil competitivo geral', description: 'Histórico lifetime.', canonicalLifetime: 'Lifetime · valor canônico' }, impactTrend: { eyebrow: 'Tendência de performance', title: 'Evolução de Impacto', description: 'Sequência sazonal.' }, maps: { eyebrow: 'Map pool', title: 'Performance por mapa', description: 'Métricas sazonais.' }, combat: { eyebrow: 'Perfil de combate', title: 'Perfil de combate', description: 'Contadores publicados.', clutchEyebrow: 'Performance de clutch', multiKillEyebrow: 'Perfil de multi-kill' }, recent: { eyebrow: 'Mapas recentes', title: 'Mapas recentes', description: 'Resultados canônicos.' }, timeline: { eyebrow: 'Eventos', title: 'Timeline da temporada', description: 'Eventos competitivos.' } },
      charts: { value: 'Valor', winRate: 'Win Rate', occurrences: 'Ocorrências', mapUnavailable: 'Mapa não informado' },
      labels: { playerFallback: 'Jogador HSC', winRate: 'Win Rate', maps: 'Mapas', wins: 'Vitórias', losses: 'Derrotas', kills: 'Abates', deaths: 'Mortes', assists: 'Assistências', accuracy: 'Precisão', utilityPerRound: 'Util/R', map: 'Mapa', games: 'Jogos', winShort: 'V', lossShort: 'D', winPct: 'Vit%', entry: 'Entrada', success: 'Sucesso', conversion: 'Conversão', utility: 'Utilidade' },
      results: { win: 'Vitória', loss: 'Derrota' },
      actions: { playerArea: 'Área do Jogador', backToPlayerArea: 'Voltar para Área do Jogador' },
      accessibility: { loading: 'Carregando Competitive Analytics', seasonContext: 'Contexto da temporada atual', lifetimeMetrics: 'Métricas lifetime', mapPerformance: 'Performance sazonal por mapa' },
    },
  },
  'en-US': {
    shared: { playerAvatar: { alt: '{{displayName}} avatar' } },
    bunker: {
      header: { productName: 'Competitive Analytics', currentContext: 'Current context' },
      states: { loading: { eyebrow: 'Loading analytics' }, failure: { title: 'Competitive Analytics unavailable', description: 'Global failure.' }, partial: { eyebrow: 'Competitive data', title: 'Summary temporarily unavailable', description: 'Partial failure.' }, empty: { lifetimeTitle: 'Overall competitive profile is not available yet.', lifetimeDescription: 'No lifetime metrics have been published.', maps: 'Map performance is not available yet.' } },
      auth: { eyebrow: 'Steam Account', title: 'Sign in to access Competitive Analytics', description: 'Sign in with Steam to validate your session.', action: 'Sign in with Steam' },
      season: { label: 'Season', status: 'Status', period: 'Period', updated: 'Updated', unavailable: 'Season unavailable' },
      sections: { overview: { eyebrow: 'Overview', title: 'Overall Competitive Profile', description: 'Lifetime history.', canonicalLifetime: 'Lifetime · canonical value' }, impactTrend: { eyebrow: 'Performance trend', title: 'Impact Trend', description: 'Season sequence.' }, maps: { eyebrow: 'Map pool', title: 'Map Performance', description: 'Season metrics.' }, combat: { eyebrow: 'Combat profile', title: 'Combat Profile', description: 'Published counters.', clutchEyebrow: 'Clutch performance', multiKillEyebrow: 'Multi-kill profile' }, recent: { eyebrow: 'Recent maps', title: 'Recent Maps', description: 'Canonical results.' }, timeline: { eyebrow: 'Events', title: 'Season Timeline', description: 'Competitive events.' } },
      charts: { value: 'Value', winRate: 'Win Rate', occurrences: 'Occurrences', mapUnavailable: 'Map unavailable' },
      labels: { playerFallback: 'HSC Player', winRate: 'Win Rate', maps: 'Maps', wins: 'Wins', losses: 'Losses', kills: 'Kills', deaths: 'Deaths', assists: 'Assists', accuracy: 'Accuracy', utilityPerRound: 'Util/R', map: 'Map', games: 'Games', winShort: 'W', lossShort: 'L', winPct: 'Win%', entry: 'Entry', success: 'Success', conversion: 'Conversion', utility: 'Util' },
      results: { win: 'Win', loss: 'Loss' },
      actions: { playerArea: 'Player Area', backToPlayerArea: 'Back to Player Area' },
      accessibility: { loading: 'Loading Competitive Analytics', seasonContext: 'Current season context', lifetimeMetrics: 'Lifetime metrics', mapPerformance: 'Season map performance' },
    },
  },
} as const;

@Component({
  selector: 'app-competitive-win-rate-chart',
  standalone: true,
  template: '',
})
class WinRateChartStub {
  readonly value = input<number | null>(null);
}

@Component({
  selector: 'app-competitive-metric-sparkline',
  standalone: true,
  template: '',
})
class MetricSparklineStub {
  readonly values = input<readonly (number | null)[]>([]);
  readonly color = input<'cyan' | 'orange'>('cyan');
}

@Component({
  selector: 'app-competitive-impact-trend-chart',
  standalone: true,
  template: '',
})
class ImpactTrendChartStub {
  readonly timeline = input<readonly BunkerTimelineItem[]>([]);
}

@Component({
  selector: 'app-competitive-map-winrate-chart',
  standalone: true,
  template: '',
})
class MapWinrateChartStub {
  readonly maps = input<readonly BunkerMapPerformance[]>([]);
}

@Component({
  selector: 'app-competitive-multikill-chart',
  standalone: true,
  template: '2K 3K 4K 5K',
})
class MultikillChartStub {
  readonly stats = input.required<BunkerPlayerStats>();
}

function createPlayerIdentity(overrides: Partial<PlayerIdentity> = {}): PlayerIdentity {
  return {
    displayName: 'L4VOSX',
    steamId64: '76561198000000000',
    avatarMedium: 'https://example.com/avatar.jpg',
    steamProfileUrl: 'https://steamcommunity.com/id/lavosx',
    ...overrides,
  };
}

function createStats(overrides: Partial<BunkerPlayerStats> = {}): BunkerPlayerStats {
  return {
    mapsPlayed: 84,
    matchesPlayed: 80,
    wins: 45,
    losses: 35,
    winRate: 0.5625,
    kdRatio: 1.08,
    adr: 78.4,
    impactRating: 1.03,
    kills: 1432,
    deaths: 1326,
    assists: 411,
    roundsPlayed: 1920,
    headshotPct: 0.487,
    accuracy: 0.219,
    utilityDmgPerRound: 8.7,
    killsPerRound: 0.746,
    assistsPerRound: 0.214,
    deathsPerRound: 0.691,
    entryWinRate: 0.524,
    v1Count: 38,
    v1Wins: 21,
    v1WinRate: 0.553,
    v2Count: 61,
    v2Wins: 29,
    v2WinRate: 0.475,
    enemy2ks: 186,
    enemy3ks: 47,
    enemy4ks: 12,
    enemy5ks: 2,
    sampleWeight: 84,
    score: 1.12,
    ...overrides,
  };
}

function createMapPerformance(overrides: Partial<BunkerMapPerformance> = {}): BunkerMapPerformance {
  return {
    mapName: 'de_inferno',
    mapsPlayed: 4,
    matchesPlayed: 4,
    wins: 3,
    losses: 1,
    winRate: 0.75,
    kdRatio: 1.12,
    adr: 82.4,
    impactRating: 1.11,
    roundsPlayed: 92,
    kills: 74,
    deaths: 66,
    assists: 19,
    headshotPct: 0.48,
    accuracy: 0.22,
    utilityDmgPerRound: 8.2,
    entryWinRate: 0.58,
    enemy2ks: 8,
    enemy3ks: 2,
    enemy4ks: 1,
    enemy5ks: 0,
    ...overrides,
  };
}

function createRecentMap(overrides: Partial<BunkerRecentMap> = {}): BunkerRecentMap {
  return {
    mapName: 'de_mirage',
    startedAt: '2026-08-01T12:00:00Z',
    matchId: 'recent-1',
    mapNumber: 1,
    result: '13-11',
    outcome: 'win',
    score: '13-11',
    team: 'team1',
    winner: 'team1',
    isWin: true,
    team1Score: 13,
    team2Score: 11,
    rounds: 24,
    damage: 2000,
    utilityDamage: 300,
    headShotKills: 10,
    entryCount: 4,
    entryWins: 3,
    v1Count: 1,
    v1Wins: 1,
    v2Count: 0,
    v2Wins: 0,
    enemy2ks: 3,
    enemy3ks: 1,
    enemy4ks: 0,
    enemy5ks: 0,
    shotsFiredTotal: 500,
    shotsOnTargetTotal: 110,
    kills: 20,
    deaths: 15,
    assists: 5,
    kdRatio: 1.33,
    adr: 83.3,
    impactRating: 1.2,
    ...overrides,
  };
}

function createTimelineItem(overrides: Partial<BunkerTimelineItem> = {}): BunkerTimelineItem {
  return {
    at: '2026-08-01T12:00:00Z',
    event: 'map_completed',
    mapName: 'de_mirage',
    matchId: 'timeline-1',
    mapNumber: 1,
    result: 'win',
    score: '13-11',
    kills: 20,
    deaths: 15,
    assists: 5,
    kdRatio: 1.33,
    adr: 83.3,
    impactRating: 1.2,
    ...overrides,
  };
}

function createBunkerSummary(overrides: Partial<BunkerSummary> = {}): BunkerSummary {
  return {
    status: 'ready',
    seasonFirst: false,
    statsAvailable: true,
    currentSeason: {
      slug: 'season-02',
      name: 'Season 02',
      status: 'active',
      scope: { startAt: '2026-04-01', endAt: '2026-09-30' },
    },
    seasonPlayer: {
      name: 'L4VOSX',
      steamId64: '76561198000000000',
      generatedAt: '2026-08-11T20:00:00Z',
      summary: createStats({ mapsPlayed: 12, wins: 6, losses: 6, winRate: 0.5 }),
      byMap: [
        createMapPerformance({ mapName: 'de_nuke', mapsPlayed: 2, wins: 1, losses: 1, winRate: 0.5 }),
        createMapPerformance({ mapName: 'de_inferno', mapsPlayed: 4, wins: 3, losses: 1, winRate: 0.75 }),
      ],
      recentMaps: [
        createRecentMap({ mapName: 'de_mirage', matchId: 'recent-1', startedAt: '2026-08-01T12:00:00Z' }),
        createRecentMap({
          mapName: 'de_ancient',
          matchId: 'recent-2',
          startedAt: '2026-08-02T12:00:00Z',
          score: '8-13',
          result: '8-13',
          outcome: 'loss',
          isWin: false,
          team1Score: 8,
          team2Score: 13,
        }),
      ],
      timeline: [
        createTimelineItem({
          at: '2026-07-01T12:00:00Z',
          mapName: 'de_vertigo',
          matchId: 'timeline-1',
          impactRating: 0.9,
          kdRatio: 0.95,
        }),
        createTimelineItem({
          at: '2026-07-02T12:00:00Z',
          mapName: 'de_mirage',
          matchId: 'timeline-2',
          impactRating: 1.2,
          kdRatio: 1.33,
        }),
      ],
    },
    competitiveProfile: {
      generatedAt: '2026-08-11T20:00:00Z',
      steamId64: '76561198000000000',
      name: 'L4VOSX',
      avatarMedium: 'https://example.com/avatar.jpg',
      steamProfileUrl: 'https://steamcommunity.com/id/lavosx',
      lifetime: createStats(),
    },
    ...overrides,
  };
}

function normalizedText(element: Element | HTMLElement): string {
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}

describe('BunkerPage Competitive Analytics', () => {
  let fixture: ComponentFixture<BunkerPage>;
  let playerIdentityApiMock: { getCurrentIdentity: ReturnType<typeof vi.fn> };
  let bunkerApiMock: { getSummary: ReturnType<typeof vi.fn> };
  let playerAuthApiMock: { steamLoginUrl: string };

  beforeEach(async () => {
    playerIdentityApiMock = { getCurrentIdentity: vi.fn() };
    bunkerApiMock = { getSummary: vi.fn() };
    playerAuthApiMock = { steamLoginUrl: 'https://example.com/steam/login' };

    await TestBed.configureTestingModule({
      imports: [BunkerPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: PlayerIdentityApiService, useValue: playerIdentityApiMock },
        { provide: BunkerApiService, useValue: bunkerApiMock },
        { provide: PlayerAuthApiService, useValue: playerAuthApiMock },
      ],
    })
      .overrideComponent(BunkerPage, {
        remove: {
          imports: [
            CompetitiveWinRateChart,
            CompetitiveMetricSparkline,
            CompetitiveImpactTrendChart,
            CompetitiveMapWinrateChart,
            CompetitiveMultikillChart,
          ],
        },
        add: {
          imports: [
            WinRateChartStub,
            MetricSparklineStub,
            ImpactTrendChartStub,
            MapWinrateChartStub,
            MultikillChartStub,
          ],
        },
      })
      .compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', BUNKER_TRANSLATIONS['pt-BR']);
    translate.setTranslation('en-US', BUNKER_TRANSLATIONS['en-US']);
    await firstValueFrom(translate.use('pt-BR'));
  });

  function render(summary: BunkerSummary = createBunkerSummary()): HTMLElement {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(of(summary));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  it('1. renderiza loading antes da identidade responder', () => {
    const identity$ = new Subject<PlayerIdentity | null>();
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(identity$);

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.analytics-loading')).toBeTruthy();
  });

  it('2. identidade null renderiza BunkerAuthCard e não chama BunkerApiService', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(null));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-bunker-auth-card')).toBeTruthy();
    expect(compiled.querySelector('app-bunker-auth-card a')?.getAttribute('href')).toBe(
      'https://example.com/steam/login',
    );
    expect(bunkerApiMock.getSummary).not.toHaveBeenCalled();
  });

  it('3. identidade autenticada chama BunkerApiService.getSummary() uma vez', () => {
    render();

    expect(playerIdentityApiMock.getCurrentIdentity).toHaveBeenCalledTimes(1);
    expect(bunkerApiMock.getSummary).toHaveBeenCalledTimes(1);
  });

  it('4. renderiza header de analytics com identidade, season e retorno para Área do Jogador', () => {
    const compiled = render();

    expect(compiled.querySelector('.analytics-hero h1')?.textContent?.trim()).toBe('L4VOSX');
    expect(compiled.textContent).toContain('STEAMID 76561198000000000');
    expect(compiled.textContent).toContain('Season 02');
    expect(compiled.querySelector<HTMLAnchorElement>('a.analytics-action')?.getAttribute('href')).toBe(
      '/area-do-jogador',
    );
  });

  it('5. erro de identidade 401 renderiza autenticação e não chama BunkerApiService', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-bunker-auth-card')).toBeTruthy();
    expect(bunkerApiMock.getSummary).not.toHaveBeenCalled();
  });

  it('6. erro de identidade não autenticacional renderiza erro global', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Competitive Analytics indisponível',
    );
  });

  it('7. erro do BunkerSummary preserva identidade autenticada e exibe fallback parcial', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(throwError(() => new Error('Summary error')));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.analytics-hero h1')?.textContent?.trim()).toBe('L4VOSX');
    expect(compiled.querySelector('app-empty-state')).toBeNull();
    expect(compiled.textContent).toContain('Resumo temporariamente indisponível');
  });

  it('8. lifetime alimenta visão geral com valores canônicos', () => {
    const compiled = render();

    expect(compiled.textContent).toContain('Perfil competitivo geral');
    expect(compiled.textContent).toContain('1,08');
    expect(compiled.textContent).toContain('78,4');
    expect(compiled.textContent).toContain('1.432');
    expect(compiled.textContent).toContain('48,7%');
    expect(compiled.textContent).toContain('21,9%');
  });

  it('9. Win Rate radial recebe somente lifetime.winRate canônico', () => {
    render();

    const chart = fixture.debugElement.query(By.directive(WinRateChartStub))
      .componentInstance as WinRateChartStub;

    expect(chart.value()).toBe(0.5625);
  });

  it('10. sparklines usam sequência canônica da timeline e preservam null', () => {
    const base = createBunkerSummary();
    const seasonPlayer = base.seasonPlayer
      ? {
          ...base.seasonPlayer,
          timeline: [
            createTimelineItem({ kdRatio: 0.88, impactRating: 0.91 }),
            createTimelineItem({ kdRatio: null, impactRating: null }),
            createTimelineItem({ kdRatio: 1.22, impactRating: 1.31 }),
          ],
        }
      : null;

    render(createBunkerSummary({ seasonPlayer }));

    const sparklines = fixture.debugElement.queryAll(By.directive(MetricSparklineStub));
    const kdSparkline = sparklines[0].componentInstance as MetricSparklineStub;
    const impactSparkline = sparklines[1].componentInstance as MetricSparklineStub;

    expect(kdSparkline.values()).toEqual([0.88, null, 1.22]);
    expect(impactSparkline.values()).toEqual([0.91, null, 1.31]);
  });

  it('11. trend de impacto preserva timeline publicada e não usa ADR/KD como fallback', () => {
    const base = createBunkerSummary();
    const timeline = [
      createTimelineItem({ at: '2026-07-01T12:00:00Z', impactRating: null, adr: 99.9, kdRatio: 9.99 }),
      createTimelineItem({ at: '2026-07-02T12:00:00Z', impactRating: null, adr: 88.8, kdRatio: 8.88 }),
    ];
    const seasonPlayer = base.seasonPlayer ? { ...base.seasonPlayer, timeline } : null;

    const compiled = render(createBunkerSummary({ seasonPlayer }));

    expect(fixture.debugElement.query(By.directive(ImpactTrendChartStub))).toBeNull();
    expect(compiled.textContent).not.toContain('Performance trend');
  });

  it('12. tabela e chart de mapas preservam ordem do BunkerSummary', () => {
    const base = createBunkerSummary();
    const byMap = [
      createMapPerformance({ mapName: 'de_ancient', winRate: 0.4 }),
      createMapPerformance({ mapName: 'de_anubis', winRate: 0.6 }),
      createMapPerformance({ mapName: 'de_nuke', winRate: 0.5 }),
    ];
    const seasonPlayer = base.seasonPlayer ? { ...base.seasonPlayer, byMap } : null;
    const compiled = render(createBunkerSummary({ seasonPlayer }));

    const rowNames = Array.from(
      compiled.querySelectorAll<HTMLElement>('.map-table__row:not(.map-table__head) strong[data-label="Mapa"]'),
    ).map((cell) => cell.textContent?.trim());
    const chart = fixture.debugElement.query(By.directive(MapWinrateChartStub))
      .componentInstance as MapWinrateChartStub;

    expect(rowNames).toEqual(['de_ancient', 'de_anubis', 'de_nuke']);
    expect(chart.maps()).toEqual(byMap);
  });

  it('13. winRate null em mapa permanece ausência visual e não recebe tone/ranking', () => {
    const base = createBunkerSummary();
    const seasonPlayer = base.seasonPlayer
      ? { ...base.seasonPlayer, byMap: [createMapPerformance({ mapName: 'de_cache', winRate: null })] }
      : null;
    const compiled = render(createBunkerSummary({ seasonPlayer }));
    const winRateCell = compiled.querySelector('[data-label="Vit%"]');

    expect(winRateCell?.textContent?.trim()).toBe('—');
    expect(compiled.textContent).not.toContain(['Aten', 'ção'].join(''));
  });

  it('14. combat profile usa clutch e multi-kill lifetime publicados', () => {
    render();

    const multikill = fixture.debugElement.query(By.directive(MultikillChartStub))
      .componentInstance as MultikillChartStub;

    expect(multikill.stats().enemy2ks).toBe(186);
    expect(multikill.stats().enemy5ks).toBe(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('21/38');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('55,3%');
  });

  it('15. mapas recentes preservam ordem e usam placar direto por time', () => {
    const compiled = render();
    const recentNames = Array.from(compiled.querySelectorAll<HTMLElement>('.recent-map__identity strong'))
      .map((cell) => cell.textContent?.trim());

    expect(recentNames).toEqual(['de_mirage', 'de_ancient']);
    expect(compiled.textContent).toContain('13 x 11');
    expect(compiled.textContent).toContain('300');
  });

  it('16. mapas recentes não calculam K/D ou ADR a partir de kills/deaths/damage/rounds', () => {
    const base = createBunkerSummary();
    const recentMaps = [
      createRecentMap({
        kills: 20,
        deaths: 5,
        damage: 2000,
        rounds: 20,
        kdRatio: null,
        adr: null,
        impactRating: null,
      }),
    ];
    const seasonPlayer = base.seasonPlayer ? { ...base.seasonPlayer, recentMaps } : null;
    const compiled = render(createBunkerSummary({ seasonPlayer }));
    const rowText = normalizedText(compiled.querySelector('.recent-map') ?? compiled);

    expect(rowText).toContain('K/D—');
    expect(rowText).toContain('ADR—');
    expect(rowText).not.toContain('4,00');
    expect(rowText).not.toContain('100,0');
  });

  it('17. timeline textual preserva ordem e campos canônicos publicados', () => {
    const compiled = render();
    const eventNames = Array.from(compiled.querySelectorAll<HTMLElement>('.timeline-event__heading strong'))
      .map((cell) => cell.textContent?.trim());

    expect(eventNames).toEqual(['de_vertigo', 'de_mirage']);
    expect(compiled.textContent).toContain('Timeline da temporada');
    expect(compiled.textContent).toContain('13-11');
  });

  it('18. lifetime ausente renderiza estado vazio curto sem fabricar chart gigante', () => {
    const summary = createBunkerSummary({
      competitiveProfile: {
        generatedAt: '2026-08-11T20:00:00Z',
        steamId64: '76561198000000000',
        name: 'L4VOSX',
        avatarMedium: null,
        steamProfileUrl: null,
        lifetime: null,
      },
    });
    const compiled = render(summary);

    expect(compiled.textContent).toContain('Perfil competitivo geral ainda indisponível.');
    expect(fixture.debugElement.query(By.directive(WinRateChartStub))).toBeNull();
    expect(fixture.debugElement.query(By.directive(MultikillChartStub))).toBeNull();
  });

  it('19. byMap vazio exibe mensagem compacta', () => {
    const base = createBunkerSummary();
    const seasonPlayer = base.seasonPlayer ? { ...base.seasonPlayer, byMap: [] } : null;
    const compiled = render(createBunkerSummary({ seasonPlayer }));

    expect(compiled.textContent).toContain('Performance por mapa ainda indisponível.');
    expect(fixture.debugElement.query(By.directive(MapWinrateChartStub))).toBeNull();
  });

  it('20. sem recentMaps e sem timeline omite seções dependentes', () => {
    const base = createBunkerSummary();
    const seasonPlayer = base.seasonPlayer
      ? { ...base.seasonPlayer, recentMaps: [], timeline: [] }
      : null;
    const compiled = render(createBunkerSummary({ seasonPlayer }));

    expect(compiled.textContent).not.toContain('Mapas recentes');
    expect(compiled.textContent).not.toContain('Timeline da temporada');
    expect(fixture.debugElement.query(By.directive(ImpactTrendChartStub))).toBeNull();
  });

  it('21. remove conceitos antigos de ranking/highlight do layout', () => {
    const compiled = render();
    const text = compiled.textContent ?? '';

    expect(text).not.toContain(['Mais', ' jogado'].join(''));
    expect(text).not.toContain(['Melhor', ' ADR'].join(''));
    expect(text).not.toContain(['Melhor', ' WR'].join(''));
    expect(text).not.toContain(['Aten', 'ção'].join(''));
    expect(text).not.toContain(['5K', ' / ', 'ACE'].join(''));
  });

  it('22. inspeção estática confirma ausência dos métodos derivados removidos', () => {
    const tsPath = path.resolve(__dirname, 'bunker-page.ts');
    const htmlPath = path.resolve(__dirname, 'bunker-page.html');
    const tsContent = fs.readFileSync(tsPath, 'utf-8');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    const combined = `${tsContent}\n${htmlContent}`;

    expect(combined).not.toContain(['recentMap', 'Kd'].join(''));
    expect(combined).not.toContain(['recentMap', 'Adr'].join(''));
    expect(combined).not.toContain(['recentMap', 'HsPct'].join(''));
    expect(combined).not.toContain(['recentMap', 'Accuracy'].join(''));
    expect(combined).not.toContain(['mostPlayed', 'Map'].join(''));
    expect(combined).not.toContain(['bestAdr', 'Map'].join(''));
    expect(combined).not.toContain(['bestWinRate', 'Map'].join(''));
    expect(combined).not.toContain(['attention', 'Map'].join(''));
    expect(combined).not.toContain(['bestTimeline', 'Item'].join(''));
    expect(combined).not.toContain(['worstTimeline', 'Item'].join(''));
    expect(combined).not.toContain(['timelineSparkline', 'Points'].join(''));
    expect(combined).not.toContain(['rateTone', 'Class'].join(''));
  });

  it('23. inspeção estática confirma que o dashboard não reutiliza componentes antigos da página', () => {
    const htmlPath = path.resolve(__dirname, 'bunker-page.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    expect(htmlContent).not.toContain(['app', 'bunker', 'player', 'header'].join('-'));
    expect(htmlContent).not.toContain(['app', 'bunker', 'season', 'info'].join('-'));
    expect(htmlContent).not.toContain(['app', 'bunker', 'section', 'nav'].join('-'));
    expect(htmlContent).toContain('app-competitive-win-rate-chart');
    expect(htmlContent).toContain('app-competitive-map-winrate-chart');
    expect(htmlContent).toContain('app-competitive-impact-trend-chart');
  });

  it('24. troca pt-BR por en-US na mesma instância sem refetch ou alteração competitiva', async () => {
    const summary = createBunkerSummary();
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(of(summary));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const ptText = normalizedText(fixture.nativeElement as HTMLElement);
    const actualWinRateFixture = TestBed.createComponent(CompetitiveWinRateChart);
    actualWinRateFixture.componentRef.setInput('value', 0.5625);
    const actualWinRate = actualWinRateFixture.componentInstance;
    const tooltipFormatter = () => {
      const tooltipY = actualWinRate['tooltip']().y;
      expect(Array.isArray(tooltipY)).toBe(false);
      return tooltipY && !Array.isArray(tooltipY) ? tooltipY.formatter : undefined;
    };
    const ptFormatter = tooltipFormatter();
    expect(ptFormatter).toBeDefined();
    const ptChartRate = ptFormatter?.(56.25, {} as never);
    const winRate = fixture.debugElement.query(By.directive(WinRateChartStub)).componentInstance as WinRateChartStub;
    const sparklines = fixture.debugElement.queryAll(By.directive(MetricSparklineStub));
    const impact = fixture.debugElement.query(By.directive(ImpactTrendChartStub)).componentInstance as ImpactTrendChartStub;
    const maps = fixture.debugElement.query(By.directive(MapWinrateChartStub)).componentInstance as MapWinrateChartStub;
    const multikill = fixture.debugElement.query(By.directive(MultikillChartStub)).componentInstance as MultikillChartStub;
    const canonicalInputs = {
      winRate: winRate.value(),
      sparklines: sparklines.map((item) => [...(item.componentInstance as MetricSparklineStub).values()]),
      timeline: impact.timeline(),
      maps: maps.maps(),
      multikill: multikill.stats(),
    };

    expect(ptText).toContain('Visão geral');
    expect(ptText).toContain('Vitória');
    expect(ptText).toContain('Derrota');
    expect(ptText).toContain('Vit%');
    expect(ptText).toContain('1.432');
    expect(ptText).toContain('48,7%');

    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();

    const enText = normalizedText(fixture.nativeElement as HTMLElement);
    expect(enText).toContain('Overview');
    expect(enText).toContain('Win');
    expect(enText).toContain('Loss');
    expect(enText).toContain('Win%');
    expect(enText).toContain('Competitive Analytics');
    expect(enText).toContain('L4VOSX');
    expect(enText).toContain('76561198000000000');
    expect(enText).toContain('Season 02');
    expect(enText).toContain('de_nuke');
    expect(enText).toContain('de_inferno');
    expect(enText).toContain('de_mirage');
    expect(enText).toContain('K/D');
    expect(enText).toContain('ADR');
    expect(enText).toContain('Impact');
    expect(enText).toContain('1v1');
    expect(enText).toContain('1v2');
    expect(enText).toContain('2K 3K 4K 5K');
    expect(enText).toContain('1,432');
    expect(enText).toContain('48.7%');
    expect(enText).not.toContain('1.432');
    const enFormatter = tooltipFormatter();
    expect(enFormatter).toBeDefined();
    expect(enFormatter?.(56.25, {} as never)).toBe('56.3%');
    expect(enFormatter?.(56.25, {} as never)).not.toBe(ptChartRate);

    expect(winRate.value()).toBe(canonicalInputs.winRate);
    expect(sparklines.map((item) => (item.componentInstance as MetricSparklineStub).values()))
      .toEqual(canonicalInputs.sparklines);
    expect(impact.timeline()).toBe(canonicalInputs.timeline);
    expect(maps.maps()).toBe(canonicalInputs.maps);
    expect(multikill.stats()).toBe(canonicalInputs.multikill);
    expect(maps.maps().map((map) => map.mapName)).toEqual(['de_nuke', 'de_inferno']);
    expect(summary.seasonPlayer?.recentMaps.map((map) => map.mapName)).toEqual(['de_mirage', 'de_ancient']);
    expect(summary.seasonPlayer?.timeline.map((event) => event.mapName)).toEqual(['de_vertigo', 'de_mirage']);
    expect(summary.competitiveProfile?.lifetime?.kdRatio).toBe(1.08);
    expect(summary.seasonPlayer?.timeline[0].impactRating).toBe(0.9);
    expect(playerIdentityApiMock.getCurrentIdentity).toHaveBeenCalledTimes(1);
    expect(bunkerApiMock.getSummary).toHaveBeenCalledTimes(1);
  });
});
