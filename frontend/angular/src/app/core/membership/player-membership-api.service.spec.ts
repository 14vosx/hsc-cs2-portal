import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cs2ApiPaths } from '../config/api-paths';
import {
  PlayerMembershipApiService,
  PlayerMembershipContractError,
} from './player-membership-api.service';
import type { PlayerMembershipStatus } from './player-membership.model';

describe('PlayerMembershipApiService', () => {
  let service: PlayerMembershipApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });

    service = TestBed.inject(PlayerMembershipApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('uses the canonical GET path with credentials and normalizes active membership', () => {
    let result: unknown;

    service.getMembership().subscribe((value) => (result = value));

    const request = httpTesting.expectOne(cs2ApiPaths.playerMembership);
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      ok: true,
      membership: {
        status: 'active',
        plan_code: 'hsc-member',
        started_at: '2026-08-07T10:00:00.000Z',
        expires_at: '2027-08-07T10:00:00.000Z',
        suspended_at: null,
        cancelled_at: null,
      },
    });

    expect(result).toEqual({
      status: 'active',
      planCode: 'hsc-member',
      startedAt: '2026-08-07T10:00:00.000Z',
      expiresAt: '2027-08-07T10:00:00.000Z',
      suspendedAt: null,
      cancelledAt: null,
    });
  });

  it.each(['inactive', 'active', 'suspended', 'expired', 'cancelled'] as const)(
    'accepts the canonical %s status',
    (status: PlayerMembershipStatus) => {
      let result: unknown;

      service.getMembership().subscribe((value) => (result = value));
      httpTesting.expectOne(cs2ApiPaths.playerMembership).flush({
        membership: membershipPayload(status),
      });

      expect(result).toMatchObject({ status, planCode: 'hsc-member' });
    },
  );

  it('preserves null membership as a valid response', () => {
    let result: unknown = 'unset';

    service.getMembership().subscribe((value) => (result = value));
    httpTesting.expectOne(cs2ApiPaths.playerMembership).flush({ membership: null });

    expect(result).toBeNull();
  });

  it('preserves all optional timestamps', () => {
    let result: unknown;

    service.getMembership().subscribe((value) => (result = value));
    httpTesting.expectOne(cs2ApiPaths.playerMembership).flush({
      membership: {
        ...membershipPayload('cancelled'),
        started_at: '2026-01-01T00:00:00.000Z',
        expires_at: '2026-12-31T23:59:59.000Z',
        suspended_at: '2026-06-01T00:00:00.000Z',
        cancelled_at: '2026-07-01T00:00:00.000Z',
      },
    });

    expect(result).toMatchObject({
      startedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-12-31T23:59:59.000Z',
      suspendedAt: '2026-06-01T00:00:00.000Z',
      cancelledAt: '2026-07-01T00:00:00.000Z',
    });
  });

  it.each([
    {},
    { membership: [] },
  ])('fails explicitly for invalid payload %#', (payload) => {
    let receivedError: unknown;

    service.getMembership().subscribe({ error: (error) => (receivedError = error) });
    httpTesting.expectOne(cs2ApiPaths.playerMembership).flush(payload);

    expect(receivedError).toBeInstanceOf(PlayerMembershipContractError);
  });

  it('fails explicitly for an unsupported status', () => {
    let receivedError: unknown;

    service.getMembership().subscribe({ error: (error) => (receivedError = error) });
    httpTesting.expectOne(cs2ApiPaths.playerMembership).flush({
      membership: membershipPayload('trial'),
    });

    expect(receivedError).toBeInstanceOf(PlayerMembershipContractError);
  });

  it.each([undefined, null, '', '   '])('requires a non-empty plan_code (%s)', (planCode) => {
    let receivedError: unknown;

    service.getMembership().subscribe({ error: (error) => (receivedError = error) });
    httpTesting.expectOne(cs2ApiPaths.playerMembership).flush({
      membership: { ...membershipPayload('active'), plan_code: planCode },
    });

    expect(receivedError).toBeInstanceOf(PlayerMembershipContractError);
  });
});

function membershipPayload(status: string): Record<string, unknown> {
  return {
    status,
    plan_code: 'hsc-member',
    started_at: null,
    expires_at: null,
    suspended_at: null,
    cancelled_at: null,
  };
}
