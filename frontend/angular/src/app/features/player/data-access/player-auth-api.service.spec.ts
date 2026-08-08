import { HttpErrorResponse, provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import { PlayerAuthApiService } from './player-auth-api.service';

describe('PlayerAuthApiService', () => {
  let service: PlayerAuthApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });

    service = TestBed.inject(PlayerAuthApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('1. serviço pode ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('2. steamLoginUrl corresponde exatamente a cs2ApiPaths.playerAuthSteamStart', () => {
    expect(service.steamLoginUrl).toBe(cs2ApiPaths.playerAuthSteamStart);
  });

  it('3. acessar steamLoginUrl não dispara requisição HTTP', () => {
    const url = service.steamLoginUrl;
    expect(url).toBe(cs2ApiPaths.playerAuthSteamStart);
    httpTesting.expectNone(cs2ApiPaths.playerAuthSteamStart);
  });

  it('4. logout() faz exatamente uma requisição', () => {
    service.logout().subscribe();

    const req = httpTesting.expectOne(cs2ApiPaths.playerAuthLogout);
    expect(req).toBeTruthy();
    req.flush({});
  });

  it('5. método HTTP é POST', () => {
    service.logout().subscribe();

    const req = httpTesting.expectOne(cs2ApiPaths.playerAuthLogout);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('6. URL é cs2ApiPaths.playerAuthLogout', () => {
    service.logout().subscribe();

    const req = httpTesting.expectOne(cs2ApiPaths.playerAuthLogout);
    expect(req.request.url).toBe(cs2ApiPaths.playerAuthLogout);
    req.flush({});
  });

  it('7. body é exatamente {}', () => {
    service.logout().subscribe();

    const req = httpTesting.expectOne(cs2ApiPaths.playerAuthLogout);
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('8. withCredentials é true', () => {
    service.logout().subscribe();

    const req = httpTesting.expectOne(cs2ApiPaths.playerAuthLogout);
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('9. resposta bem-sucedida é emitida como undefined/void', () => {
    let result: void | undefined = 'not-undefined' as unknown as void;
    let completed = false;

    service.logout().subscribe({
      next: (res) => (result = res),
      complete: () => (completed = true),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.playerAuthLogout);
    req.flush({ ok: true });

    expect(result).toBeUndefined();
    expect(completed).toBe(true);
  });

  it('10. HTTP 401 é propagado', () => {
    let errorReceived: unknown;
    service.logout().subscribe({
      next: () => expect.fail('Não deveria emitir valor em HTTP 401'),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.playerAuthLogout);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(errorReceived).toBeInstanceOf(HttpErrorResponse);

    if (errorReceived instanceof HttpErrorResponse) {
      expect(errorReceived.status).toBe(401);
    }
  });

  it('11. HTTP 403 é propagado', () => {
    let errorReceived: unknown;
    service.logout().subscribe({
      next: () => expect.fail('Não deveria emitir valor em HTTP 403'),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.playerAuthLogout);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(errorReceived).toBeInstanceOf(HttpErrorResponse);

    if (errorReceived instanceof HttpErrorResponse) {
      expect(errorReceived.status).toBe(403);
    }
  });

  it('12. HTTP 500 é propagado', () => {
    let errorReceived: unknown;
    service.logout().subscribe({
      next: () => expect.fail('Não deveria emitir valor em HTTP 500'),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.playerAuthLogout);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(errorReceived).toBeInstanceOf(HttpErrorResponse);

    if (errorReceived instanceof HttpErrorResponse) {
      expect(errorReceived.status).toBe(500);
    }
  });

  it('13. erro de rede/status 0 é propagado', () => {
    let errorReceived: unknown;
    service.logout().subscribe({
      next: () => expect.fail('Não deveria emitir valor em erro de rede'),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.playerAuthLogout);
    const mockError = new ProgressEvent('error');
    req.error(mockError);

    expect(errorReceived).toBeInstanceOf(HttpErrorResponse);

    if (errorReceived instanceof HttpErrorResponse) {
      expect(errorReceived.status).toBe(0);
    }
  });

  it('14. não há segunda requisição inesperada', () => {
    service.logout().subscribe();
    const req = httpTesting.expectOne(cs2ApiPaths.playerAuthLogout);
    req.flush({});

    httpTesting.verify();
  });

  it('15. verify() passa no afterEach', () => {
    expect(httpTesting.verify).toBeDefined();
  });
});
