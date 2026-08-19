import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlayerAuthApiService } from '../player/data-access/player-auth-api.service';
import { PlayerIdentityApiService } from '../player/data-access/player-identity-api.service';
import type { PlayerIdentity } from '../player/domain/player-identity.model';
import { BunkerPage } from './bunker-page';
import { BunkerCombatPanel } from './components/bunker-combat-panel/bunker-combat-panel';
import { BunkerMatchHistoryPanel } from './components/bunker-match-history-panel/bunker-match-history-panel';
import { BunkerMapsPanel } from './components/bunker-maps-panel/bunker-maps-panel';
import { BunkerOverviewPanel } from './components/bunker-overview-panel/bunker-overview-panel';
import type { AnalyticsContext } from './bunker-analytics.types';
import { BunkerApiService } from './data-access/bunker-api.service';
import type {
  BunkerMapPerformance,
  BunkerPlayerStats,
  BunkerRecentMap,
  BunkerSummary,
  BunkerTimelineItem,
} from './domain/bunker.model';

const BUNKER_TRANSLATIONS = {
  shared: { playerAvatar: { alt: 'Avatar de {{displayName}}' } },
  bunker: {
    header: {
      ariaLabel: 'Cabeçalho dos analytics do jogador',
      productName: 'Competitive Analytics',
    },
    contextSelector: {
      label: 'Contexto',
      ariaLabel: 'Contexto dos analytics',
      currentSeason: 'Season atual',
      lifetime: 'Lifetime',
    },
    navigation: {
      ariaLabel: 'Navegação analítica',
      overview: 'Visão Geral',
      combat: 'Clutch + Multi-kill',
      maps: 'Mapas',
      matches: 'Histórico de Partidas',
    },
    overview: {
      ariaLabel: 'Visão geral',
      primary: { ariaLabel: 'Métricas principais', eyebrow: 'Métricas principais' },
      trend: { eyebrow: 'Performance recente', title: 'Evolução de Impacto', empty: 'Sem dados de impacto.' },
      fundamentals: { ariaLabel: 'Fundamentos', eyebrow: 'Fundamentos' },
      metrics: { impact: 'Impact', kd: 'K/D', winRate: 'Win Rate', adr: 'ADR', headshotPct: 'HS%', accuracy: 'Accuracy', entryWinRate: 'Entry Win Rate', utilityPerRound: 'Utility / Round', totalRounds: 'Total Rounds' },
      descriptions: { adr: 'Dano médio', headshotPct: 'Precisão de cabeça', accuracy: 'Tiros no alvo', entryWinRate: 'Conversão', utilityPerRound: 'Utilitário', totalRounds: 'Rounds' },
      empty: 'Sem estatísticas disponíveis para este contexto.',
    },
    combat: {
      ariaLabel: 'Clutch e multi-kill', eyebrow: 'Clutch + Multi-kill',
      clutch: { title: 'Desempenho em Clutches', situation: 'Situação', success: 'Sucesso', rate: 'Taxa' },
      multikill: { title: 'Distribuição de Multi-kills', zero: 'Nenhum multi-kill registrado.', empty: 'Dados de multi-kill indisponíveis.', incomplete: 'Dados de multi-kill incompletos.' },
      empty: 'Sem estatísticas de combate disponíveis para este contexto.',
    },
    maps: {
      ariaLabel: 'Desempenho por mapa', eyebrow: 'Desempenho por mapa', selector: 'Selecionar mapa', map: 'Mapa',
      volume: { title: 'Volume competitivo', one: '{{ count }} partida', other: '{{ count }} partidas' },
      fundamentals: { title: 'Fundamentos neste mapa' }, multikills: 'Multi-kills',
      metrics: { winRate: 'Win Rate', kd: 'K/D', adr: 'ADR', impact: 'Impact', headshotPct: 'HS%', accuracy: 'Accuracy', entryWinRate: 'Entry Win Rate', utilityPerRound: 'Utility / Round', kills: 'Kills', deaths: 'Deaths', assists: 'Assists', rounds: 'Rounds' },
      recent: { title: 'Partidas recentes neste mapa', empty: 'Nenhuma partida recente deste mapa disponível no contexto.' },
      results: { win: 'Vitória', loss: 'Derrota' },
      empty: 'Sem desempenho por mapa disponível para este contexto.',
    },
    matchHistory: {
      ariaLabel: 'Histórico de Partidas', form: 'Forma recente', matches: 'Partidas', list: 'Lista de partidas',
      hero: 'Partida selecionada', dossier: 'Detalhes da performance individual',
      performance: 'Performance principal', details: 'Detalhes da partida', situational: 'Performance situacional',
      entry: 'Entry', clutch: 'Clutch', multikill: 'Multi-kill', aimStats: 'Aim Stats',
      filters: { allMaps: 'Todos os mapas', allResults: 'Todos os resultados', wins: 'Vitórias', losses: 'Derrotas', empty: 'Nenhuma partida encontrada com os filtros selecionados.' },
      multikillStates: { zero: 'Nenhum multi-kill registrado nesta partida.', unavailable: 'Multi-kills indisponíveis para esta partida.' },
      labels: { date: 'Data', map: 'Mapa', score: 'Placar', result: 'Resultado', kills: 'Kills', deaths: 'Deaths', assists: 'Assists', kd: 'K/D', adr: 'ADR', impact: 'Impact', damage: 'Damage', rounds: 'Rounds', utilityDamage: 'Utility Damage', headshotKills: 'Headshot Kills', shotsOnTarget: 'Tiros no alvo', shotsFired: 'Tiros disparados', entries: 'Entradas' },
      results: { win: 'Vitória', loss: 'Derrota', winShort: 'V', lossShort: 'D' },
      empty: 'Sem partidas recentes disponíveis para este contexto.',
    },
    charts: { occurrences: 'Ocorrências' },
    states: {
      loading: { eyebrow: 'Carregando analytics' },
      failure: { title: 'Competitive Analytics indisponível', description: 'Falha global.' },
      partial: { eyebrow: 'Dados competitivos', title: 'Resumo temporariamente indisponível', description: 'Falha parcial.' },
    },
    auth: { eyebrow: 'Conta Steam', title: 'Entre', description: 'Entre com Steam.', action: 'Entrar com Steam' },
    labels: { playerFallback: 'Jogador HSC' },
    actions: { backToPlayerArea: 'Voltar para Área do Jogador' },
    accessibility: { loading: 'Carregando Competitive Analytics' },
  },
} as const;

