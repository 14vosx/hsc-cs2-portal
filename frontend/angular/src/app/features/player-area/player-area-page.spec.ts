import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
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
import { PlayerAccountSecurityPanel } from '../player-account-security/player-account-security-panel/player-account-security-panel';
import { PlayerSessionService } from '../../core/session/player-session.service';
import type { PlayerSession } from '../../core/session/player-session.model';

describe('PlayerAreaPage athlete dashboard', () => {
  let fixture: ComponentFixture<PlayerAreaPage>;
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
    seasonPlayer: { name: 'Player HSC', steamId64: '76561198000000001', generatedAt: '2026-08-11T17:00:00Z', season: null, summary: seasonStats, periods: {}, byMap: [], recentMaps: [], timeline: [] },
    competitiveProfile: { generatedAt: null, steamId64: '76561198000000001', name: 'Player HSC', avatarMedium: null, steamProfileUrl: null, lifetime: { ...seasonStats, kdRatio: 9.99 }, periods: {}, byMap: [], recentMaps: [], timeline: [] },
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
        provideTranslateService(),
        { provide: PlayerIdentityApiService, useValue: identityApi }, { provide: PlayerSelfApiService, useValue: selfApi },
        { provide: BunkerApiService, useValue: bunkerApi }, { provide: PlayerAuthApiService, useValue: authApi },
        { provide: PlayerEmailAuthApiService, useValue: { login: vi.fn(), register: vi.fn(), requestPasswordReset: vi.fn() } },
        { provide: PlayerIdentityLinkApiService, useValue: { requestEmailLink: vi.fn() } },
        { provide: PlayerServerAccessApiService, useValue: serverAccessApi },
        { provide: PlayerSessionService, useValue: playerSession },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}), queryParams: {} } } },
      ],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', AREA_TRANSLATIONS['pt-BR']);
    translate.setTranslation('en-US', AREA_TRANSLATIONS['en-US']);
    await firstValueFrom(translate.use('pt-BR'));
    fixture = TestBed.createComponent(PlayerAreaPage);
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
    expect(text).toContain('Associação HSC necessária');
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

  it('preserves profile, media, account, membership and public profile in settings', async () => {
    const native = await render();
    click(native, 'Editar perfil / configurações');
    expect(native.querySelector('app-player-profile-media-editor')).toBeTruthy();
    expect(native.querySelector('app-player-account-security-panel')).toBeTruthy();
    expect(native.textContent).toContain('Sua associação');
    expect(native.querySelector('a[href="/players/player-hsc"]')).toBeTruthy();
    expect(native.textContent).toContain('Fechar');
    expect(native.textContent).not.toContain('Sair');
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

  it('switches locale at runtime while preserving identity, domain and competitive values', async () => {
    const native = await render();
    click(native, 'Editar perfil / configurações');
    const readiness = native.querySelector<HTMLElement>('.readiness-strip')!;
    const ptText = native.textContent ?? '';
    expect(readiness.getAttribute('aria-label')).toBe('Prontidão dos servidores HSC');
    expect(ptText).toContain('0,55');
    expect(ptText).toContain('46,3%');
    const callsBeforeSwitch = {
      identity: identityApi.getCurrentIdentity.mock.calls.length,
      account: selfApi.getAccount.mock.calls.length,
      profile: selfApi.getProfile.mock.calls.length,
      membership: selfApi.getMembership.mock.calls.length,
      summary: bunkerApi.getSummary.mock.calls.length,
    };
    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();
    const text = native.textContent ?? '';
    expect(text).toContain('Profile and account');
    expect(text).toContain('Player HSC');
    expect(text).toContain('player@example.test');
    expect(text).toContain('76561198000000001');
    expect(text).toContain('hsc-member');
    expect(text).toContain('Rifler');
    expect(text).toContain('Mirage');
    expect(text).toContain('Season 02');
    expect(text).toContain('0.55');
    expect(text).toContain('46.3%');
    expect(text).not.toContain('0,55');
    expect(readiness.getAttribute('aria-label')).toBe('HSC Server Readiness');
    expect(native.querySelector('a[href="/players/player-hsc"]')).toBeTruthy();
    expect(identityApi.getCurrentIdentity).toHaveBeenCalledTimes(callsBeforeSwitch.identity);
    expect(selfApi.getAccount).toHaveBeenCalledTimes(callsBeforeSwitch.account);
    expect(selfApi.getProfile).toHaveBeenCalledTimes(callsBeforeSwitch.profile);
    expect(selfApi.getMembership).toHaveBeenCalledTimes(callsBeforeSwitch.membership);
    expect(bunkerApi.getSummary).toHaveBeenCalledTimes(callsBeforeSwitch.summary);
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

  it('closes settings through the Fechar affordance without requesting logout', async () => {
    const native = await render();
    click(native, 'Editar perfil / configurações');
    expect(native.querySelector('#player-settings')).toBeTruthy();
    expect(native.textContent).not.toContain('Sair');

    click(native, 'Fechar');

    expect(native.querySelector('#player-settings')).toBeNull();
    expect(playerSession.logout).not.toHaveBeenCalled();
    expect(authApi.logout).not.toHaveBeenCalled();
  });

  it('keeps Fechar configurações on the same close behavior', async () => {
    const native = await render();
    click(native, 'Editar perfil / configurações');

    click(native, 'Fechar configurações');

    expect(native.querySelector('#player-settings')).toBeNull();
    expect(playerSession.logout).not.toHaveBeenCalled();
  });

  it('reacts to a successful global logout while Player Area is already loaded', async () => {
    const native = await render();
    click(native, 'Editar perfil / configurações');
    globalSessionState = { status: 'anonymous' };
    signedOutEvents.next();
    fixture.detectChanges();

    expect(native.textContent).toContain('Entre para acessar sua área');
    expect(native.querySelector('#player-settings')).toBeNull();
  });

  it.each([401, 403])('keeps Server Access HTTP %s unauthenticated', async (status) => {
    serverAccessApi.getServerAccess.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
    expect((await render()).textContent).toContain('Entre para acessar sua área');
  });

  it.each([
    ['success', 'success'],
    ['identity_conflict', 'error'],
    ['already_linked', 'error'],
    ['unavailable', 'error'],
    ['failed', 'error'],
  ] as const)('transports steamLink=%s with semantic notice kind %s', async (result, kind) => {
    const route = TestBed.inject(ActivatedRoute) as unknown as { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap>; queryParams: Record<string, string> } };
    route.snapshot.queryParamMap = convertToParamMap({ steamLink: result });
    route.snapshot.queryParams = { steamLink: result };
    const native = await render();
    click(native, 'Editar perfil / configurações');
    const panel = fixture.debugElement.query(By.directive(PlayerAccountSecurityPanel)).componentInstance as PlayerAccountSecurityPanel;
    expect(panel.steamNoticeKind()).toBe(kind);
    expect(panel.steamNotice()).toBeTruthy();
  });

  it('does not transport a notice for an unknown steamLink result', async () => {
    const route = TestBed.inject(ActivatedRoute) as unknown as { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap>; queryParams: Record<string, string> } };
    route.snapshot.queryParamMap = convertToParamMap({ steamLink: 'unknown' });
    route.snapshot.queryParams = { steamLink: 'unknown' };
    const native = await render();
    click(native, 'Editar perfil / configurações');
    const panel = fixture.debugElement.query(By.directive(PlayerAccountSecurityPanel)).componentInstance as PlayerAccountSecurityPanel;
    expect(panel.steamNoticeKind()).toBeNull();
    expect(panel.steamNotice()).toBeNull();
  });
});

