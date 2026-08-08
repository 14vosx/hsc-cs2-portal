import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import {
  PlayerSelfApiService,
  PlayerSelfContractError,
} from './player-self-api.service';

describe('PlayerSelfApiService', () => {
  let service: PlayerSelfApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
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

  it('preserva ausÃªncia de membership como estado vÃ¡lido', () => {
    let result: unknown = 'unset';

    service.getMembership().subscribe((value) => (result = value));

    const request = httpTesting.expectOne(cs2ApiPaths.playerMembership);
    expect(request.request.withCredentials).toBe(true);
    request.flush({ ok: true, membership: null });

    expect(result).toBeNull();
  });

  it('normaliza membership efetiva retornada pelo backend', () => {
    let result: unknown;

    service.getMembership().subscribe((value) => (result = value));

    const request = httpTesting.expectOne(cs2ApiPaths.playerMembership);
    request.flush({
      ok: true,
      membership: {
        status: 'active',
        plan_code: 'hsc-member',
        started_at: '2026-08-07T10:00:00.000Z',
        expires_at: null,
        suspended_at: null,
        cancelled_at: null,
      },
    });

    expect(result).toEqual({
      status: 'active',
      planCode: 'hsc-member',
      startedAt: '2026-08-07T10:00:00.000Z',
      expiresAt: null,
      suspendedAt: null,
      cancelledAt: null,
    });
  });

  it('falha fechado quando o contrato de profile Ã© invÃ¡lido', () => {
    let receivedError: unknown;

    service.getProfile().subscribe({
      next: () => expect.fail('Payload invÃ¡lido nÃ£o deveria ser aceito'),
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
});
