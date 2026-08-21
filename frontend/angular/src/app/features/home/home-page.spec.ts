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

const gsapBoundary = vi.hoisted(() => {
  const add = vi.fn();
  const revert = vi.fn();
  return {
    add,
    revert,
    matchMedia: vi.fn(() => ({ add, revert })),
    registerPlugin: vi.fn(),
  };
});

vi.mock('gsap', () => ({
  gsap: {
    matchMedia: gsapBoundary.matchMedia,
    registerPlugin: gsapBoundary.registerPlugin,
  },
}));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }));

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
        { position: 3, steamId64: '76561198000000003', name: 'Third', avatarUrl: null, score: 1900, wins: 10, losses: 7, kdRatio: 1.15 },
      ],
    },
  };
  const matchesReady: HomeRecentMatchesState = {
    status: 'ready', data: [
      { matchId: 42, seasonLastMapEndedAt: '2026-08-04T11:00:00Z', winnerName: 'HSC One', team1Name: 'HSC One', team1Score: 2, team2Name: 'HSC Two', team2Score: 1, maps: [{ name: 'de_nuke', team1Score: 13, team2Score: 8 }] },
      { matchId: 41, seasonLastMapEndedAt: null, winnerName: null, team1Name: null, team1Score: 0, team2Name: 'HSC Three', team2Score: 1, maps: [] },
    ]
  };
  const newsReady: HomeNewsState = { status: 'ready', data: [{ slug: 'notice', title: 'Comunicado Real', excerpt: 'Conteúdo do índice.', imageUrl: null, publishedAt: '2026-08-04T12:00:00Z' }, { slug: 'update', title: 'Atualização Real', excerpt: null, imageUrl: 'news.jpg', publishedAt: null }] };

  beforeEach(async () => {
    gsapBoundary.add.mockClear();
    gsapBoundary.revert.mockClear();
    gsapBoundary.matchMedia.mockClear();
    homeApi = { getHomeSeasonMetrics: vi.fn(), getRecentMatches: vi.fn(), getHomeNews: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([]), provideTranslateService(), { provide: HomeApiService, useValue: homeApi }, { provide: PlayerSessionService, useValue: { state: sessionState } }],
    }).compileComponents();
    sessionState.set({ status: 'anonymous' });
    translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', { home: { hero: { active: 'TEMPORADA • ATIVA', metricsAriaLabel: 'Métricas da temporada', players: 'Jogadores', matches: 'Partidas', maps: 'Mapas', viewRanking: 'Ver ranking', viewSeason: 'Ver temporada', leaderAriaLabel: 'Líder da temporada', leaderLabel: 'LÍDER DA TEMPORADA', wins: 'Vitórias' }, now: { eyebrow: 'ACONTECENDO AGORA', title: 'HSC AGORA', latestMatch: 'ÚLTIMA PARTIDA', details: 'Ver detalhes →', matchesError: 'Partidas temporariamente indisponíveis.', topThree: 'TOP 3', playerCol: 'Jogador', winsCol: 'Vitórias', lossesCol: 'Derrotas', winsShort: 'V', lossesShort: 'D', newsLabel: 'NOTÍCIAS HSC', readNews: 'Ler notícia →' }, recent: { eyebrow: 'CENTRAL DE PARTIDAS', title: 'PARTIDAS RECENTES' }, playerArea: { eyebrow: 'ÁREA DO JOGADOR', title: 'Área do Jogador', description: 'Seu perfil, identidade e histórico competitivo HSC.', actions: { open: 'Abrir Área do Jogador', signIn: 'Entrar / Acessar', fallback: 'Área do Jogador' } }, news: { eyebrow: 'HSC WIRE', title: 'NOTÍCIAS HSC', readMore: 'Ler notícia →' }, points: 'pts' } });
    translate.setTranslation('en-US', { home: { hero: { active: 'SEASON • ACTIVE', metricsAriaLabel: 'Season metrics', players: 'Players', matches: 'Matches', maps: 'Maps', viewRanking: 'View ranking', viewSeason: 'View season', leaderAriaLabel: 'Season leader', leaderLabel: 'SEASON LEADER', wins: 'Wins' }, now: { eyebrow: 'HAPPENING NOW', title: 'HSC NOW', latestMatch: 'LATEST MATCH', details: 'View details →', matchesError: 'Matches are temporarily unavailable.', topThree: 'TOP 3', playerCol: 'Player', winsCol: 'Wins', lossesCol: 'Losses', winsShort: 'W', lossesShort: 'L', newsLabel: 'HSC NEWS', readNews: 'Read news →' }, recent: { eyebrow: 'MATCH CENTER', title: 'RECENT MATCHES' }, playerArea: { eyebrow: 'PLAYER AREA', title: 'Player Area', description: 'Your HSC profile, identity, and competitive history.', actions: { open: 'Open Player Area', signIn: 'Sign in / Access', fallback: 'Player Area' } }, news: { eyebrow: 'HSC WIRE', title: 'HSC NEWS', readMore: 'Read news →' }, points: 'pts' } });
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

  it('renders the real hero, metrics, leader and active contextual links with the new electric border', () => {
    const native = render();
    expect(native.querySelector('#home-title')?.textContent).toContain('Temporada Alpha');
    expect(native.querySelector('.home-hero__metrics')?.textContent).toContain('50');
    expect(native.querySelector('.home-leader')?.textContent).toContain('Leader');
    expect(native.querySelector('.home-leader')?.textContent).toContain('15');
    expect(native.querySelector('.home-leader__energy-border')).toBeNull();
    expect(native.querySelector('.home-leader__electric-frame')).toBeTruthy();
    expect(native.querySelector('.home-leader__ambient-glow')).toBeTruthy();
    expect(native.querySelector('.home-leader__glow-diffuse')).toBeTruthy();
    expect(native.querySelector('.home-leader__glow-close')).toBeTruthy();

    const filter = native.querySelector('#home-season-leader-electric-displace');
    expect(filter).toBeTruthy();
    expect(filter?.querySelectorAll('feTurbulence').length).toBe(2);
    expect(filter?.querySelectorAll('feOffset').length).toBe(4);
    expect(filter?.querySelectorAll('feComposite').length).toBe(2);
    expect(filter?.querySelector('feBlend')).toBeTruthy();
    expect(filter?.querySelector('feDisplacementMap')).toBeTruthy();

    const hrefs = Array.from(native.querySelectorAll('.home-hero__actions a')).map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual(['/seasons/current/ranking', '/seasons/current']);
  });

  it('renders the flat factual leaderboard with all fields across 3 rows and rebuilt latest match', () => {
    const native = render();
    const now = native.querySelector('.home-section--now');
    const leaderboard = now?.querySelector('.home-leaderboard');
    expect(leaderboard?.querySelectorAll('article').length).toBe(0);

    const rows = now?.querySelectorAll('.home-leaderboard__row');
    expect(rows?.length).toBe(3);

    // Row 1 (#1 Leader)
    expect(rows?.[0].classList).toContain('home-leaderboard__row--first');
    expect(rows?.[0].querySelector('.home-leaderboard__position')?.textContent).toBe('#1');
    const rowOnePlayerCell = rows?.[0].querySelector('.home-leaderboard__player-cell');
    const rowOneCrown = rowOnePlayerCell?.querySelector('.home-leaderboard__crown');
    expect(rowOneCrown).toBeTruthy();
    expect(rowOneCrown?.getAttribute('aria-hidden')).toBe('true');
    const rowOneAvatar = rowOnePlayerCell?.querySelector('app-player-avatar');
    expect(rowOneAvatar).toBeTruthy();
    expect(rows?.[0].querySelector('.home-leaderboard__name')?.textContent).toBe('Leader');
    expect(rows?.[0].querySelector('.home-leaderboard__steam')?.textContent).toContain('76561198000000001');
    expect(rows?.[0].querySelector('.home-leaderboard__stat-cell--kd')?.textContent).toContain('1.80');
    expect(rows?.[0].querySelector('.home-leaderboard__stat-cell--wins')?.textContent).toContain('15');
    expect(rows?.[0].querySelector('.home-leaderboard__stat-cell--losses')?.textContent).toContain('3');
    expect(rows?.[0].querySelector('.home-leaderboard__stat-cell--score')?.textContent).toMatch(/2[.,]?500/);

    // Row 2 (#2 Second)
    expect(rows?.[1].querySelector('.home-leaderboard__crown')).toBeNull();
    expect(rows?.[1].querySelector('.home-leaderboard__position')?.textContent).toBe('#2');
    expect(rows?.[1].querySelector('.home-leaderboard__name')?.textContent).toBe('Second');
    expect(rows?.[1].querySelector('.home-leaderboard__steam')?.textContent).toContain('76561198000000002');
    expect(rows?.[1].querySelector('.home-leaderboard__stat-cell--kd')?.textContent).toContain('1.40');
    expect(rows?.[1].querySelector('.home-leaderboard__stat-cell--wins')?.textContent).toContain('12');
    expect(rows?.[1].querySelector('.home-leaderboard__stat-cell--losses')?.textContent).toContain('5');
    expect(rows?.[1].querySelector('.home-leaderboard__stat-cell--score')?.textContent).toMatch(/2[.,]?200/);

    // Row 3 (#3 Third)
    expect(rows?.[2].querySelector('.home-leaderboard__crown')).toBeNull();
    expect(rows?.[2].querySelector('.home-leaderboard__position')?.textContent).toBe('#3');
    expect(rows?.[2].querySelector('.home-leaderboard__name')?.textContent).toBe('Third');
    expect(rows?.[2].querySelector('.home-leaderboard__steam')?.textContent).toContain('76561198000000003');
    expect(rows?.[2].querySelector('.home-leaderboard__stat-cell--kd')?.textContent).toContain('1.15');
    expect(rows?.[2].querySelector('.home-leaderboard__stat-cell--wins')?.textContent).toContain('10');
    expect(rows?.[2].querySelector('.home-leaderboard__stat-cell--losses')?.textContent).toContain('7');
    expect(rows?.[2].querySelector('.home-leaderboard__stat-cell--score')?.textContent).toMatch(/1[.,]?900/);

    expect(now?.querySelector('.home-panel--notice')).toBeNull();
    expect(now?.querySelector('.home-news-card')).toBeNull();
    expect(now?.querySelector('.home-now-news__content')).toBeNull();

    const latestMatch = now?.querySelector('.home-latest-match');
    const latestMatchBg = latestMatch?.querySelector('.home-latest-match__background');
    expect(latestMatchBg?.getAttribute('src')).toBe('assets/img/backgrounds/pages/cs2-banner-1.jpg');
    expect(latestMatchBg?.getAttribute('alt')).toBe('');
    expect(latestMatchBg?.getAttribute('aria-hidden')).toBe('true');
    expect(latestMatch?.querySelector('.home-latest-match__badge')?.textContent).toContain('ÚLTIMA PARTIDA');
    expect(latestMatch?.textContent).toContain('HSC One');
    expect(latestMatch?.textContent).toContain('HSC Two');
    const scores = Array.from(latestMatch?.querySelectorAll('.home-scoreboard__score > span') ?? []);
    expect(scores.map((score) => score.textContent?.trim())).toEqual(['2', '1']);
    expect(latestMatch?.textContent).toContain('de_nuke 13–8');
    expect(latestMatch?.textContent).toContain('04/08/2026 · 11:00 UTC');
    expect(native.querySelector('.home-match-row')?.getAttribute('href')).toBe('/matches/42');

    expect(native.querySelectorAll('.home-news-card').length).toBe(2);
    const newsCards = Array.from(native.querySelectorAll('.home-news-card'));
    expect(newsCards[0].querySelector('img')).toBeNull();
    expect(newsCards[0].classList).toContain('home-news-card--without-image');
    expect(newsCards[1].querySelector('img')?.getAttribute('src')).toBe('news.jpg');
    expect(newsCards[1].querySelector('img')?.getAttribute('alt')).toBe('');
    expect(newsCards[1].querySelector('img')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps all five major sections and electric border frame present without an initial hidden state', () => {
    const native = render();
    const sections = native.querySelectorAll('.home-hero, .home-section--now, .home-section--recent, .home-player-cta, .home-section--news');
    expect(sections.length).toBe(5);
    expect(native.querySelector('[data-reveal], [data-revealed]')).toBeNull();
    expect(Array.from(sections).every((section) => !section.hasAttribute('hidden'))).toBe(true);
    expect(native.querySelector('.home-leader__electric-frame')).toBeTruthy();
    expect(gsapBoundary.add).toHaveBeenCalledWith(
      expect.objectContaining({ reduceMotion: '(prefers-reduced-motion: reduce)' }),
      expect.any(Function),
    );
  });

  it('renders a decorative continuation cue without changing navigation', () => {
    const native = render();
    expect(native.querySelector('.home-scroll-cue svg')).toBeTruthy();
    expect(native.querySelector('.home-scroll-cue')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('reverts the feature-local GSAP media context on destroy', () => {
    render();
    fixture.destroy();
    expect(gsapBoundary.revert).toHaveBeenCalledOnce();
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
