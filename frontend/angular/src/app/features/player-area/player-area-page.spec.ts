import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BunkerApiService } from '../bunker/data-access/bunker-api.service';
import { PlayerAuthApiService } from '../player/data-access/player-auth-api.service';
import { PlayerEmailAuthApiService } from '../player/data-access/player-email-auth-api.service';
import { PlayerIdentityApiService } from '../player/data-access/player-identity-api.service';
import { PlayerSelfApiService } from '../player/data-access/player-self-api.service';
import type { PlayerProfile } from '../player/domain/player-profile.model';
import { PlayerAreaPage } from './player-area-page';
import { PlayerProfileMediaEditor } from './player-profile-media-editor/player-profile-media-editor';

describe('PlayerAreaPage', () => {
  let fixture: ComponentFixture<PlayerAreaPage>;

  const identityApi = {
    getCurrentIdentity: vi.fn(),
  };

  const selfApi = {
    getAccount: vi.fn(),
    getProfile: vi.fn(),
    getMembership: vi.fn(),
    updateProfile: vi.fn(),
    uploadAvatar: vi.fn(),
    removeAvatar: vi.fn(),
    uploadBanner: vi.fn(),
    removeBanner: vi.fn(),
  };

  const bunkerApi = {
    getSummary: vi.fn(),
  };

  const authApi = {
    steamLoginUrl: '/player/auth/steam/start',
    steamLinkUrl: '/player/auth/steam/link/start',
    logout: vi.fn(() => of(undefined)),
  };

  const emailAuthApi = {
    login: vi.fn(),
    register: vi.fn(),
    requestPasswordReset: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    identityApi.getCurrentIdentity.mockReturnValue(
      of({
        displayName: 'Steam Player',
        steamId64: '76561198000000001',
        avatarMedium: null,
        steamProfileUrl: null,
      }),
    );

    selfApi.getAccount.mockReturnValue(
      of({
        status: 'active',
        identities: {
          email: {
            linked: true,
            email: 'player@example.test',
            verified: true,
          },
          steam: {
            linked: true,
            steamId64: '76561198000000001',
          },
        },
        capabilities: {
          cs2Identity: {
            ready: true,
            reason: null,
          },
          personalizedStats: {
            available: true,
            reason: null,
          },
        },
      }),
    );

    selfApi.getProfile.mockReturnValue(
      of({
        displayName: 'Player HSC',
        slug: 'player-hsc',
        bio: 'Perfil de teste.',
        avatarUrl: null,
        bannerUrl: null,
        discordHandle: 'player.hsc',
        preferredRole: 'rifler',
        preferredMap: 'de_mirage',
        visibility: 'public',
        joinedAt: '2026-08-07T10:00:00.000Z',
        createdAt: '2026-08-07T10:00:00.000Z',
        updatedAt: '2026-08-07T10:00:00.000Z',
      }),
    );

    selfApi.getMembership.mockReturnValue(
      of({
        status: 'active',
        planCode: 'hsc-member',
        startedAt: '2026-08-07T10:00:00.000Z',
        expiresAt: null,
        suspendedAt: null,
        cancelledAt: null,
      }),
    );

    bunkerApi.getSummary.mockReturnValue(
      of({
        status: 'ready',
        seasonFirst: true,
        statsAvailable: true,
        currentSeason: {
          slug: 's2-2026',
          name: 'Season 02',
          status: 'active',
          scope: null,
        },
        seasonPlayer: null,
        competitiveProfile: {
          generatedAt: null,
          steamId64: '76561198000000001',
          name: 'Player HSC',
          avatarMedium: null,
          steamProfileUrl: null,
          lifetime: {
            mapsPlayed: 12,
            matchesPlayed: 12,
            wins: 7,
            losses: 5,
            winRate: 0.583,
            kdRatio: 1.12,
            adr: 78.4,
            impactRating: 1.04,
            kills: 140,
            deaths: 125,
            assists: 41,
            roundsPlayed: 250,
            headshotPct: 0.42,
            accuracy: 0.21,
            utilityDmgPerRound: 12.3,
            killsPerRound: 0.56,
            assistsPerRound: 0.16,
            deathsPerRound: 0.5,
            entryWinRate: 0.51,
            v1Count: 0,
            v1Wins: 0,
            v1WinRate: 0,
            v2Count: 0,
            v2Wins: 0,
            v2WinRate: 0,
            enemy2ks: 0,
            enemy3ks: 0,
            enemy4ks: 0,
            enemy5ks: 0,
            sampleWeight: 1,
            score: 50,
          },
        },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [PlayerAreaPage],
      providers: [
        provideRouter([]),
        { provide: PlayerIdentityApiService, useValue: identityApi },
        { provide: PlayerSelfApiService, useValue: selfApi },
        { provide: BunkerApiService, useValue: bunkerApi },
        { provide: PlayerAuthApiService, useValue: authApi },
        { provide: PlayerEmailAuthApiService, useValue: emailAuthApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerAreaPage);
  });

  it('renderiza Account, Profile, Membership e stats reais', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Área do Jogador');
    expect(text).toContain('Player HSC');
    expect(text).toContain('Conta e segurança');
    expect(text).toContain('Visível para membros HSC');
    expect(text).toContain('Associação ativa');
    expect(text).toContain('Estatísticas personalizadas');
    expect(text).toContain('Season 02');
    expect(text).toContain('1,12');
  });

  it('renderiza autenticação por e-mail e mantém Steam no estado não autenticado', async () => {
    identityApi.getCurrentIdentity.mockReturnValue(of(null));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Entre para acessar sua área');
    expect(element.textContent).toContain('Entrar com Steam');
    expect(element.querySelector<HTMLAnchorElement>('a[href="/player/auth/steam/start"]')).toBeTruthy();
  });

  it('recarrega o fluxo autoritativo após autenticação por e-mail', async () => {
    identityApi.getCurrentIdentity.mockReturnValueOnce(of(null));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    identityApi.getCurrentIdentity.mockReturnValue(of({
      displayName: 'Email Player',
      steamId64: null,
      avatarMedium: null,
      steamProfileUrl: null,
    }));
    const panel = fixture.debugElement.query(By.css('app-player-email-auth-panel'));
    panel.triggerEventHandler('authenticated', undefined);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(identityApi.getCurrentIdentity).toHaveBeenCalledTimes(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Player HSC');
  });

  it('conta HSC autenticada sem Steam pode abrir e salvar o perfil', async () => {
    identityApi.getCurrentIdentity.mockReturnValue(
      of({
        displayName: 'Email Player',
        steamId64: null,
        avatarMedium: null,
        steamProfileUrl: null,
      }),
    );

    selfApi.getAccount.mockReturnValue(
      of({
        status: 'active',
        identities: {
          email: {
            linked: true,
            email: 'email-only@example.test',
            verified: true,
          },
          steam: {
            linked: false,
            steamId64: null,
          },
        },
        capabilities: {
          cs2Identity: {
            ready: false,
            reason: 'steam_link_required',
          },
          personalizedStats: {
            available: false,
            reason: 'steam_link_required',
          },
        },
      }),
    );

    selfApi.getMembership.mockReturnValue(of(null));

    selfApi.updateProfile.mockReturnValue(
      of({
        displayName: 'Email Player HSC',
        slug: 'player-hsc',
        bio: 'Perfil de teste.',
        avatarUrl: null,
        bannerUrl: null,
        discordHandle: 'player.hsc',
        preferredRole: 'rifler',
        preferredMap: 'de_mirage',
        visibility: 'public',
        joinedAt: '2026-08-07T10:00:00.000Z',
        createdAt: '2026-08-07T10:00:00.000Z',
        updatedAt: '2026-08-08T10:00:00.000Z',
      }),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Área do Jogador');
    expect(text).toContain('Conta ativa sem identidade Steam vinculada');
    expect(text).toContain('Vincular Steam');
    expect(text).toContain('Sem associação HSC');
    expect(bunkerApi.getSummary).not.toHaveBeenCalled();

    const component = fixture.componentInstance;

    component['startEditProfile']();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        'app-player-profile-editor',
      ),
    ).not.toBeNull();

    component['onSaveProfile']({
      displayName: 'Email Player HSC',
    });
    fixture.detectChanges();

    expect(selfApi.updateProfile).toHaveBeenCalledWith({
      displayName: 'Email Player HSC',
    });

    const updatedText =
      (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(updatedText).toContain('Email Player HSC');
    expect(component['isEditingProfile']()).toBe(false);
  });

  it('sessão ausente não consulta dados privados adicionais', async () => {
    identityApi.getCurrentIdentity.mockReturnValue(of(null));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Entre para acessar sua área');
    expect(selfApi.getAccount).not.toHaveBeenCalled();
    expect(selfApi.getProfile).not.toHaveBeenCalled();
    expect(selfApi.getMembership).not.toHaveBeenCalled();
    expect(bunkerApi.getSummary).not.toHaveBeenCalled();
  });

  it('falha das stats não derruba conta, perfil e membership', async () => {
    bunkerApi.getSummary.mockReturnValue(
      throwError(() => new Error('stats unavailable')),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Área do Jogador');
    expect(text).toContain('Player HSC');
    expect(text).toContain('Conta e segurança');
    expect(text).toContain('Associação ativa');
    expect(text).toContain('resumo competitivo está');
    expect(text).toContain('indisponível agora');
  });

  it('abre e fecha o editor de perfil via botões de ação', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component['isEditingProfile']()).toBe(false);

    component['startEditProfile']();
    fixture.detectChanges();
    expect(component['isEditingProfile']()).toBe(true);

    component['cancelEditProfile']();
    fixture.detectChanges();
    expect(component['isEditingProfile']()).toBe(false);
  });

  it('orquestra atualização de perfil com sucesso via selfApi.updateProfile e renderiza no DOM', async () => {
    const updatedProfileData: PlayerProfile = {
      displayName: 'Player HSC Atualizado',
      slug: 'player-hsc-novo',
      bio: 'Nova bio',
      avatarUrl: null,
      bannerUrl: null,
      discordHandle: 'player.novo',
      preferredRole: 'awper',
      preferredMap: 'de_train',
      visibility: 'public',
      joinedAt: '2026-08-07T10:00:00.000Z',
      createdAt: '2026-08-07T10:00:00.000Z',
      updatedAt: '2026-08-08T10:00:00.000Z',
    };

    selfApi.updateProfile.mockReturnValue(of(updatedProfileData));

    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component['startEditProfile']();
    fixture.detectChanges();

    component['onSaveProfile']({ displayName: 'Player HSC Atualizado' });
    fixture.detectChanges();

    expect(selfApi.updateProfile).toHaveBeenCalledWith({ displayName: 'Player HSC Atualizado' });
    expect(component['isEditingProfile']()).toBe(false);
    expect(component['updatedProfile']()).toEqual(updatedProfileData);
    expect(component['successNotice']()).toBe('Perfil atualizado.');

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Player HSC Atualizado');
    expect(text).toContain('player-hsc-novo');
    expect(text).toContain('Perfil atualizado.');
  });

  it('erro 409 do servidor (slug_unavailable) via HttpErrorResponse mantém editor aberto e define erro estruturado na prop do slug', async () => {
    const errorResponse = new HttpErrorResponse({
      error: { error: 'slug_unavailable' },
      status: 409,
      statusText: 'Conflict',
    });

    selfApi.updateProfile.mockReturnValue(throwError(() => errorResponse));

    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component['startEditProfile']();
    fixture.detectChanges();

    component['onSaveProfile']({ slug: 'em-uso' });
    fixture.detectChanges();

    expect(component['isEditingProfile']()).toBe(true);
    expect(component['saveError']()).toEqual({
      targetField: 'slug',
      code: 'slug_unavailable',
      message: 'Este endereço de perfil já está em uso por outro jogador.',
    });
  });

  it('PATCH 401 encerra edição e transiciona workspace para não autenticado', async () => {
    const errorResponse = new HttpErrorResponse({
      error: { error: 'unauthorized' },
      status: 401,
      statusText: 'Unauthorized',
    });

    selfApi.updateProfile.mockReturnValue(throwError(() => errorResponse));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['startEditProfile']();
    component['onSaveProfile']({ displayName: 'Sessão expirada' });
    fixture.detectChanges();

    expect(component['isEditingProfile']()).toBe(false);
    expect(component['saveError']()).toBeNull();
    expect(component['updatedProfile']()).toBeNull();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Entre para acessar sua área');
  });

  it('PATCH 403 permanece como falha local e mantém editor aberto', async () => {
    const errorResponse = new HttpErrorResponse({
      error: { error: 'player_account_disabled' },
      status: 403,
      statusText: 'Forbidden',
    });

    selfApi.updateProfile.mockReturnValue(throwError(() => errorResponse));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['startEditProfile']();
    component['onSaveProfile']({ displayName: 'Não permitido' });
    fixture.detectChanges();

    expect(component['isEditingProfile']()).toBe(true);
    expect(component['saveError']()).toEqual({
      code: 'player_account_disabled',
      message: 'Sua conta HSC está desativada.',
    });

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Conta e segurança');
    expect(text).toContain('Associação ativa');
  });


  it('falha inesperada no PATCH mantém editor aberto e preserva a Área do Jogador', async () => {
    selfApi.updateProfile.mockReturnValue(
      throwError(() => new Error('invalid profile response contract')),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;

    component['startEditProfile']();
    fixture.detectChanges();

    component['onSaveProfile']({
      displayName: 'Perfil inválido',
    });
    fixture.detectChanges();

    expect(component['isEditingProfile']()).toBe(true);
    expect(component['savePending']()).toBe(false);
    expect(component['saveError']()).toEqual({
      code: 'unknown_error',
      message: 'Ocorreu um erro ao salvar o perfil. Tente novamente.',
    });

    const textContent =
      (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(textContent).toContain('Área do Jogador');
    expect(textContent).toContain(
      'Ocorreu um erro ao salvar o perfil. Tente novamente.',
    );
  });

  it('renderiza o editor de mídia quando a Área do Jogador está ready', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        'app-player-profile-media-editor',
      ),
    ).not.toBeNull();
  });

  it('faz upload de avatar sem atualização otimista e adota exatamente o profile retornado', async () => {
    const response = new Subject<PlayerProfile>();
    const returnedProfile = profileWithMedia({ avatarUrl: '/media/new-avatar.webp' });
    const file = new File(['avatar'], 'avatar.webp', { type: 'image/webp' });
    selfApi.uploadAvatar.mockReturnValue(response);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['onAvatarUpload'](file);

    expect(selfApi.uploadAvatar).toHaveBeenCalledWith(file);
    expect(component['avatarPending']()).toBe(true);
    expect(component['bannerPending']()).toBe(false);
    expect(component['updatedProfile']()).toBeNull();

    response.next(returnedProfile);
    fixture.detectChanges();

    expect(component['updatedProfile']()).toBe(returnedProfile);
    expect(component['avatarPending']()).toBe(false);
    expect(component['successNotice']()).toBe('Avatar atualizado.');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="avatar-section"] img',
      )?.getAttribute('src'),
    ).toBe('/media/new-avatar.webp');
  });

  it('remove avatar somente depois de receber o profile canônico do backend', async () => {
    const response = new Subject<PlayerProfile>();
    const currentProfile = profileWithMedia({ avatarUrl: '/media/avatar.webp' });
    const returnedProfile = profileWithMedia({ avatarUrl: null });
    selfApi.removeAvatar.mockReturnValue(response);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance['updatedProfile'].set(currentProfile);
    fixture.detectChanges();

    fixture.componentInstance['onAvatarRemove']();

    expect(selfApi.removeAvatar).toHaveBeenCalledOnce();
    expect(fixture.componentInstance['updatedProfile']()).toBe(currentProfile);

    response.next(returnedProfile);
    fixture.detectChanges();

    expect(fixture.componentInstance['updatedProfile']()).toBe(returnedProfile);
    expect(fixture.componentInstance['successNotice']()).toBe('Avatar removido.');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="avatar-section"] img',
      ),
    ).toBeNull();
  });

  it('faz upload e remoção de banner usando somente os profiles retornados', async () => {
    const uploadedProfile = profileWithMedia({ bannerUrl: '/media/new-banner.webp' });
    const removedProfile = profileWithMedia({ bannerUrl: null });
    const file = new File(['banner'], 'banner.webp', { type: 'image/webp' });
    selfApi.uploadBanner.mockReturnValue(of(uploadedProfile));
    selfApi.removeBanner.mockReturnValue(of(removedProfile));

    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component['onBannerUpload'](file);
    fixture.detectChanges();

    expect(selfApi.uploadBanner).toHaveBeenCalledWith(file);
    expect(component['updatedProfile']()).toBe(uploadedProfile);
    expect(component['successNotice']()).toBe('Banner atualizado.');

    component['onBannerRemove']();
    fixture.detectChanges();

    expect(selfApi.removeBanner).toHaveBeenCalledOnce();
    expect(component['updatedProfile']()).toBe(removedProfile);
    expect(component['successNotice']()).toBe('Banner removido.');
  });

  it('mantém pending de avatar e banner independentes', async () => {
    const avatarResponse = new Subject<PlayerProfile>();
    const bannerResponse = new Subject<PlayerProfile>();
    selfApi.uploadAvatar.mockReturnValue(avatarResponse);
    selfApi.uploadBanner.mockReturnValue(bannerResponse);

    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component['onAvatarUpload'](new File(['avatar'], 'avatar.webp'));
    expect(component['avatarPending']()).toBe(true);
    expect(component['bannerPending']()).toBe(false);

    component['onBannerUpload'](new File(['banner'], 'banner.webp'));
    expect(component['avatarPending']()).toBe(true);
    expect(component['bannerPending']()).toBe(true);

    avatarResponse.next(profileWithMedia({ avatarUrl: '/media/avatar.webp' }));
    expect(component['avatarPending']()).toBe(false);
    expect(component['bannerPending']()).toBe(true);
  });

  it('mantém erros 400 e 403 de mídia locais e preserva o profile canônico', async () => {
    const currentProfile = profileWithMedia({ avatarUrl: '/media/avatar.webp' });
    selfApi.uploadAvatar.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: { error: 'invalid_file_type' },
            status: 400,
          }),
      ),
    );
    selfApi.removeBanner.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: { error: 'player_account_disabled' },
            status: 403,
          }),
      ),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance['updatedProfile'].set(currentProfile);

    fixture.componentInstance['onAvatarUpload'](new File(['bad'], 'bad.gif'));
    fixture.componentInstance['onBannerRemove']();
    fixture.detectChanges();

    expect(fixture.componentInstance['updatedProfile']()).toBe(currentProfile);
    expect(fixture.componentInstance['avatarError']()).toBe(
      'Formato de imagem não permitido. Use JPEG, PNG ou WebP.',
    );
    expect(fixture.componentInstance['bannerError']()).toBe(
      'Sua conta HSC está desativada.',
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Conta e segurança',
    );
  });

  it('encerra a sessão em erro 401 de mídia e finaliza o pending', async () => {
    const avatarResponse = new Subject<PlayerProfile>();
    selfApi.uploadAvatar.mockReturnValue(avatarResponse);
    selfApi.uploadBanner.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: { error: 'invalid_session' },
            status: 401,
          }),
      ),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance['updatedProfile'].set(
      profileWithMedia({ avatarUrl: '/media/avatar.webp' }),
    );

    fixture.componentInstance['onAvatarUpload'](new File(['avatar'], 'avatar.webp'));
    expect(fixture.componentInstance['avatarPending']()).toBe(true);

    fixture.componentInstance['onBannerUpload'](new File(['banner'], 'banner.webp'));
    fixture.detectChanges();

    expect(fixture.componentInstance['avatarPending']()).toBe(false);
    expect(fixture.componentInstance['bannerPending']()).toBe(false);
    expect(fixture.componentInstance['updatedProfile']()).toBeNull();
    expect(fixture.componentInstance['avatarError']()).toBeNull();
    expect(fixture.componentInstance['bannerError']()).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Entre para acessar sua área',
    );
  });

  it('limpa erros de mídia quando o filho emite mediaEdited', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance['avatarError'].set('Erro de avatar');
    fixture.componentInstance['bannerError'].set('Erro de banner');
    fixture.detectChanges();

    const editorInstance = fixture.debugElement.query(
      By.directive(PlayerProfileMediaEditor),
    ).componentInstance as PlayerProfileMediaEditor;
    editorInstance.mediaEdited.emit();

    expect(fixture.componentInstance['avatarError']()).toBeNull();
    expect(fixture.componentInstance['bannerError']()).toBeNull();
  });

});

function profileWithMedia(
  overrides: Partial<PlayerProfile> = {},
): PlayerProfile {
  return {
    displayName: 'Player HSC',
    slug: 'player-hsc',
    bio: 'Perfil de teste.',
    avatarUrl: null,
    bannerUrl: null,
    discordHandle: 'player.hsc',
    preferredRole: 'rifler',
    preferredMap: 'de_mirage',
    visibility: 'public',
    joinedAt: '2026-08-07T10:00:00.000Z',
    createdAt: '2026-08-07T10:00:00.000Z',
    updatedAt: '2026-08-08T10:00:00.000Z',
    ...overrides,
  };
}