function createPlayerIdentity(): PlayerIdentity {
  return {
    displayName: 'L4VOSX',
    steamId64: '76561198000000000',
    avatarMedium: 'https://example.com/avatar.jpg',
    steamProfileUrl: 'https://steamcommunity.com/id/lavosx',
  };
}

function createStats(value: number): BunkerPlayerStats {
  return {
    mapsPlayed: value, matchesPlayed: value, wins: value, losses: value, winRate: value,
    kdRatio: value, adr: value, impactRating: value, kills: value, deaths: value,
    assists: value, roundsPlayed: value, headshotPct: value, accuracy: value,
    utilityDmgPerRound: value, killsPerRound: value, assistsPerRound: value,
    deathsPerRound: value, entryWinRate: value, v1Count: value, v1Wins: value,
    v1WinRate: value, v2Count: value, v2Wins: value, v2WinRate: value,
    enemy2ks: value, enemy3ks: value, enemy4ks: value, enemy5ks: value,
    sampleWeight: value, score: value,
  };
}

function createMapPerformance(mapName: string): BunkerMapPerformance {
  return {
    mapName, mapsPlayed: 1, matchesPlayed: 1, wins: 1, losses: 0, winRate: 1,
    kdRatio: 1, adr: 1, impactRating: 1, roundsPlayed: 1, kills: 1, deaths: 1,
    assists: 1, headshotPct: 1, accuracy: 1, utilityDmgPerRound: 1,
    entryWinRate: 1, enemy2ks: 1, enemy3ks: 1, enemy4ks: 1, enemy5ks: 1,
  };
}

function createRecentMap(matchId: string): BunkerRecentMap {
  return {
    mapName: 'de_mirage', startedAt: '2026-08-01T12:00:00Z', matchId, mapNumber: 1,
    result: 'win', outcome: 'win', score: '13-10', team: 'team1', winner: 'team1',
    isWin: true, team1Score: 13, team2Score: 10, rounds: 23, damage: 1,
    utilityDamage: 1, headShotKills: 1, entryCount: 1, entryWins: 1, v1Count: 1,
    v1Wins: 1, v2Count: 1, v2Wins: 1, enemy2ks: 1, enemy3ks: 1, enemy4ks: 1,
    enemy5ks: 1, shotsFiredTotal: 1, shotsOnTargetTotal: 1, kills: 1, deaths: 1,
    assists: 1, kdRatio: 1, adr: 1, impactRating: 1,
  };
}