const areaDictionary = (english: boolean) => ({
  playerArea: {
    header: { eyebrow: english ? 'HSC Members' : 'HSC Membros', title: english ? 'Player Area' : 'Área do Jogador' },
    states: { loading: { description: english ? 'Loading account, profile, and Membership.' : 'Carregando conta, perfil e associação HSC.', message: english ? 'Loading your Player Area...' : 'Carregando sua Área do Jogador...' }, error: { title: english ? 'Player Area unavailable' : 'Área do Jogador indisponível', description: english ? 'Could not load your account.' : 'Não foi possível carregar sua conta HSC agora.' } },
    gateway: { description: english ? 'Your HSC account brings together your profile, CS2 identity, statistics, and Membership.' : 'Sua conta HSC centraliza perfil, identidade CS2, estatísticas personalizadas e associação.', accessMark: 'PLAYER ACCESS', benefits: { title: english ? 'Your HSC competitive space' : 'Seu espaço competitivo HSC', profile: { title: 'Perfil HSC', description: 'Sua identidade dentro da comunidade.' }, identity: { title: 'Identidade CS2', description: 'Conecte sua conta à Steam quando aplicável.' }, stats: { title: 'Estatísticas', description: 'Acompanhe sua atividade competitiva quando disponível.' }, membership: { title: english ? 'Membership' : 'Associação', description: 'Consulte o estado da sua relação com o HSC.' } } },
    hero: { preferredMap: english ? 'Preferred map · {{ value }}' : 'Mapa preferido · {{ value }}', sessionConnected: english ? 'Session connected' : 'Sessão conectada' },
    settings: { eyebrow: english ? 'Settings' : 'Configurações', title: english ? 'Profile and account' : 'Perfil e conta' },
    profile: { eyebrow: 'Perfil', title: 'Seu perfil HSC', name: 'Nome', joinedAt: 'No HSC desde', visibility: { label: 'Visibilidade', public: 'Visível para membros HSC', private: 'Privado' } },
    membership: { title: english ? 'Your Membership' : 'Sua associação', plan: 'Plano', start: 'Início', validUntil: 'Validade', empty: 'Sem associação HSC cadastrada.', status: { none: 'Sem associação HSC', inactive: 'Associação inativa', active: english ? 'Active Membership' : 'Associação ativa', suspended: 'Associação suspensa', expired: 'Associação expirada', cancelled: 'Associação cancelada' } },
    serverAccess: { readiness: english ? 'HSC Server Readiness' : 'Prontidão dos servidores HSC', unavailable: { status: 'Verificação indisponível', description: '' }, authorized: { status: english ? 'Access granted' : 'Acesso liberado', description: '' }, reasons: { steamIdentityNotLinked: { status: 'Steam necessária', description: '' }, accountDisabled: { status: 'Acesso indisponível', description: '' }, membershipRequired: { status: english ? 'HSC Membership required' : 'Associação HSC necessária', description: '' }, membershipInactive: { status: 'Associação inativa', description: '' }, membershipSuspended: { status: 'Associação suspensa', description: '' }, membershipExpired: { status: 'Associação expirada', description: '' }, membershipCancelled: { status: 'Associação cancelada', description: '' } } },
    competitive: { available: 'Disponíveis', steamRequired: 'Vínculo Steam necessário', error: 'O resumo competitivo está temporariamente indisponível. Seu perfil e sua conta continuam acessíveis.', seasonPerformance: 'Season performance', updatedAt: 'Atualizado em', registeredMaps: { one: '{{ count }} mapa registrado nesta temporada.', other: '{{ count }} mapas registrados nesta temporada.' }, noSeasonStats: { title: 'Esta temporada ainda não possui estatísticas competitivas para você.', description: 'Assim que houver dados competitivos nesta temporada, eles aparecerão aqui.' }, lifetime: { eyebrow: 'Histórico HSC', title: 'Perfil Competitivo Geral', description: 'Seu histórico competitivo no HSC.', empty: 'Seu perfil competitivo ainda não possui histórico disponível.' }, combat: { title: 'Combat Breakdown', clutchPerformance: 'Clutch Performance', success: 'Success', conversion: 'Conversion', multiKill: 'Multi-kill Counters' } },
    metrics: { winRate: 'Win Rate', mapsPlayed: 'Maps Played', wins: 'Wins', losses: 'Losses', rounds: 'Rounds', kills: 'Kills', deaths: 'Deaths', assists: 'Assists', accuracy: 'Accuracy', utilityPerRound: 'Util / R' },
    account: { ariaLabel: 'Identidades e associação', membership: english ? 'Membership' : 'Associação', email: { label: 'E-mail', notLinked: 'Não vinculado', pendingVerification: 'Vinculado · verificação pendente', verified: 'Vinculado e verificado' }, steam: { linked: 'Vinculada', notLinked: 'Não vinculada' } },
    actions: { close: english ? 'Close' : 'Fechar', closeSettings: english ? 'Close settings' : 'Fechar configurações', editSettings: 'Editar perfil / configurações', editProfile: 'Editar perfil', viewPublicProfile: 'Ver perfil público', manageAccount: 'Gerenciar conta', fullCompetitiveAnalysis: 'Ver análise competitiva completa' },
    notices: { profileUpdated: 'Perfil atualizado.', avatarUpdated: 'Avatar atualizado.', avatarRemoved: 'Avatar removido.', bannerUpdated: 'Banner atualizado.', bannerRemoved: 'Banner removido.' },
    steamLink: { results: { success: 'Steam vinculada com sucesso.', identityConflict: 'Conflito Steam.', alreadyLinked: 'Steam já vinculada.', unavailable: 'Steam indisponível.', failed: 'Falha ao vincular Steam.' } },
  },
  playerAuth: AUTH_CHILD_TRANSLATIONS[english ? 'en-US' : 'pt-BR'].playerAuth,
  playerAccount: {
    security: { eyebrow: 'Conta e segurança', title: 'Identidades de acesso', active: 'Conta ativa' },
    email: { label: 'E-mail', verified: 'Vinculado e verificado', pendingVerification: 'Vinculado · verificação pendente', notLinked: 'Nenhum e-mail vinculado.', link: 'Vincular e-mail' },
    passwordReset: { action: 'Redefinir senha', pending: 'Enviando...', success: 'Solicitação recebida.' },
    steam: { linked: 'Vinculada', notLinked: 'Nenhuma conta Steam vinculada.', link: 'Vincular Steam' },
    validation: { emailRequired: 'Informe seu e-mail.', passwordRequired: 'Informe uma senha.', confirmPasswordRequired: 'Confirme a senha.', invalidEmail: 'E-mail inválido.', passwordLength: 'Senha inválida.', passwordMismatch: 'As senhas não coincidem.' },
    emailLink: { request: { password: 'Senha', confirmPassword: 'Confirmar senha', passwordHint: 'Use de 10 a 128 caracteres.', pending: 'Enviando solicitação...', sending: 'Enviando...', cancel: 'Cancelar', submit: 'Enviar confirmação', success: 'Solicitação recebida.', errors: { generic: 'Falha no vínculo.', invalidSession: 'Sessão expirada.', accountDisabled: 'Conta indisponível.', tooManyRequests: 'Muitas tentativas.', unavailable: 'Vínculo indisponível.' } } },
  },
});

