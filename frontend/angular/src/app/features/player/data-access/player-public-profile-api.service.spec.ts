import { HttpErrorResponse, provideHttpClient, withXhr } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import {
  PlayerPublicProfileApiService,
  PlayerPublicProfileContractError,
} from './player-public-profile-api.service';

describe('PlayerPublicProfileApiService', () => {
  let service: PlayerPublicProfileApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });

    service = TestBed.inject(PlayerPublicProfileApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('uses the encoded slug and sends credentials', () => {
    service.getProfile('player/name ?').subscribe();

    const request = httpTesting.expectOne('/player/profiles/player%2Fname%20%3F');
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush(validEnvelope);
  });

  it('normalizes a valid public profile envelope', () => {
    let result: unknown;

    service.getProfile('player-one').subscribe((profile) => (result = profile));

    httpTesting.expectOne(cs2ApiPaths.playerPublicProfile('player-one')).flush({
      ok: true,
      profile: {
        ...validEnvelope.profile,
        displayName: '  Player One  ',
        bio: '  Heavy smoke.  ',
      },
    });

    expect(result).toEqual({
      ...validEnvelope.profile,
      displayName: 'Player One',
      bio: 'Heavy smoke.',
    });
  });

  it('preserves nullable fields as null', () => {
    let result: unknown;

    service.getProfile('player-one').subscribe((profile) => (result = profile));

    httpTesting.expectOne(cs2ApiPaths.playerPublicProfile('player-one')).flush({
      ok: true,
      profile: {
        ...validEnvelope.profile,
        bio: null,
        avatarUrl: null,
        bannerUrl: null,
        discordHandle: null,
        preferredRole: null,
        preferredMap: null,
      },
    });

    expect(result).toMatchObject({
      bio: null,
      avatarUrl: null,
      bannerUrl: null,
      discordHandle: null,
      preferredRole: null,
      preferredMap: null,
    });
  });

  it('accepts preferred role and map values from the existing catalogs', () => {
    let result: unknown;

    service.getProfile('player-one').subscribe((profile) => (result = profile));
    httpTesting.expectOne(cs2ApiPaths.playerPublicProfile('player-one')).flush(validEnvelope);

    expect(result).toMatchObject({ preferredRole: 'rifler', preferredMap: 'de_mirage' });
  });

  it.each([
    { ok: false, profile: validEnvelope.profile },
    { ok: true },
    { ok: true, profile: { ...validEnvelope.profile, displayName: ' ' } },
    { ok: true, profile: { ...validEnvelope.profile, slug: '' } },
    { ok: true, profile: { ...validEnvelope.profile, joinedAt: 'not-a-date' } },
    { ok: true, profile: { ...validEnvelope.profile, preferredRole: undefined } },
  ])('rejects a malformed successful envelope', (payload) => {
    let receivedError: unknown;

    service.getProfile('player-one').subscribe({
      next: () => expect.fail('A malformed profile must not be accepted'),
      error: (error) => (receivedError = error),
    });

    httpTesting.expectOne(cs2ApiPaths.playerPublicProfile('player-one')).flush(payload);
    expect(receivedError).toBeInstanceOf(PlayerPublicProfileContractError);
  });

  it.each([
    { preferredRole: 'unknown_role' },
    { preferredMap: 'de_unknown' },
  ])('rejects invalid preferred catalog values', (override) => {
    let receivedError: unknown;

    service.getProfile('player-one').subscribe({
      next: () => expect.fail('An invalid catalog value must not be accepted'),
      error: (error) => (receivedError = error),
    });

    httpTesting.expectOne(cs2ApiPaths.playerPublicProfile('player-one')).flush({
      ok: true,
      profile: { ...validEnvelope.profile, ...override },
    });
    expect(receivedError).toBeInstanceOf(PlayerPublicProfileContractError);
  });

  it('lets HTTP errors propagate without conversion', () => {
    let receivedError: unknown;

    service.getProfile('missing-player').subscribe({
      next: () => expect.fail('A missing profile must emit an HTTP error'),
      error: (error) => (receivedError = error),
    });

    httpTesting
      .expectOne(cs2ApiPaths.playerPublicProfile('missing-player'))
      .flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

    expect(receivedError).toBeInstanceOf(HttpErrorResponse);
    expect((receivedError as HttpErrorResponse).status).toBe(404);
    expect(receivedError).not.toBeInstanceOf(PlayerPublicProfileContractError);
  });
});

const validEnvelope = {
  ok: true,
  profile: {
    displayName: 'Player One',
    slug: 'player-one',
    bio: 'Heavy smoke.',
    avatarUrl: '/media/avatar.webp',
    bannerUrl: '/media/banner.webp',
    discordHandle: 'player.one',
    preferredRole: 'rifler',
    preferredMap: 'de_mirage',
    joinedAt: '2026-08-07T10:00:00.000Z',
  },
} as const;