function createTimelineItem(matchId: string): BunkerTimelineItem {
  return {
    at: '2026-08-01T12:00:00Z', event: 'map_completed', mapName: 'de_mirage',
    matchId, mapNumber: 1, result: 'win', score: '13-10', kills: 1, deaths: 1,
    assists: 1, kdRatio: 1, adr: 1, impactRating: 1,
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
      name: 'Season Player',
      steamId64: '76561198000000000',
      generatedAt: '2026-08-11T20:00:00Z',
      season: { slug: 'artifact-season', scope: null },
      summary: createStats(1),
      periods: { seasonPeriod: createStats(2) },
      byMap: [createMapPerformance('season-map')],
      recentMaps: [createRecentMap('season-recent')],
      timeline: [createTimelineItem('season-timeline')],
    },
    competitiveProfile: {
      generatedAt: '2026-08-11T20:00:00Z',
      steamId64: '76561198000000000',
      name: 'Lifetime Player',
      avatarMedium: null,
      steamProfileUrl: null,
      lifetime: createStats(10),
      periods: { lifetimePeriod: createStats(20) },
      byMap: [createMapPerformance('lifetime-map')],
      recentMaps: [createRecentMap('lifetime-recent')],
      timeline: [createTimelineItem('lifetime-timeline')],
    },
    ...overrides,
  };
}

