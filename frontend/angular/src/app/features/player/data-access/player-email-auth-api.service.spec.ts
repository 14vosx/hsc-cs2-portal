import { HttpErrorResponse, provideHttpClient, withXhr } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Observable } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import {
  PlayerEmailAuthApiService,
  PlayerEmailAuthContractError,
} from './player-email-auth-api.service';

describe('PlayerEmailAuthApiService', () => {
  let service: PlayerEmailAuthApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(PlayerEmailAuthApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('registers with the exact transport contract and accepts its envelope', () => {
    const body = { email: 'player@example.test', password: 'long-password', displayName: null };
    let result: unknown;
    service.register(body).subscribe((value) => (result = value));

    const request = httpTesting.expectOne(cs2ApiPaths.playerAuthEmailRegister);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.withCredentials).toBe(true);
    request.flush({ ok: true, verificationRequired: true }, { status: 202, statusText: 'Accepted' });

    expect(result).toEqual({ ok: true, verificationRequired: true });
  });

  it('rejects malformed registration success without another request', () => {
    expectContractError(
      () => service.register({ email: 'p@example.test', password: 'password-10' }),
      cs2ApiPaths.playerAuthEmailRegister,
      { ok: true },
    );
  });

  it('verifies with the exact contract and requires an issued session', () => {
    let result: unknown;
    service.verify({ token: 'verify-token' }).subscribe((value) => (result = value));
    const request = httpTesting.expectOne(cs2ApiPaths.playerAuthEmailVerify);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ token: 'verify-token' });
    expect(request.request.withCredentials).toBe(true);
    request.flush({ ok: true, verified: true, authenticated: true, session: { issued: true } });
    expect(result).toEqual({
      ok: true,
      verified: true,
      authenticated: true,
      session: { issued: true },
    });
  });

  it('rejects malformed verification success', () => {
    expectContractError(
      () => service.verify({ token: 'token' }),
      cs2ApiPaths.playerAuthEmailVerify,
      { ok: true, verified: true, authenticated: true, session: { issued: false } },
    );
  });

  it('logs in with the exact contract and requires an issued session', () => {
    const body = { email: 'player@example.test', password: 'long-password' };
    let result: unknown;
    service.login(body).subscribe((value) => (result = value));
    const request = httpTesting.expectOne(cs2ApiPaths.playerAuthEmailLogin);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.withCredentials).toBe(true);
    request.flush({ ok: true, authenticated: true, session: { issued: true } });
    expect(result).toEqual({ ok: true, authenticated: true, session: { issued: true } });
  });

  it('rejects malformed login success', () => {
    expectContractError(
      () => service.login({ email: 'p@example.test', password: 'password-10' }),
      cs2ApiPaths.playerAuthEmailLogin,
      { ok: true, authenticated: true },
    );
  });

  it('propagates login HttpErrorResponse unchanged', () => {
    let received: unknown;
    service.login({ email: 'p@example.test', password: 'password-10' }).subscribe({
      error: (error) => (received = error),
    });
    const request = httpTesting.expectOne(cs2ApiPaths.playerAuthEmailLogin);
    request.flush({ error: 'invalid_credentials' }, { status: 401, statusText: 'Unauthorized' });
    expect(received).toBeInstanceOf(HttpErrorResponse);
    expect((received as HttpErrorResponse).error).toEqual({ error: 'invalid_credentials' });
  });

  it('requests a password reset with the exact contract and accepts a generic response', () => {
    let result: unknown;
    service
      .requestPasswordReset({ email: 'player@example.test' })
      .subscribe((value) => (result = value));
    const request = httpTesting.expectOne(cs2ApiPaths.playerAuthEmailPasswordResetRequest);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'player@example.test' });
    expect(request.request.withCredentials).toBe(true);
    request.flush(
      { ok: true, message: 'If eligible, instructions will be sent.' },
      { status: 202, statusText: 'Accepted' },
    );
    expect(result).toEqual({ ok: true, message: 'If eligible, instructions will be sent.' });
  });

  it('rejects malformed password reset request success', () => {
    expectContractError(
      () => service.requestPasswordReset({ email: 'p@example.test' }),
      cs2ApiPaths.playerAuthEmailPasswordResetRequest,
      { ok: true, message: 123 },
    );
  });

  it('confirms a password reset with the exact non-authenticating contract', () => {
    const body = { token: 'reset-token', password: 'new-password' };
    let result: unknown;
    service.confirmPasswordReset(body).subscribe((value) => (result = value));
    const request = httpTesting.expectOne(cs2ApiPaths.playerAuthEmailPasswordResetConfirm);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.withCredentials).toBe(true);
    request.flush({ ok: true, passwordReset: true, authenticated: false });
    expect(result).toEqual({ ok: true, passwordReset: true, authenticated: false });
  });

  it('rejects malformed password reset confirmation success', () => {
    expectContractError(
      () => service.confirmPasswordReset({ token: 'token', password: 'password-10' }),
      cs2ApiPaths.playerAuthEmailPasswordResetConfirm,
      { ok: true, passwordReset: true, authenticated: true },
    );
  });

  it('propagates password reset confirmation HttpErrorResponse unchanged', () => {
    let received: unknown;
    service.confirmPasswordReset({ token: 'token', password: 'password-10' }).subscribe({
      error: (error) => (received = error),
    });
    const request = httpTesting.expectOne(cs2ApiPaths.playerAuthEmailPasswordResetConfirm);
    request.flush({ error: 'invalid_password' }, { status: 400, statusText: 'Bad Request' });
    expect(received).toBeInstanceOf(HttpErrorResponse);
    expect((received as HttpErrorResponse).error).toEqual({ error: 'invalid_password' });
  });

  function expectContractError(
    operation: () => Observable<unknown>,
    path: string,
    payload: Parameters<TestRequest['flush']>[0],
  ): void {
    let received: unknown;
    operation().subscribe({ error: (error) => (received = error) });
    const request = httpTesting.expectOne(path);
    request.flush(payload);
    expect(received).toBeInstanceOf(PlayerEmailAuthContractError);
    httpTesting.expectNone(cs2ApiPaths.playerAccount);
    httpTesting.expectNone(cs2ApiPaths.playerMe);
  }
});
