import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerSessionService } from '../../core/session/player-session.service';
import { HomeApiService } from './data-access/home-api.service';
import type {
  HomeNewsState,
  HomeRecentMatchesState,
  HomeSeasonState,
} from './domain/home-season.model';
import { HomePage } from './home-page';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let homeApi: { getHomeSeasonMetrics: ReturnType<typeof vi.fn>; getRecentMatches: ReturnType<typeof vi.fn>; getHomeNews: ReturnType<typeof vi.fn> };
  let translate: TranslateService;
  const sessionState = signal<ReturnType<PlayerSessionService['state']>>({ status: 'anonymous' });

  const seasonReady: HomeSeasonState = {
    status: 'ready' as const,
    data: {
      seasonSlug: 'season-alpha', seasonName: 'Temporada Alpha', contextMode: 'active' as const,
      generatedAt: '2026-08-04T12:00:00Z', playersCount: 50, matchesCount: 120,
      mapsCount: 180, roundsCount: 1500, hasClassifiedPlayers: true,
      leader: { position: 1, steamId64: '76561198000000001', name: 'Leader', avatarUrl: null, score: 2500, wins: 15, losses: 3, kdRatio: 1.8 },
      topPlayers: [
        { position: 1, steamId64: '76561198000000001', name: 'Leader', avatarUrl: null, score: 2500, wins: 15, losses: 3, kdRatio: 1.8 },
        { position: 2, steamId64: '76561198000000002', name: 'Second', avatarUrl: null, score: 2200, wins: 12, losses: 5, kdRatio: 1.4 },
      ],
    },
  };
  const matchesReady: HomeRecentMatchesState = { status: 'ready', data: [
    { matchId: 42, seasonLastMapEndedAt: '2026-08-04T11:00:00Z', winnerName: 'HSC One', team1Name: 'HSC One', team1Score: 2, team2Name: 'HSC Two', team2Score: 1, maps: [{ name: 'de_nuke', team1Score: 13, team2Score: 8 }] },
    { matchId: 41, seasonLastMapEndedAt: null, winnerName: null, team1Name: null, team1Score: 0, team2Name: 'HSC Three', team2Score: 1, maps: [] },
  ] };
  const newsReady: HomeNewsState = { status: 'ready', data: [{ slug: 'notice', title: 'Comunicado Real', excerpt: 'Conteúdo do índice.', imageUrl: null, publishedAt: '2026-08-04T12:00:00Z' }, { slug: 'update', title: 'Atualização Real', excerpt: null, imageUrl: 'news.jpg', publishedAt: null }] };

  beforeEach(async () => {
    homeApi = { getHomeSeasonMetrics: vi.fn(), getRecentMatches: vi.fn(), getHomeNews: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([]), provideTranslateService(), { provide: HomeApiService, useValue: homeApi }, { provide: PlayerSessionService, useValue: { state: sessionState } }],
    }).compileComponents();
    sessionState.set({ status: 'anonymous' });
    translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', { home: { hero: { active: 'TEMPORADA • ATIVA', metricsAriaLabel: 'Métricas da temporada', players: 'Jogadores', matches: 'Partidas', maps: 'Mapas', viewRanking: 'Ver ranking', viewSeason: 'Ver temporada', leaderAriaLabel: 'Líder da temporada', leaderLabel: 'LÍDER DA TEMPORADA', wins: 'Vitórias' }, now: { eyebrow: 'ACONTECENDO AGORA', title: 'HSC AGORA', latestMatch: 'ÚLTIMA PARTIDA', details: 'Ver detalhes →', matchesError: 'Partidas temporariamente indisponíveis.', topThree: 'TOP 3', newsLabel: 'NOTÍCIAS HSC', readNews: 'Ler notícia →' }, recent: { eyebrow: 'CENTRAL DE PARTIDAS', title: 'PARTIDAS RECENTES' }, playerArea: { eyebrow: 'ÁREA DO JOGADOR', title: 'Área do Jogador', description: 'Seu perfil, identidade e histórico competitivo HSC.', actions: { open: 'Abrir Área do Jogador', signIn: 'Entrar / Acessar', fallback: 'Área do Jogador' } }, news: { eyebrow: 'HSC WIRE', title: 'NOTÍCIAS HSC', readMore: 'Ler notícia →' }, points: 'pts' } });
    translate.setTranslation('en-US', { home: { hero: { active: 'SEASON • ACTIVE', metricsAriaLabel: 'Season metrics', players: 'Players', matches: 'Matches', maps: 'Maps', viewRanking: 'View ranking', viewSeason: 'View season', leaderAriaLabel: 'Season leader', leaderLabel: 'SEASON LEADER', wins: 'Wins' }, now: { eyebrow: 'HAPPENING NOW', title: 'HSC NOW', latestMatch: 'LATEST MATCH', details: 'View details →', matchesError: 'Matches are temporarily unavailable.', topThree: 'TOP 3', newsLabel: 'HSC NEWS', readNews: 'Read news →' }, recent: { eyebrow: 'MATCH CENTER', title: 'RECENT MATCHES' }, playerArea: { eyebrow: 'PLAYER AREA', title: 'Player Area', description: 'Your HSC profile, identity, and competitive history.', actions: { open: 'Open Player Area', signIn: 'Sign in / Access', fallback: 'Player Area' } }, news: { eyebrow: 'HSC WIRE', title: 'HSC NEWS', readMore: 'Read news →' }, points: 'pts' } });
    await firstValueFrom(translate.use('pt-BR'));
  });

  function render(
    seasonState: HomeSeasonState = seasonReady,
    matchesState: HomeRecentMatchesState = matchesReady,
    newsState: HomeNewsState = newsReady,
  ): HTMLElement {
    homeApi.getHomeSeasonMetrics.mockReturnValue(of(seasonState));
    homeApi.getRecentMatches.mockReturnValue(of(matchesState));
    homeApi.getHomeNews.mockReturnValue(of(newsState));
    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the real hero, metrics, leader and active contextual links', () => {
    const native = render();
    expect(native.querySelector('#home-title')?.textContent).toContain('Temporada Alpha');
    expect(native.querySelector('.home-hero__metrics')?.textContent).toContain('50');
    expect(native.querySelector('.home-leader')?.textContent).toContain('Leader');
    const hrefs = Array.from(native.querySelectorAll('.home-hero__actions a')).map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual(['/seasons/current/ranking', '/seasons/current']);
  });

  it('renders top players, latest match, recent matches, notice and news', () => {
    const native = render();
    expect(native.querySelector('.home-top-list')?.textContent).toContain('Second');
    expect(native.querySelector('.home-panel--match')?.textContent).toContain('HSC One');
    expect(native.querySelector('.home-panel--match')?.textContent).toContain('04/08/2026 · 11:00 UTC');
    expect(native.querySelector('.home-match-row')?.getAttribute('href')).toBe('/matches/42');
    expect(native.querySelector('.home-panel--notice')?.textContent).toContain('Comunicado Real');
    expect(native.querySelectorAll('.home-news-card').length).toBe(2);
  });

  it('renders matches in service order and uses a neutral mark for a null team name', () => {
    const native = render();
    const rows = Array.from(native.querySelectorAll('.home-match-row'));
    expect(rows.map((row) => row.getAttribute('href'))).toEqual(['/matches/42', '/matches/41']);
    expect(rows[1].textContent).toContain('—');
  });

  it('links the Player Area CTA to the existing gateway', () => {
    const native = render();
    expect(native.querySelector('.home-player-cta a')?.getAttribute('href')).toBe('/area-do-jogador');
  });

  it('uses latest-closed contextual links', () => {
    const closed = { ...seasonReady, data: { ...seasonReady.data, contextMode: 'latest-closed' as const } };
    const native = render(closed);
    const hrefs = Array.from(native.querySelectorAll('.home-hero__actions a')).map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual(['/seasons/season-alpha/ranking', '/seasons/season-alpha']);
  });

  it('keeps season content when matches and news fail', () => {
    const native = render(seasonReady, { status: 'error' as const }, { status: 'error' as const });
    expect(native.querySelector('#home-title')?.textContent).toContain('Temporada Alpha');
    expect(native.textContent).toContain('Partidas temporariamente indisponíveis');
    expect(native.querySelector('.home-player-cta')).toBeTruthy();
  });

  it('preserves season detail access on ranking error', () => {
    const native = render({ status: 'ranking-error' as const, error: 'ranking', seasonSlug: 'closed-1', seasonName: 'Closed One', contextMode: 'latest-closed' as const });
    expect(native.querySelector('.home-hero__content a')?.getAttribute('href')).toBe('/seasons/closed-1');
    expect(native.querySelector('.home-player-cta')).toBeTruthy();
  });

  it('does not render the former portal shortcuts grid', () => {
    const native = render();
    expect(native.textContent).not.toContain('Áreas do Portal');
    expect(native.querySelector('.home-page__shortcuts-grid')).toBeNull();
    expect(native.textContent).not.toContain('COMUNICADO OFICIAL');
  });

  it('switches representative Home copy and aria labels without changing domain data or links', async () => {
    const native = render();
    const links = Array.from(native.querySelectorAll('.home-hero__actions a')).map((link) => link.getAttribute('href'));
    expect(native.textContent).toContain('TEMPORADA • ATIVA');
    expect(native.querySelector('.home-hero__metrics')?.getAttribute('aria-label')).toBe('Métricas da temporada');

    await firstValueFrom(translate.use('en-US'));
    fixture.detectChanges();
    expect(native.textContent).toContain('SEASON • ACTIVE');
    expect(native.textContent).toContain('HSC NOW');
    expect(native.querySelector('.home-hero__metrics')?.getAttribute('aria-label')).toBe('Season metrics');
    expect(native.textContent).toContain('Temporada Alpha');
    expect(native.textContent).toContain('Leader');
    expect(native.textContent).toContain('HSC One');
    expect(native.textContent).toContain('Comunicado Real');
    expect(Array.from(native.querySelectorAll('.home-hero__actions a')).map((link) => link.getAttribute('href'))).toEqual(links);
  });

  it('localizes the anonymous Player Area CTA', async () => {
    const native = render();
    expect(native.querySelector('.home-player-cta a')?.textContent?.trim()).toBe('Entrar / Acessar');
    await firstValueFrom(translate.use('en-US'));
    fixture.detectChanges();
    expect(native.querySelector('.home-player-cta a')?.textContent?.trim()).toBe('Sign in / Access');
  });

  it('localizes the authenticated Player Area CTA without changing session state', async () => {
    sessionState.set({ status: 'authenticated', displayName: 'Player HSC', steamId64: '1', avatarMedium: null });
    const native = render();
    expect(native.querySelector('.home-player-cta a')?.textContent?.trim()).toBe('Abrir Área do Jogador');
    await firstValueFrom(translate.use('en-US'));
    fixture.detectChanges();
    expect(native.querySelector('.home-player-cta a')?.textContent?.trim()).toBe('Open Player Area');
    expect(sessionState().status).toBe('authenticated');
  });
});
