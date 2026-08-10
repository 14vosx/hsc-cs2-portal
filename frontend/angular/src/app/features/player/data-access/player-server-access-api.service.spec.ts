import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  PlayerServerAccessApiService,
  PlayerServerAccessContractError,
} from './player-server-access-api.service';

describe('PlayerServerAccessApiService', () => {
  let service: PlayerServerAccessApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PlayerServerAccessApiService);
    http = TestBed.inject(HttpTestingController);
  });

  it.each([
    { ok: true, authorized: true, reason: 'membership_active' },
    { ok: true, authorized: false, reason: 'membership_required' },
  ])('accepts a valid allow/deny contract', (payload) => {
    let result: unknown;
    service.getServerAccess().subscribe((value) => (result = value));
    const request = http.expectOne('/player/server-access');
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush(payload);
    expect(result).toEqual(payload);
    http.verify();
  });

  it.each([
    { ok: true, authorized: false, reason: 'unknown_reason' },
    { ok: true, authorized: false, reason: 'membership_active' },
    { ok: true, authorized: true, reason: 'membership_required' },
    { ok: 'true', authorized: true, reason: 'membership_active' },
  ])('rejects an invalid contract without another request', (payload) => {
    let error: unknown;
    service.getServerAccess().subscribe({ error: (value) => (error = value) });
    http.expectOne('/player/server-access').flush(payload);
    expect(error).toBeInstanceOf(PlayerServerAccessContractError);
    http.verify();
  });

  it('propagates HttpErrorResponse unchanged', () => {
    let error: unknown;
    service.getServerAccess().subscribe({ error: (value) => (error = value) });
    http
      .expectOne('/player/server-access')
      .flush({ error: 'invalid_session' }, { status: 401, statusText: 'Unauthorized' });
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(401);
    http.verify();
  });
});
