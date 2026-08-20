import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError, type Observable } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import {
  PlayerMembershipApiService,
  PlayerMembershipContractError,
} from '../../../core/membership/player-membership-api.service';
import type { PlayerMembership } from '../../../core/membership/player-membership.model';
import {
  PlayerSelfApiService,
  PlayerSelfContractError,
} from './player-self-api.service';

const membershipApiStub = {
  getMembership: vi.fn((): Observable<PlayerMembership | null> => of(null)),
};

describe('PlayerSelfApiService', () => {
  let service: PlayerSelfApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    vi.clearAllMocks();
    membershipApiStub.getMembership.mockImplementation(() => of(null));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: PlayerMembershipApiService, useValue: membershipApiStub },
      ],
    });

    service = TestBed.inject(PlayerSelfApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('normaliza /player/account e envia credenciais', () => {
    let result: unknown;

    service.getAccount().subscribe((value) => (result = value));

    const request = httpTesting.expectOne(cs2ApiPaths.playerAccount);
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);

    request.flush({
      ok: true,
      account: {
        status: 'active',
        identities: {
          email: {
            linked: true,
            email: 'player@example.test',
            verified: true,
          },
          steam: {
            linked: false,
            steamid64: null,
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
      },
    });

    expect(result).toEqual({
      status: 'active',
      identities: {
        email: {
          linked: true,
          email: 'player@example.test',
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
    });
  });

  it('normaliza /player/profile/me', () => {
    let result: unknown;

    service.getProfile().subscribe((value) => (result = value));

    const request = httpTesting.expectOne(cs2ApiPaths.playerProfileMe);
    expect(request.request.withCredentials).toBe(true);

    request.flush({
      ok: true,
      profile: {
        displayName: 'Player One',
        slug: 'player-one',
        bio: 'Heavy smoke.',
        avatarUrl: null,
        bannerUrl: null,
        discordHandle: 'player.one',
        preferredRole: 'rifler',
        preferredMap: 'de_mirage',
        visibility: 'public',
        joinedAt: '2026-08-07T10:00:00.000Z',
        createdAt: '2026-08-07T10:00:00.000Z',
        updatedAt: '2026-08-07T10:00:00.000Z',
      },
    });

    expect(result).toMatchObject({
      displayName: 'Player One',
      slug: 'player-one',
      visibility: 'public',
      preferredRole: 'rifler',
      preferredMap: 'de_mirage',
    });
  });

  it('delegates Membership to the core boundary', () => {
    let result: unknown;
    const membership = {
      status: 'active' as const,
      planCode: 'hsc-member',
      startedAt: '2026-08-07T10:00:00.000Z',
      expiresAt: null,
      suspendedAt: null,
      cancelledAt: null,
    };
    membershipApiStub.getMembership.mockReturnValue(of(membership));

    service.getMembership().subscribe((value) => (result = value));

    expect(membershipApiStub.getMembership).toHaveBeenCalledTimes(1);
    expect(result).toEqual(membership);
    httpTesting.expectNone(cs2ApiPaths.playerMembership);
  });

  it('preserves PlayerSelfContractError compatibility for invalid Membership payloads', () => {
    let receivedError: unknown;
    membershipApiStub.getMembership.mockReturnValue(
      throwError(() => new PlayerMembershipContractError('Invalid Membership payload')),
    );

    service.getMembership().subscribe({ error: (error) => (receivedError = error) });

    expect(receivedError).toBeInstanceOf(PlayerSelfContractError);
    expect((receivedError as Error).message).toBe('Invalid Membership payload');
  });

  it('falha fechado quando o contrato de profile é inválido', () => {
    let receivedError: unknown;

    service.getProfile().subscribe({
      next: () => expect.fail('Payload inválido não deveria ser aceito'),
      error: (error) => (receivedError = error),
    });

    const request = httpTesting.expectOne(cs2ApiPaths.playerProfileMe);
    request.flush({
      ok: true,
      profile: {
        displayName: 'Player',
        slug: '',
        visibility: 'public',
      },
    });

    expect(receivedError).toBeInstanceOf(PlayerSelfContractError);
  });

  it('envia PATCH em updateProfile e normaliza envelope de resposta', () => {
    let result: unknown;

    service
      .updateProfile({
        displayName: 'New Name',
        preferredRole: 'awper',
      })
      .subscribe((value) => (result = value));

    const request = httpTesting.expectOne(cs2ApiPaths.playerProfileMe);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({
      displayName: 'New Name',
      preferredRole: 'awper',
    });

    request.flush({
      ok: true,
      profile: {
        displayName: 'New Name',
        slug: 'player-one',
        bio: 'Heavy smoke.',
        avatarUrl: null,
        bannerUrl: null,
        discordHandle: 'player.one',
        preferredRole: 'awper',
        preferredMap: 'de_mirage',
        visibility: 'public',
        joinedAt: '2026-08-07T10:00:00.000Z',
        createdAt: '2026-08-07T10:00:00.000Z',
        updatedAt: '2026-08-07T10:00:00.000Z',
      },
    });

    expect(result).toMatchObject({
      displayName: 'New Name',
      preferredRole: 'awper',
    });
  });

  it('rejeita payload sem envelope profile em updateProfile', () => {
    let receivedError: unknown;

    service.updateProfile({ displayName: 'New Name' }).subscribe({
      next: () => expect.fail('Payload sem envelope profile não deve ser aceito'),
      error: (err) => (receivedError = err),
    });

    const request = httpTesting.expectOne(cs2ApiPaths.playerProfileMe);
    // Raw payload without profile key
    request.flush({
      displayName: 'New Name',
      slug: 'player-one',
      visibility: 'public',
    });

    expect(receivedError).toBeInstanceOf(PlayerSelfContractError);
  });

  it('rejeita perfil com preferredRole ou preferredMap desconhecidos', () => {
    let receivedError: unknown;

    service.getProfile().subscribe({
      next: () => expect.fail('Role desconhecido não deve ser aceito'),
      error: (err) => (receivedError = err),
    });

    const request = httpTesting.expectOne(cs2ApiPaths.playerProfileMe);
    request.flush({
      ok: true,
      profile: {
        displayName: 'Player One',
        slug: 'player-one',
        visibility: 'public',
        preferredRole: 'invalid_role_string',
      },
    });

    expect(receivedError).toBeInstanceOf(PlayerSelfContractError);
  });

  it('envia avatar como multipart e normaliza o profile retornado', () => {
    const file = new File(['avatar'], 'avatar.webp', { type: 'image/webp' });
    let result: unknown;

    service.uploadAvatar(file).subscribe((value) => (result = value));

    const request = httpTesting.expectOne(cs2ApiPaths.playerProfileMeAvatar);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toBeInstanceOf(FormData);
    expect((request.request.body as FormData).get('file')).toBe(file);
    expect(request.request.headers.has('Content-Type')).toBe(false);
    request.flush({ ok: true, profile: mediaProfile });

    expect(result).toMatchObject({
      displayName: 'Player One',
      avatarUrl: '/media/avatar.webp',
    });
  });

  it('envia banner como multipart e normaliza o profile retornado', () => {
    const file = new File(['banner'], 'banner.png', { type: 'image/png' });
    let result: unknown;

    service.uploadBanner(file).subscribe((value) => (result = value));

    const request = httpTesting.expectOne(cs2ApiPaths.playerProfileMeBanner);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toBeInstanceOf(FormData);
    expect((request.request.body as FormData).get('file')).toBe(file);
    expect(request.request.headers.has('Content-Type')).toBe(false);
    request.flush({ ok: true, profile: mediaProfile });

    expect(result).toMatchObject({
      displayName: 'Player One',
      bannerUrl: '/media/banner.webp',
    });
  });

  it('remove avatar e normaliza o profile retornado', () => {
    let result: unknown;

    service.removeAvatar().subscribe((value) => (result = value));

    const request = httpTesting.expectOne(cs2ApiPaths.playerProfileMeAvatar);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ ok: true, profile: { ...mediaProfile, avatarUrl: null } });

    expect(result).toMatchObject({ displayName: 'Player One', avatarUrl: null });
  });

  it('remove banner e normaliza o profile retornado', () => {
    let result: unknown;

    service.removeBanner().subscribe((value) => (result = value));

    const request = httpTesting.expectOne(cs2ApiPaths.playerProfileMeBanner);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ ok: true, profile: { ...mediaProfile, bannerUrl: null } });

    expect(result).toMatchObject({ displayName: 'Player One', bannerUrl: null });
  });

  it('rejeita resposta de mídia sem profile válido', () => {
    let receivedError: unknown;

    service.uploadAvatar(new File(['avatar'], 'avatar.webp')).subscribe({
      next: () => expect.fail('Payload sem profile válido não deve ser aceito'),
      error: (error) => (receivedError = error),
    });

    const request = httpTesting.expectOne(cs2ApiPaths.playerProfileMeAvatar);
    request.flush({ ok: true });

    expect(receivedError).toBeInstanceOf(PlayerSelfContractError);
  });
});

const mediaProfile = {
  displayName: 'Player One',
  slug: 'player-one',
  bio: 'Heavy smoke.',
  avatarUrl: '/media/avatar.webp',
  bannerUrl: '/media/banner.webp',
  discordHandle: 'player.one',
  preferredRole: 'rifler',
  preferredMap: 'de_mirage',
  visibility: 'public',
  joinedAt: '2026-08-07T10:00:00.000Z',
  createdAt: '2026-08-07T10:00:00.000Z',
  updatedAt: '2026-08-08T10:00:00.000Z',
};
