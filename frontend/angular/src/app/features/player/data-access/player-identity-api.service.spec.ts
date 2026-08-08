import { HttpErrorResponse, provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import type { PlayerIdentity } from '../domain/player-identity.model';
import { PlayerIdentityApiService } from './player-identity-api.service';

describe('PlayerIdentityApiService', () => {
  let service: PlayerIdentityApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });

    service = TestBed.inject(PlayerIdentityApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('realiza request para cs2ApiPaths.playerMe', () => {
    service.getCurrentIdentity().subscribe();
    const req = httpTesting.expectOne(cs2ApiPaths.playerMe);
    expect(req.request.url).toBe(cs2ApiPaths.playerMe);
    req.flush(null);
  });

  it('usa método GET', () => {
    service.getCurrentIdentity().subscribe();
    const req = httpTesting.expectOne(cs2ApiPaths.playerMe);
    expect(req.request.method).toBe('GET');
    req.flush(null);
  });

  it('envia withCredentials === true', () => {
    service.getCurrentIdentity().subscribe();
    const req = httpTesting.expectOne(cs2ApiPaths.playerMe);
    expect(req.request.withCredentials).toBe(true);
    req.flush(null);
  });

  it('não envia body', () => {
    service.getCurrentIdentity().subscribe();
    const req = httpTesting.expectOne(cs2ApiPaths.playerMe);
    expect(req.request.body).toBeNull();
    req.flush(null);
  });

  it('normaliza identidade em player', () => {
    let result: PlayerIdentity | null | undefined;
    service.getCurrentIdentity().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.playerMe);
    req.flush({
      player: {
        displayName: 'Player One',
        steamid64: '76561198000000001',
        avatarMedium: 'https://example.test/avatar.jpg',
        steamProfileUrl: 'https://steamcommunity.com/profiles/76561198000000001',
      },
    });

    expect(result).toEqual({
      displayName: 'Player One',
      steamId64: '76561198000000001',
      avatarMedium: 'https://example.test/avatar.jpg',
      steamProfileUrl: 'https://steamcommunity.com/profiles/76561198000000001',
    });
  });

  it('normaliza identidade em user', () => {
    let result: PlayerIdentity | null | undefined;
    service.getCurrentIdentity().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.playerMe);
    req.flush({
      user: {
        displayName: 'Player Two',
        steamid64: '76561198000000002',
      },
    });

    expect(result).toEqual({
      displayName: 'Player Two',
      steamId64: '76561198000000002',
      avatarMedium: null,
      steamProfileUrl: null,
    });
  });

  it('normaliza identidade no objeto raiz', () => {
    let result: PlayerIdentity | null | undefined;
    service.getCurrentIdentity().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.playerMe);
    req.flush({
      displayName: 'Player Three',
      steamid64: '76561198000000003',
    });

    expect(result).toEqual({
      displayName: 'Player Three',
      steamId64: '76561198000000003',
      avatarMedium: null,
      steamProfileUrl: null,
    });
  });

  it('authenticated: false emite null', () => {
    let result: PlayerIdentity | null | undefined;
    service.getCurrentIdentity().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.playerMe);
    req.flush({
      authenticated: false,
      player: {
        steamid64: '76561198000000001',
      },
    });

    expect(result).toBeNull();
  });

  it('payload sem Steam ID emite null', () => {
    let result: PlayerIdentity | null | undefined;
    service.getCurrentIdentity().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.playerMe);
    req.flush({
      displayName: 'Player Without ID',
    });

    expect(result).toBeNull();
  });

  it('payload malformado emite null', () => {
    let result: PlayerIdentity | null | undefined;
    service.getCurrentIdentity().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.playerMe);
    req.flush('not-an-object-invalid-json-structure');

    expect(result).toBeNull();
  });

  it('HTTP 401 é propagado', () => {
    let errorReceived: unknown;
    service.getCurrentIdentity().subscribe({
      next: () => expect.fail('Não deveria emitir valor em 401'),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.playerMe);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(errorReceived).toBeInstanceOf(HttpErrorResponse);

    if (!(errorReceived instanceof HttpErrorResponse)) {
      throw new Error('Expected HttpErrorResponse');
    }

    expect(errorReceived.status).toBe(401);
  });

  it('HTTP 403 é propagado', () => {
    let errorReceived: unknown;
    service.getCurrentIdentity().subscribe({
      next: () => expect.fail('Não deveria emitir valor em 403'),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.playerMe);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(errorReceived).toBeInstanceOf(HttpErrorResponse);

    if (!(errorReceived instanceof HttpErrorResponse)) {
      throw new Error('Expected HttpErrorResponse');
    }

    expect(errorReceived.status).toBe(403);
  });

  it('HTTP 500 é propagado', () => {
    let errorReceived: unknown;
    service.getCurrentIdentity().subscribe({
      next: () => expect.fail('Não deveria emitir valor em 500'),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.playerMe);
    req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(errorReceived).toBeInstanceOf(HttpErrorResponse);

    if (!(errorReceived instanceof HttpErrorResponse)) {
      throw new Error('Expected HttpErrorResponse');
    }

    expect(errorReceived.status).toBe(500);
  });

  it('erro de rede é propagado', () => {
    let errorReceived: unknown;
    service.getCurrentIdentity().subscribe({
      next: () => expect.fail('Não deveria emitir valor em erro de rede'),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.playerMe);
    const mockError = new ProgressEvent('error');
    req.error(mockError);

    expect(errorReceived).toBeDefined();
  });

  it('duas chamadas independentes produzem dois requests', () => {
    let result1: PlayerIdentity | null | undefined;
    let result2: PlayerIdentity | null | undefined;

    service.getCurrentIdentity().subscribe((res) => (result1 = res));
    service.getCurrentIdentity().subscribe((res) => (result2 = res));

    const requests = httpTesting.match(cs2ApiPaths.playerMe);
    expect(requests.length).toBe(2);

    requests[0].flush({ steamid64: '76561198000000001' });
    requests[1].flush({ steamid64: '76561198000000002' });

    expect(result1?.steamId64).toBe('76561198000000001');
    expect(result2?.steamId64).toBe('76561198000000002');
  });

  it('nenhuma chamada produz request adicional ou efeito colateral', () => {
    httpTesting.verify();
  });
});
