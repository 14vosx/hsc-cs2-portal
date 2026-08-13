import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, firstValueFrom, NEVER, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlayerAuthApiService } from '../player/data-access/player-auth-api.service';
import {
  PlayerPublicProfileApiService,
  PlayerPublicProfileContractError,
} from '../player/data-access/player-public-profile-api.service';
import type { PlayerPublicProfile } from '../player/domain/player-public-profile.model';
import { PlayerPublicProfilePage } from './player-public-profile-page';

describe('PlayerPublicProfilePage', () => {
  let fixture: ComponentFixture<PlayerPublicProfilePage>;
  let paramMap$: BehaviorSubject<ParamMap>;
  let publicProfileApiMock: { getProfile: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    paramMap$ = new BehaviorSubject(convertToParamMap({ slug: 'player-one' }));
    publicProfileApiMock = { getProfile: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [PlayerPublicProfilePage],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        { provide: PlayerPublicProfileApiService, useValue: publicProfileApiMock },
        provideTranslateService(),
        {
          provide: PlayerAuthApiService,
          useValue: { steamLoginUrl: '/player/auth/steam/start' },
        },
      ],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', PUBLIC_PROFILE_TRANSLATIONS['pt-BR']);
    translate.setTranslation('en-US', PUBLIC_PROFILE_TRANSLATIONS['en-US']);
    await firstValueFrom(translate.use('pt-BR'));
  });

  function createComponent(profile$ = of(createProfile())): void {
    publicProfileApiMock.getProfile.mockReturnValue(profile$);
    fixture = TestBed.createComponent(PlayerPublicProfilePage);
    fixture.detectChanges();
  }

  function pageText(): string {
    return fixture.nativeElement.textContent ?? '';
  }

  it('requests the exact route slug', () => {
    paramMap$.next(convertToParamMap({ slug: 'Exact Slug' }));
    createComponent();

    expect(publicProfileApiMock.getProfile).toHaveBeenCalledWith('Exact Slug');
  });

  it('renders loading while the profile request is pending', () => {
    createComponent(NEVER);

    const state = fixture.nativeElement.querySelector('app-page-state');
    expect(state?.getAttribute('type')).toBe('loading');
    expect(pageText()).toContain('Carregando perfil do jogador');
  });

  it('renders all public profile fields on success', () => {
    createComponent();

    expect(pageText()).toContain('Player One');
    expect(pageText()).toContain('@player-one');
    expect(pageText()).toContain('Heavy smoke.');
    expect(pageText()).toContain('player.one');
    expect(pageText()).toContain('Rifler');
    expect(pageText()).toContain('Mirage');
    expect(pageText()).toContain('2026');
    expect(fixture.nativeElement.querySelector('.player-public-profile-page__banner img')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.player-public-profile-page__avatar img')).toBeTruthy();
  });

  it('uses intentional media fallbacks and omits absent optional text', () => {
    createComponent(
      of(
        createProfile({
          bio: null,
          avatarUrl: null,
          bannerUrl: null,
          discordHandle: null,
          preferredRole: null,
          preferredMap: null,
        }),
      ),
    );

    expect(fixture.nativeElement.querySelector('.player-public-profile-page__banner-fallback')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.player-public-profile-page__avatar span')).toBeTruthy();
    expect(pageText()).not.toContain('Sobre');
    expect(pageText()).not.toContain('Discord');
    expect(pageText()).not.toContain('Função preferida');
    expect(pageText()).not.toContain('Mapa preferido');
  });

  it('does not display private-account or competitive fields', () => {
    createComponent();

    const text = pageText();
    expect(text).not.toContain('SteamID');
    expect(text).not.toContain('E-mail');
    expect(text).not.toContain('Membership');
    expect(text).not.toContain('Visibilidade');
    expect(text).not.toContain('Ranking');
    expect(text).not.toContain('Estatísticas');
  });

  it.each([403, 404])('renders the same privacy-preserving unavailable state for HTTP %s', (status) => {
    createComponent(throwError(() => httpError(status)));

    expect(pageText()).toContain('Perfil indisponível');
    expect(pageText()).toContain('Não foi possível encontrar um perfil público com este endereço.');
    expect(pageText().toLowerCase()).not.toContain('privado');
    expect(pageText().toLowerCase()).not.toContain('permissão');
    expect(pageText().toLowerCase()).not.toContain('forbidden');
  });

  it('renders authentication required for HTTP 401 with the canonical Steam action', () => {
    createComponent(throwError(() => httpError(401)));

    expect(pageText()).toContain('Autenticação necessária');
    const action = fixture.nativeElement.querySelector('.player-public-profile-page__action');
    expect(action?.getAttribute('href')).toBe('/player/auth/steam/start');
    expect(action?.textContent).toContain('Entrar com Steam');
  });

  it.each([500, 0])('renders generic failure for HTTP status %s', (status) => {
    createComponent(throwError(() => httpError(status)));

    expect(pageText()).toContain('Não foi possível carregar o perfil');
    expect(pageText()).toContain('Tentar novamente');
  });

  it('renders generic failure for a public-profile contract error', () => {
    createComponent(
      throwError(() => new PlayerPublicProfileContractError('Sensitive contract detail')),
    );

    expect(pageText()).toContain('Não foi possível carregar o perfil');
    expect(pageText()).not.toContain('Sensitive contract detail');
  });

  it('retry requests the same slug again', () => {
    publicProfileApiMock.getProfile
      .mockReturnValueOnce(throwError(() => httpError(500)))
      .mockReturnValueOnce(of(createProfile()));
    fixture = TestBed.createComponent(PlayerPublicProfilePage);
    fixture.detectChanges();

    const retryButton = fixture.nativeElement.querySelector('.page-state__btn') as HTMLButtonElement;
    retryButton.click();
    fixture.detectChanges();

    expect(publicProfileApiMock.getProfile).toHaveBeenCalledTimes(2);
    expect(publicProfileApiMock.getProfile).toHaveBeenNthCalledWith(2, 'player-one');
    expect(pageText()).toContain('Player One');
  });

  it('loads a changed slug without retaining the previous profile', () => {
    const secondProfile$ = new Subject<PlayerPublicProfile>();
    publicProfileApiMock.getProfile
      .mockReturnValueOnce(of(createProfile()))
      .mockReturnValueOnce(secondProfile$);
    fixture = TestBed.createComponent(PlayerPublicProfilePage);
    fixture.detectChanges();
    expect(pageText()).toContain('Player One');

    paramMap$.next(convertToParamMap({ slug: 'player-two' }));
    fixture.detectChanges();

    expect(publicProfileApiMock.getProfile).toHaveBeenLastCalledWith('player-two');
    expect(pageText()).toContain('Carregando perfil do jogador');
    expect(pageText()).not.toContain('Player One');

    secondProfile$.next(createProfile({ displayName: 'Player Two', slug: 'player-two' }));
    fixture.detectChanges();
    expect(pageText()).toContain('Player Two');
    expect(pageText()).not.toContain('Player One');
  });

  it('switches locale on the same profile without changing remote data or refetching', async () => {
    createComponent();
    const host = fixture.nativeElement as HTMLElement;
    const avatar = host.querySelector<HTMLImageElement>('.player-public-profile-page__avatar img')!;
    const banner = host.querySelector<HTMLImageElement>('.player-public-profile-page__banner img')!;
    const avatarSrc = avatar.getAttribute('src');
    const bannerSrc = banner.getAttribute('src');
    expect(pageText()).toContain('Preferências');

    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();

    const text = pageText();
    expect(text).toContain('Preferences');
    expect(text).toContain('Player One');
    expect(text).toContain('@player-one');
    expect(text).toContain('Heavy smoke.');
    expect(text).toContain('player.one');
    expect(text).toContain('Rifler');
    expect(text).toContain('Mirage');
    expect(avatar.getAttribute('alt')).toBe('Player One avatar');
    expect(avatar.getAttribute('src')).toBe(avatarSrc);
    expect(banner.getAttribute('src')).toBe(bannerSrc);
    expect(publicProfileApiMock.getProfile).toHaveBeenCalledTimes(1);
    expect(publicProfileApiMock.getProfile).toHaveBeenCalledWith('player-one');
  });
});

function createProfile(overrides: Partial<PlayerPublicProfile> = {}): PlayerPublicProfile {
  return {
    displayName: 'Player One',
    slug: 'player-one',
    bio: 'Heavy smoke.',
    avatarUrl: '/media/avatar.webp',
    bannerUrl: '/media/banner.webp',
    discordHandle: 'player.one',
    preferredRole: 'rifler',
    preferredMap: 'de_mirage',
    joinedAt: '2026-08-07T10:00:00.000Z',
    ...overrides,
  };
}

function httpError(status: number): HttpErrorResponse {
  return new HttpErrorResponse({ status, statusText: 'Request failed' });
}

const publicProfileDictionary = (english: boolean) => ({
  shared: { playerAvatar: { alt: english ? '{{displayName}} avatar' : 'Avatar de {{displayName}}' } },
  playerPublicProfile: {
    states: {
      loading: { message: english ? 'Loading player profile...' : 'Carregando perfil do jogador...' },
      unauthenticated: { title: english ? 'Authentication required' : 'Autenticação necessária', message: english ? 'Sign in with your HSC account.' : 'Entre com sua conta HSC para acessar perfis públicos de jogadores.' },
      unavailable: { title: english ? 'Profile unavailable' : 'Perfil indisponível', message: english ? 'A public profile could not be found at this address.' : 'Não foi possível encontrar um perfil público com este endereço.' },
      failure: { title: english ? 'Could not load profile' : 'Não foi possível carregar o perfil', message: english ? 'A temporary failure occurred. Try again.' : 'Ocorreu uma falha temporária. Tente novamente.' },
    },
    actions: { loginWithSteam: english ? 'Sign in with Steam' : 'Entrar com Steam', retry: english ? 'Try again' : 'Tentar novamente' },
    header: { eyebrow: english ? 'HSC Player Profile' : 'Perfil de jogador HSC', mark: english ? 'HSC PLAYER' : 'JOGADOR HSC' },
    sections: { identity: { eyebrow: english ? 'Player identity' : 'Identidade do jogador', title: english ? 'Preferences' : 'Preferências' }, bio: { eyebrow: english ? 'Public profile' : 'Perfil público', title: english ? 'About' : 'Sobre' } },
    labels: { role: english ? 'Role' : 'Função', preferredMap: english ? 'Preferred map' : 'Mapa preferido', memberSince: english ? 'Member since' : 'Membro desde' },
  },
});

const PUBLIC_PROFILE_TRANSLATIONS = {
  'pt-BR': publicProfileDictionary(false),
  'en-US': publicProfileDictionary(true),
} as const;
