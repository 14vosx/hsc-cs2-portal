import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { PlayerIdentityLinkApiService, PlayerIdentityLinkContractError } from './player-identity-link-api.service';

describe('PlayerIdentityLinkApiService', () => {
  let service: PlayerIdentityLinkApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PlayerIdentityLinkApiService);
    http = TestBed.inject(HttpTestingController);
  });

  it('requests an email link using the exact authenticated contract', () => {
    let result: unknown;
    service.requestEmailLink({ email: 'player@example.test', password: 'long-password' }).subscribe((value) => (result = value));
    const request = http.expectOne('/player/auth/email/link/request');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'player@example.test', password: 'long-password' });
    expect(request.request.withCredentials).toBe(true);
    request.flush({ ok: true, verificationRequired: true });
    expect(result).toEqual({ ok: true, verificationRequired: true });
    http.verify();
  });

  it('confirms an email link once using the exact authenticated contract', () => {
    const token = 'a'.repeat(64);
    service.confirmEmailLink(token).subscribe();
    const request = http.expectOne('/player/auth/email/link/confirm');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ token });
    expect(request.request.withCredentials).toBe(true);
    request.flush({ ok: true, linked: true, identity: { type: 'email', email: 'player@example.test' } });
    http.verify();
  });

  it('rejects malformed successful envelopes without another request', () => {
    let error: unknown;
    service.requestEmailLink({ email: 'player@example.test', password: 'long-password' }).subscribe({ error: (value) => (error = value) });
    http.expectOne('/player/auth/email/link/request').flush({ ok: true });
    expect(error).toBeInstanceOf(PlayerIdentityLinkContractError);
    http.verify();
  });

  it('propagates HttpErrorResponse unchanged', () => {
    let error: unknown;
    service.confirmEmailLink('a'.repeat(64)).subscribe({ error: (value) => (error = value) });
    http.expectOne('/player/auth/email/link/confirm').flush({ error: 'identity_conflict' }, { status: 409, statusText: 'Conflict' });
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(409);
    http.verify();
  });
});
