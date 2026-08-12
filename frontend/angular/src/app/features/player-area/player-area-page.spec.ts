import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BunkerApiService } from '../bunker/data-access/bunker-api.service';
import type { BunkerPlayerStats, BunkerSummary } from '../bunker/domain/bunker.model';
import { PlayerAuthApiService } from '../player/data-access/player-auth-api.service';
import { PlayerEmailAuthApiService } from '../player/data-access/player-email-auth-api.service';
import { PlayerIdentityApiService } from '../player/data-access/player-identity-api.service';
import { PlayerIdentityLinkApiService } from '../player/data-access/player-identity-link-api.service';
import { PlayerSelfApiService } from '../player/data-access/player-self-api.service';
import { PlayerServerAccessApiService } from '../player/data-access/player-server-access-api.service';
import { PlayerAreaPage } from './player-area-page';
import { PlayerSessionService } from '../../core/session/player-session.service';
import type { PlayerSession } from '../../core/session/player-session.model';

describe('PlayerAreaPage athlete dashboard', () => {
  let fixture: ComponentFixture<PlayerAreaPage>;
  let router: Router;
  const identityApi = { getCurrentIdentity: vi.fn() };
  const selfApi = {
    getAccount: vi.fn(), getProfile: vi.fn(), getMembership: vi.fn(), updateProfile: vi.fn(),
    uploadAvatar: vi.fn(), removeAvatar: vi.fn(), uploadBanner: vi.fn(), removeBanner: vi.fn(),
  };
  const bunkerApi = { getSummary: vi.fn() };
  const authApi = { steamLoginUrl: '/player/auth/steam/start', steamLinkUrl: '/player/auth/steam/link/start', logout: vi.fn(() => of(undefined)) };
  const serverAccessApi = { getServerAccess: vi.fn() };
  let globalSessionState: PlayerSession = { status: 'anonymous' };
  let signedOutEvents = new Subject<void>();
  const playerSession = {
    state: vi.fn((): PlayerSession => globalSessionState),
    signedOut$: signedOutEvents.asObservable(),
    load: vi.fn((onComplete?: () => void) => onComplete?.()),
    logout: vi.fn<(onSuccess?: () => void, onError?: () => void) => void>(() => undefined),
  };

  const seasonStats: BunkerPlayerStats = {
    mapsPlayed: 12, matchesPlayed: 12, wins: 6, losses: 6, winRate: .5, kdRatio: .55,
    adr: 52.3, impactRating: .58, kills: 108, deaths: 196, assists: 66, roundsPlayed: 267,
    headshotPct: .463, accuracy: .163, utilityDmgPerRound: 3.1, killsPerRound: null,
    assistsPerRound: null, deathsPerRound: null, entryWinRate: .167, v1Count: 5, v1Wins: 2,
    v1WinRate: .4, v2Count: 9, v2Wins: 3, v2WinRate: .333, enemy2ks: 14, enemy3ks: 3,
    enemy4ks: 1, enemy5ks: 0, sampleWeight: 1, score: .5,
  };
  const summary: BunkerSummary = {
    status: 'ready', seasonFirst: true, statsAvailable: true,
    currentSeason: { slug: 's2-2026', name: 'Season 02', status: 'active', scope: { startAt: '2026-04-01T00:00:00Z', endAt: '2026-09-30T00:00:00Z' } },
    seasonPlayer: { name: 'Player HSC', steamId64: '76561198000000001', generatedAt: '2026-08-11T17:00:00Z', summary: seasonStats, byMap: [], recentMaps: [], timeline: [] },
    competitiveProfile: { generatedAt: null, steamId64: '76561198000000001', name: 'Player HSC', avatarMedium: null, steamProfileUrl: null, lifetime: { ...seasonStats, kdRatio: 9.99 } },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    globalSessionState = { status: 'anonymous' };
    signedOutEvents = new Subject<void>();
    playerSession.signedOut$ = signedOutEvents.asObservable();
    playerSession.load.mockImplementation((onComplete?: () => void) => onComplete?.());
    playerSession.logout.mockImplementation((onSuccess?: () => void) => {
      globalSessionState = { status: 'anonymous' };
      signedOutEvents.next();
      onSuccess?.();
    });
    identityApi.getCurrentIdentity.mockReturnValue(of({ displayName: 'Steam Player', steamId64: '76561198000000001', avatarMedium: null, steamProfileUrl: null }));
    selfApi.getAccount.mockReturnValue(of({ status: 'active', identities: { email: { linked: true, email: 'player@example.test', verified: true }, steam: { linked: true, steamId64: '76561198000000001' } }, capabilities: { cs2Identity: { ready: true, reason: null }, personalizedStats: { available: true, reason: null } } }));
    selfApi.getProfile.mockReturnValue(of({ displayName: 'Player HSC', slug: 'player-hsc', bio: 'Perfil real.', avatarUrl: '/media/avatar.webp', bannerUrl: '/media/banner.webp', discordHandle: 'player.hsc', preferredRole: 'rifler', preferredMap: 'de_mirage', visibility: 'public', joinedAt: '2026-01-01T00:00:00Z', createdAt: null, updatedAt: null }));
    selfApi.getMembership.mockReturnValue(of({ status: 'active', planCode: 'hsc-member', startedAt: '2026-01-01T00:00:00Z', expiresAt: '2026-12-31T00:00:00Z', suspendedAt: null, cancelledAt: null }));
    serverAccessApi.getServerAccess.mockReturnValue(of({ ok: true, authorized: true, reason: 'membership_active' }));
    bunkerApi.getSummary.mockReturnValue(of(summary));

    await TestBed.configureTestingModule({
      imports: [PlayerAreaPage],
      providers: [
        provideRouter([]),
        { provide: PlayerIdentityApiService, useValue: identityApi }, { provide: PlayerSelfApiService, useValue: selfApi },
        { provide: BunkerApiService, useValue: bunkerApi }, { provide: PlayerAuthApiService, useValue: authApi },
        { provide: PlayerEmailAuthApiService, useValue: { login: vi.fn(), register: vi.fn(), requestPasswordReset: vi.fn() } },
        { provide: PlayerIdentityLinkApiService, useValue: { requestEmailLink: vi.fn() } },
        { provide: PlayerServerAccessApiService, useValue: serverAccessApi },
        { provide: PlayerSessionService, useValue: playerSession },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}), queryParams: {} } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PlayerAreaPage);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  async function render(): Promise<HTMLElement> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function click(native: HTMLElement, label: string): void {
    const target = Array.from(native.querySelectorAll('button')).find((item) => item.textContent?.trim() === label);
    if (!target) throw new Error(`Button not found: ${label}`);
    target.click();
    fixture.detectChanges();
  }

  it('renders the athlete hero with real media, preferences and session status', async () => {
    const native = await render();
    expect(native.querySelector('.athlete-hero h1')?.textContent).toContain('Player HSC');
    expect(native.querySelector('.athlete-hero__banner')?.getAttribute('src')).toBe('/media/banner.webp');
    expect(native.querySelector('.athlete-hero__avatar img')?.getAttribute('src')).toBe('/media/avatar.webp');
    expect(native.textContent).toContain('Rifler');
    expect(native.textContent).toContain('Mirage');
    expect(native.textContent).toContain('Sessão conectada');
  });

  it('renders authoritative server access and membership states', async () => {
    const text = (await render()).textContent;
    expect(text).toContain('Acesso liberado');
    expect(text).toContain('Associação ativa');
  });

  it('does not claim access when the server decision is negative', async () => {
    serverAccessApi.getServerAccess.mockReturnValue(of({ ok: true, authorized: false, reason: 'membership_required' }));
    const text = (await render()).textContent ?? '';
    expect(text).toContain('Membership HSC necessário');
    expect(text).not.toContain('Acesso liberado');
  });

  it('keeps settings closed by default and toggles them from the hero', async () => {
    const native = await render();
    expect(native.querySelector('#player-settings')).toBeNull();
    click(native, 'Editar perfil / configurações');
    expect(native.querySelector('#player-settings')).toBeTruthy();
    click(native, 'Fechar configurações');
    expect(native.querySelector('#player-settings')).toBeNull();
  });

  it('uses seasonPlayer summary and never lifetime as Season fallback', async () => {
    const dashboard = (await render()).querySelector('.season-dashboard')?.textContent ?? '';
    expect(dashboard).toContain('0,55');
    expect(dashboard).not.toContain('9,99');
    expect(dashboard).toContain('Season 02');
    expect(dashboard).toContain('11/08/2026');
  });

  it('shows absence for null Season metrics', async () => {
    bunkerApi.getSummary.mockReturnValue(of({ ...summary, seasonPlayer: { ...summary.seasonPlayer!, summary: { ...seasonStats, adr: null, v1WinRate: null } } }));
    const dashboard = (await render()).querySelector('.season-dashboard')?.textContent ?? '';
    expect(dashboard).toContain('ADR—');
    expect(dashboard).toContain('—');
  });

  it('shows a compact Season message and an explicitly identified lifetime dashboard', async () => {
    bunkerApi.getSummary.mockReturnValue(of({ ...summary, seasonPlayer: { ...summary.seasonPlayer!, summary: null } }));
    const text = (await render()).textContent ?? '';
    expect(text).toContain('Esta temporada ainda não possui estatísticas competitivas para você.');
    expect(text).toContain('Perfil Competitivo Geral');
    expect(text).toContain('Seu histórico competitivo no HSC.');
    expect(text).toContain('9,99');
  });

  it('shows a controlled competitive empty state without Season stats or lifetime', async () => {
    bunkerApi.getSummary.mockReturnValue(of({
      ...summary,
      seasonPlayer: { ...summary.seasonPlayer!, summary: null },
      competitiveProfile: { ...summary.competitiveProfile!, lifetime: null },
    }));
    const text = (await render()).textContent ?? '';
    expect(text).toContain('Seu perfil competitivo ainda não possui histórico disponível.');
  });

  it('renders a published Season summary with one map without a frontend threshold', async () => {
    bunkerApi.getSummary.mockReturnValue(of({
      ...summary,
      seasonPlayer: { ...summary.seasonPlayer!, summary: { ...seasonStats, mapsPlayed: 1 } },
    }));
    const text = (await render()).querySelector('.season-dashboard')?.textContent ?? '';
    expect(text).toContain('1 mapa registrado nesta temporada.');
    expect(text).toContain('0,55');
    expect(text).not.toContain('Perfil Competitivo Geral');
  });

  it('renders lifetime directly without an artificial Season shell when no current Season exists', async () => {
    bunkerApi.getSummary.mockReturnValue(of({
      ...summary,
      currentSeason: null,
      seasonPlayer: null,
    }));
    const native = await render();
    expect(native.textContent).toContain('Perfil Competitivo Geral');
    expect(native.querySelector('#season-performance-title')).toBeNull();
    expect(native.textContent).toContain('9,99');
  });

  it('keeps identity visible when stats fail', async () => {
    bunkerApi.getSummary.mockReturnValue(throwError(() => new Error('stats')));
    const text = (await render()).textContent ?? '';
    expect(text).toContain('Player HSC');
    expect(text).toContain('resumo competitivo está temporariamente indisponível');
    expect(text).toContain('player@example.test');
  });

  it('links to full analysis with the new copy', async () => {
    const native = await render();
    expect(native.querySelector('.competitive-report-link')?.getAttribute('href')).toBe('/area-do-jogador/estatisticas');
    expect(native.textContent).not.toContain('Abrir relatório competitivo completo');
  });

  it('removes old admin navigation and does not invent server actions', async () => {
    const native = await render();
    expect(native.querySelector('.player-area-page__nav')).toBeNull();
    expect(native.textContent).not.toContain('CONNECT TO SERVER');
    expect(native.textContent).not.toContain('COPY IP');
  });

  it('preserves profile, media, account, membership, public profile and logout in settings', async () => {
    const native = await render();
    click(native, 'Editar perfil / configurações');
    expect(native.querySelector('app-player-profile-media-editor')).toBeTruthy();
    expect(native.querySelector('app-player-account-security-panel')).toBeTruthy();
    expect(native.textContent).toContain('Sua associação');
    expect(native.querySelector('a[href="/players/player-hsc"]')).toBeTruthy();
    expect(native.textContent).toContain('Sair');
    click(native, 'Editar perfil');
    expect(native.querySelector('app-player-profile-editor')).toBeTruthy();
  });

  it('renders the unauthenticated player gateway without the athlete dashboard', async () => {
    identityApi.getCurrentIdentity.mockReturnValue(of(null));
    const native = await render();
    expect(native.querySelector('.player-gateway')).toBeTruthy();
    expect(native.textContent).toContain('Seu espaço competitivo HSC');
    expect(native.textContent).toContain('Entre para acessar sua área');
    expect(native.querySelector('a[href="/player/auth/steam/start"]')).toBeTruthy();
    expect(native.querySelector('.athlete-hero')).toBeNull();
    expect(native.querySelector('.season-dashboard')).toBeNull();
    expect(selfApi.getAccount).not.toHaveBeenCalled();
  });

  it('synchronizes the global session when Player Area confirms authentication', async () => {
    await render();
    expect(playerSession.load).toHaveBeenCalledTimes(1);
  });

  it('does not refresh a global session that is already authenticated', async () => {
    globalSessionState = {
      status: 'authenticated',
      displayName: 'Player HSC',
      steamId64: '76561198000000001',
      avatarMedium: null,
    };
    await render();
    expect(playerSession.load).not.toHaveBeenCalled();
  });

  it('refreshes global session before reloading after local authentication', async () => {
    identityApi.getCurrentIdentity.mockReturnValueOnce(of(null)).mockReturnValue(of({ displayName: 'Player HSC', steamId64: '76561198000000001', avatarMedium: null, steamProfileUrl: null }));
    playerSession.load.mockImplementation((onComplete?: () => void) => {
      globalSessionState = {
        status: 'authenticated',
        displayName: 'Player HSC',
        steamId64: '76561198000000001',
        avatarMedium: null,
      };
      onComplete?.();
    });
    const native = await render();
    const panel = fixture.debugElement.query(By.css('app-player-email-auth-panel'));
    panel.triggerEventHandler('authenticated', undefined);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(playerSession.load).toHaveBeenCalledTimes(1);
    expect(native.querySelector('.athlete-hero')).toBeTruthy();
  });

  it('uses global logout and clears the authenticated Player Area after success', async () => {
    const native = await render();
    click(native, 'Editar perfil / configurações');
    expect(native.querySelector('#player-settings')).toBeTruthy();
    click(native, 'Sair');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(playerSession.logout).toHaveBeenCalledTimes(1);
    expect(globalSessionState.status).toBe('anonymous');
    expect(native.textContent).toContain('Entre para acessar sua área');
    expect(native.querySelector('#player-settings')).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/area-do-jogador', {
      replaceUrl: true,
    });
    expect(authApi.logout).not.toHaveBeenCalled();
  });

  it('reacts to a successful global logout while Player Area is already loaded', async () => {
    const native = await render();
    click(native, 'Editar perfil / configurações');
    globalSessionState = { status: 'anonymous' };
    signedOutEvents.next();
    fixture.detectChanges();

    expect(native.textContent).toContain('Entre para acessar sua área');
    expect(native.querySelector('#player-settings')).toBeNull();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('keeps the authenticated dashboard and route when logout fails', async () => {
    globalSessionState = {
      status: 'authenticated',
      displayName: 'Player HSC',
      steamId64: '76561198000000001',
      avatarMedium: null,
    };
    playerSession.logout.mockImplementation((...callbacks) => callbacks[1]?.());
    const native = await render();
    click(native, 'Editar perfil / configurações');
    click(native, 'Sair');

    expect(globalSessionState.status).toBe('authenticated');
    expect(native.querySelector('.athlete-hero')).toBeTruthy();
    expect(native.querySelector('#player-settings')).toBeTruthy();
    expect(native.textContent).toContain('Não foi possível encerrar a sessão.');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('does not request logout twice while the first request is pending', async () => {
    playerSession.logout.mockImplementation(() => undefined);
    const native = await render();
    click(native, 'Editar perfil / configurações');
    const logoutButton = Array.from(native.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Sair',
    );
    expect(logoutButton).toBeTruthy();

    logoutButton?.click();
    logoutButton?.click();
    fixture.detectChanges();

    expect(playerSession.logout).toHaveBeenCalledTimes(1);
    expect(logoutButton?.textContent).toContain('Saindo...');
  });

  it.each([401, 403])('keeps Server Access HTTP %s unauthenticated', async (status) => {
    serverAccessApi.getServerAccess.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
    expect((await render()).textContent).toContain('Entre para acessar sua área');
  });
});
