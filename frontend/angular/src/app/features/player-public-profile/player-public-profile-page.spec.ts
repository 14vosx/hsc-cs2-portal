import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { BehaviorSubject, NEVER, of, Subject, throwError } from 'rxjs';
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
        {
          provide: PlayerAuthApiService,
          useValue: { steamLoginUrl: '/player/auth/steam/start' },
        },
      ],
    }).compileComponents();
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

  it('renders the privacy-preserving unavailable state for HTTP 404', () => {
    createComponent(throwError(() => httpError(404)));

    expect(pageText()).toContain('Perfil indisponível');
    expect(pageText()).toContain('Não foi possível encontrar um perfil público com este endereço.');
    expect(pageText().toLowerCase()).not.toContain('privado');
  });

  it('renders authentication required for HTTP 401 with the canonical Steam action', () => {
    createComponent(throwError(() => httpError(401)));

    expect(pageText()).toContain('Autenticação necessária');
    const action = fixture.nativeElement.querySelector('.player-public-profile-page__action');
    expect(action?.getAttribute('href')).toBe('/player/auth/steam/start');
    expect(action?.textContent).toContain('Entrar com Steam');
  });

  it('renders generic access unavailable for HTTP 403', () => {
    createComponent(throwError(() => httpError(403)));

    expect(pageText()).toContain('Acesso indisponível');
    expect(pageText()).not.toContain('associação');
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