describe('BunkerPage Competitive Analytics', () => {
  let fixture: ComponentFixture<BunkerPage>;
  let playerIdentityApiMock: { getCurrentIdentity: ReturnType<typeof vi.fn> };
  let bunkerApiMock: { getSummary: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    playerIdentityApiMock = { getCurrentIdentity: vi.fn() };
    bunkerApiMock = { getSummary: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [BunkerPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: PlayerIdentityApiService, useValue: playerIdentityApiMock },
        { provide: BunkerApiService, useValue: bunkerApiMock },
        { provide: PlayerAuthApiService, useValue: { steamLoginUrl: 'https://example.com/steam/login' } },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', BUNKER_TRANSLATIONS);
    await firstValueFrom(translate.use('pt-BR'));
  });

  function render(summary: BunkerSummary = createBunkerSummary()): HTMLElement {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(of(summary));
    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function contextSelect(element: HTMLElement): HTMLSelectElement {
    return element.querySelector('app-bunker-context-selector select') as HTMLSelectElement;
  }

  function selectContext(element: HTMLElement, context: AnalyticsContext): void {
    contextSelect(element).value = context;
    contextSelect(element).dispatchEvent(new Event('change'));
  }

  it('renderiza loading antes da identidade responder', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(new Subject<PlayerIdentity | null>());
    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.analytics-loading')).toBeTruthy();
  });

  it('identidade null renderiza autenticação sem buscar o summary', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(null));
    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-bunker-auth-card')).toBeTruthy();
    expect(compiled.querySelector('app-bunker-auth-card a')?.getAttribute('href')).toBe('https://example.com/steam/login');
    expect(bunkerApiMock.getSummary).not.toHaveBeenCalled();
  });

  it('identidade autenticada busca o summary uma vez e preserva a identidade', () => {
    const compiled = render();
    expect(playerIdentityApiMock.getCurrentIdentity).toHaveBeenCalledTimes(1);
    expect(bunkerApiMock.getSummary).toHaveBeenCalledTimes(1);
    expect(compiled.querySelector('app-bunker-analytics-header h1')?.textContent).toContain('L4VOSX');
    expect(compiled.querySelector('.analytics-header__steam-id')?.textContent).toContain('76561198000000000');
  });

  it('erro autenticacional de identidade renderiza autenticação', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );
    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-bunker-auth-card')).toBeTruthy();
    expect(bunkerApiMock.getSummary).not.toHaveBeenCalled();
  });

  it('erro não autenticacional de identidade renderiza erro global', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Competitive Analytics indisponível');
  });

  it('erro do summary preserva identidade e exibe fallback parcial', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(throwError(() => new Error('Summary error')));
    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-bunker-analytics-header h1')?.textContent).toContain('L4VOSX');
    expect(compiled.textContent).toContain('Resumo temporariamente indisponível');
    expect(compiled.querySelector('[role="tablist"]')).toBeNull();
  });

  it('inicia em Overview e mantém somente o painel ativo montado', () => {
    const compiled = render();
    expect(compiled.querySelectorAll('[role="tabpanel"]')).toHaveLength(1);
    expect(compiled.querySelector('[role="tabpanel"]')?.id).toBe('bunker-panel-overview');
  });

  it('analyticsContext inicia em Season', () => {
    const compiled = render();
    expect(contextSelect(compiled).value).toBe('season');
  });

  it('Overview recebe somente summary e timeline do domínio Season selecionado', () => {
    const summary = createBunkerSummary();
    render(summary);
    const overview = fixture.debugElement.query(By.directive(BunkerOverviewPanel)).componentInstance as BunkerOverviewPanel;

    expect(overview.summary()).toBe(summary.seasonPlayer?.summary);
    expect(overview.timeline()).toBe(summary.seasonPlayer?.timeline);
    expect(overview.context()).toBe('season');
  });

  it('Overview troca para o domínio Lifetime sem fallback cruzado', () => {
    const summary = createBunkerSummary();
    const compiled = render(summary);
    selectContext(compiled, 'lifetime');
    fixture.detectChanges();
    const overview = fixture.debugElement.query(By.directive(BunkerOverviewPanel)).componentInstance as BunkerOverviewPanel;

    expect(overview.summary()).toBe(summary.competitiveProfile?.lifetime);
    expect(overview.timeline()).toBe(summary.competitiveProfile?.timeline);
    expect(overview.context()).toBe('lifetime');
  });

  it('Season ausente não usa dados Lifetime como fallback', () => {
    const summary = createBunkerSummary({ seasonPlayer: null });
    const compiled = render(summary);
    expect(compiled.textContent).toContain('Sem estatísticas disponíveis para este contexto.');
  });

  it('Lifetime ausente não usa dados Season como fallback', () => {
    const summary = createBunkerSummary({ competitiveProfile: null });
    const compiled = render(summary);
    selectContext(compiled, 'lifetime');
    fixture.detectChanges();
    const overview = fixture.debugElement.query(By.directive(BunkerOverviewPanel)).componentInstance as BunkerOverviewPanel;
    expect(overview.summary()).toBeNull();
    expect(overview.timeline()).toEqual([]);
  });

  it('currentSeason é a autoridade visual do label sazonal', () => {
    const summary = createBunkerSummary({
      currentSeason: { slug: 'visual-season', name: 'Season Visual', status: 'active', scope: null },
    });
    const compiled = render(summary);
    expect(contextSelect(compiled).options[0].textContent?.trim()).toBe('Season Visual');
    expect(contextSelect(compiled).options[0].textContent).not.toContain('artifact-season');
  });

  it('nome ausente de currentSeason usa somente o fallback visual da label', () => {
    const summary = createBunkerSummary({ currentSeason: null });
    const compiled = render(summary);
    expect(contextSelect(compiled).options[0].textContent?.trim()).toBe('Season atual');
    const overview = fixture.debugElement.query(By.directive(BunkerOverviewPanel)).componentInstance as BunkerOverviewPanel;
    expect(overview.summary()).toBe(summary.seasonPlayer?.summary);
  });

  it('troca global de contexto não provoca novo fetch', () => {
    const compiled = render();
    selectContext(compiled, 'lifetime');
    fixture.detectChanges();
    expect(contextSelect(compiled).value).toBe('lifetime');
    expect(bunkerApiMock.getSummary).toHaveBeenCalledTimes(1);
  });

  it('troca de tab não altera analyticsContext', () => {
    const compiled = render();
    compiled.querySelector<HTMLButtonElement>('#bunker-tab-maps')?.click();
    fixture.detectChanges();
    expect(contextSelect(compiled).value).toBe('season');
  });

  it('contexto selecionado permanece ao navegar para outra tab', () => {
    const compiled = render();
    selectContext(compiled, 'lifetime');
    compiled.querySelector<HTMLButtonElement>('#bunker-tab-combat')?.click();
    fixture.detectChanges();

    expect(contextSelect(compiled).value).toBe('lifetime');
    expect(compiled.querySelector('[role="tabpanel"]')?.id).toBe('bunker-panel-combat');
  });

  it('Combat recebe somente o summary do domínio Season selecionado', () => {
    const summary = createBunkerSummary();
    const compiled = render(summary);
    compiled.querySelector<HTMLButtonElement>('#bunker-tab-combat')?.click();
    fixture.detectChanges();
    const combat = fixture.debugElement.query(By.directive(BunkerCombatPanel)).componentInstance as BunkerCombatPanel;

    expect(combat.summary()).toBe(summary.seasonPlayer?.summary);
    expect(fixture.debugElement.query(By.directive(BunkerOverviewPanel))).toBeNull();
  });

  it('Combat recebe somente o summary Lifetime selecionado', () => {
    const summary = createBunkerSummary();
    const compiled = render(summary);
    selectContext(compiled, 'lifetime');
    compiled.querySelector<HTMLButtonElement>('#bunker-tab-combat')?.click();
    fixture.detectChanges();
    const combat = fixture.debugElement.query(By.directive(BunkerCombatPanel)).componentInstance as BunkerCombatPanel;

    expect(combat.summary()).toBe(summary.competitiveProfile?.lifetime);
  });

  it('Combat não usa Lifetime como fallback quando Season está ausente', () => {
    const summary = createBunkerSummary({ seasonPlayer: null });
    const compiled = render(summary);
    compiled.querySelector<HTMLButtonElement>('#bunker-tab-combat')?.click();
    fixture.detectChanges();
    const combat = fixture.debugElement.query(By.directive(BunkerCombatPanel)).componentInstance as BunkerCombatPanel;

    expect(combat.summary()).toBeNull();
    expect(compiled.textContent).toContain('Sem estatísticas de combate disponíveis para este contexto.');
  });

  it('Combat não usa Season como fallback quando Lifetime está ausente', () => {
    const summary = createBunkerSummary({ competitiveProfile: null });
    const compiled = render(summary);
    selectContext(compiled, 'lifetime');
    compiled.querySelector<HTMLButtonElement>('#bunker-tab-combat')?.click();
    fixture.detectChanges();
    const combat = fixture.debugElement.query(By.directive(BunkerCombatPanel)).componentInstance as BunkerCombatPanel;

    expect(combat.summary()).toBeNull();
  });

  it('Maps recebe somente byMap do domínio Season selecionado', () => {
    const summary = createBunkerSummary();
    const compiled = render(summary);
    compiled.querySelector<HTMLButtonElement>('#bunker-tab-maps')?.click();
    fixture.detectChanges();
    const maps = fixture.debugElement.query(By.directive(BunkerMapsPanel)).componentInstance as BunkerMapsPanel;

    expect(maps.byMap()).toBe(summary.seasonPlayer?.byMap);
    expect(maps.recentMaps()).toBe(summary.seasonPlayer?.recentMaps);
    expect(fixture.debugElement.query(By.directive(BunkerOverviewPanel))).toBeNull();
    expect(fixture.debugElement.query(By.directive(BunkerCombatPanel))).toBeNull();
  });

  it('Maps recebe somente byMap do domínio Lifetime selecionado', () => {
    const summary = createBunkerSummary();
    const compiled = render(summary);
    selectContext(compiled, 'lifetime');
    compiled.querySelector<HTMLButtonElement>('#bunker-tab-maps')?.click();
    fixture.detectChanges();
    const maps = fixture.debugElement.query(By.directive(BunkerMapsPanel)).componentInstance as BunkerMapsPanel;

    expect(maps.byMap()).toBe(summary.competitiveProfile?.byMap);
    expect(maps.recentMaps()).toBe(summary.competitiveProfile?.recentMaps);
  });

  it('Maps não usa Lifetime como fallback quando Season está ausente', () => {
    const summary = createBunkerSummary({ seasonPlayer: null });
    const compiled = render(summary);
    compiled.querySelector<HTMLButtonElement>('#bunker-tab-maps')?.click();
    fixture.detectChanges();
    const maps = fixture.debugElement.query(By.directive(BunkerMapsPanel)).componentInstance as BunkerMapsPanel;

    expect(maps.byMap()).toBeNull();
    expect(maps.recentMaps()).toBeNull();
    expect(compiled.textContent).toContain('Sem desempenho por mapa disponível para este contexto.');
  });

  it('Maps não usa Season como fallback quando Lifetime está ausente', () => {
    const summary = createBunkerSummary({ competitiveProfile: null });
    const compiled = render(summary);
    selectContext(compiled, 'lifetime');
    compiled.querySelector<HTMLButtonElement>('#bunker-tab-maps')?.click();
    fixture.detectChanges();
    const maps = fixture.debugElement.query(By.directive(BunkerMapsPanel)).componentInstance as BunkerMapsPanel;

    expect(maps.byMap()).toBeNull();
    expect(maps.recentMaps()).toBeNull();
  });

  it('Maps fica montado somente enquanto sua tab está ativa', () => {
    const compiled = render();
    expect(fixture.debugElement.query(By.directive(BunkerMapsPanel))).toBeNull();

    compiled.querySelector<HTMLButtonElement>('#bunker-tab-maps')?.click();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(BunkerMapsPanel))).toBeTruthy();

    compiled.querySelector<HTMLButtonElement>('#bunker-tab-matches')?.click();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(BunkerMapsPanel))).toBeNull();
  });

  it('Histórico recebe somente recentMaps do domínio Season, sem timeline', () => {
    const summary = createBunkerSummary();
    const compiled = render(summary);
    compiled.querySelector<HTMLButtonElement>('#bunker-tab-matches')?.click();
    fixture.detectChanges();
    const history = fixture.debugElement.query(By.directive(BunkerMatchHistoryPanel)).componentInstance as BunkerMatchHistoryPanel;

    expect(history.recentMaps()).toBe(summary.seasonPlayer?.recentMaps);
    expect('timeline' in history).toBe(false);
    expect(fixture.debugElement.query(By.directive(BunkerOverviewPanel))).toBeNull();
    expect(fixture.debugElement.query(By.directive(BunkerMapsPanel))).toBeNull();
  });

  it('Histórico troca para recentMaps Lifetime sem refetch ou fallback cruzado', () => {
    const summary = createBunkerSummary();
    const compiled = render(summary);
    compiled.querySelector<HTMLButtonElement>('#bunker-tab-matches')?.click();
    fixture.detectChanges();
    selectContext(compiled, 'lifetime');
    fixture.detectChanges();
    const history = fixture.debugElement.query(By.directive(BunkerMatchHistoryPanel)).componentInstance as BunkerMatchHistoryPanel;

    expect(history.recentMaps()).toBe(summary.competitiveProfile?.recentMaps);
    expect(contextSelect(compiled).value).toBe('lifetime');
    expect(bunkerApiMock.getSummary).toHaveBeenCalledTimes(1);
  });

  it('Histórico não usa Lifetime como fallback quando Season está ausente', () => {
    const summary = createBunkerSummary({ seasonPlayer: null });
    const compiled = render(summary);
    compiled.querySelector<HTMLButtonElement>('#bunker-tab-matches')?.click();
    fixture.detectChanges();
    const history = fixture.debugElement.query(By.directive(BunkerMatchHistoryPanel)).componentInstance as BunkerMatchHistoryPanel;

    expect(history.recentMaps()).toBeNull();
    expect(compiled.textContent).toContain('Sem partidas recentes disponíveis para este contexto.');
  });

  it('Histórico não usa Season como fallback quando Lifetime está ausente', () => {
    const summary = createBunkerSummary({ competitiveProfile: null });
    const compiled = render(summary);
    selectContext(compiled, 'lifetime');
    compiled.querySelector<HTMLButtonElement>('#bunker-tab-matches')?.click();
    fixture.detectChanges();
    const history = fixture.debugElement.query(By.directive(BunkerMatchHistoryPanel)).componentInstance as BunkerMatchHistoryPanel;

    expect(history.recentMaps()).toBeNull();
    expect(compiled.textContent).toContain('Sem partidas recentes disponíveis para este contexto.');
  });

  it('Histórico fica montado somente enquanto sua tab está ativa', () => {
    const compiled = render();
    expect(fixture.debugElement.query(By.directive(BunkerMatchHistoryPanel))).toBeNull();
    compiled.querySelector<HTMLButtonElement>('#bunker-tab-matches')?.click();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(BunkerMatchHistoryPanel))).toBeTruthy();
    compiled.querySelector<HTMLButtonElement>('#bunker-tab-overview')?.click();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(BunkerMatchHistoryPanel))).toBeNull();
  });

  it('troca de tab desmonta o painel anterior e monta somente o selecionado', () => {
    const compiled = render();
    const combatTab = compiled.querySelector<HTMLButtonElement>('#bunker-tab-combat');
    combatTab?.click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('[role="tabpanel"]')).toHaveLength(1);
    expect(compiled.querySelector('[role="tabpanel"]')?.id).toBe('bunker-panel-combat');
    expect(compiled.querySelector('#bunker-panel-overview')).toBeNull();
    expect(bunkerApiMock.getSummary).toHaveBeenCalledTimes(1);
  });
});