const AUTH_CHILD_TRANSLATIONS = {
  'pt-BR': { playerAuth: { eyebrow: 'Conta HSC', headings: { registration: 'Crie sua conta', resetRequest: 'Redefina sua senha', login: 'Entre para acessar sua área' }, notices: { received: 'Solicitação recebida' }, fields: { email: 'E-mail', password: 'Senha', displayName: 'Nome de exibição', optional: '(opcional)' }, hints: { passwordLength: 'Use de 10 a 128 caracteres.' }, validation: { emailRequired: 'Informe seu e-mail.', passwordRequired: 'Informe sua senha.', passwordLength: 'A senha deve ter entre 10 e 128 caracteres.' }, registration: { success: 'Cadastro recebido.' }, resetRequest: { success: 'Reset solicitado.' }, alternative: 'ou', actions: { pending: 'Aguarde...', createAccount: 'Criar conta', sendInstructions: 'Enviar instruções', login: 'Entrar', forgotPassword: 'Esqueci minha senha', backToLogin: 'Voltar para entrar', loginWithSteam: 'Entrar com Steam' } } },
  'en-US': { playerAuth: { eyebrow: 'HSC Account', headings: { registration: 'Create account', resetRequest: 'Reset password', login: 'Sign in to access your area' }, notices: { received: 'Request received' }, fields: { email: 'Email', password: 'Password', displayName: 'Display name', optional: '(optional)' }, hints: { passwordLength: 'Use 10 to 128 characters.' }, validation: { emailRequired: 'Enter email.', passwordRequired: 'Enter password.', passwordLength: 'Invalid password.' }, registration: { success: 'Registration received.' }, resetRequest: { success: 'Reset requested.' }, alternative: 'or', actions: { pending: 'Please wait...', createAccount: 'Create account', sendInstructions: 'Send instructions', login: 'Sign in', forgotPassword: 'Forgot password', backToLogin: 'Back to sign in', loginWithSteam: 'Sign in with Steam' } } },
} as const;

const AREA_TRANSLATIONS = { 'pt-BR': areaDictionary(false), 'en-US': areaDictionary(true) } as const;
