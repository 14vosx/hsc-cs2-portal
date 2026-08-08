import { HttpErrorResponse, provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import type { BunkerSummary } from '../domain/bunker.model';
import { BunkerApiService, BunkerContractError } from './bunker-api.service';

describe('BunkerApiService', () => {
  let service: BunkerApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });

    service = TestBed.inject(BunkerApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('1. serviço pode ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('2. getSummary() faz exatamente uma requisição', () => {
    service.getSummary().subscribe();

    const req = httpTesting.expectOne(cs2ApiPaths.playerBunkerSummary);
    expect(req).toBeTruthy();
    req.flush({ status: 'ready' });
  });

  it('3. método HTTP é GET', () => {
    service.getSummary().subscribe();

    const req = httpTesting.expectOne(cs2ApiPaths.playerBunkerSummary);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'ready' });
  });

  it('4. URL é cs2ApiPaths.playerBunkerSummary', () => {
    service.getSummary().subscribe();

    const req = httpTesting.expectOne(cs2ApiPaths.playerBunkerSummary);
    expect(req.request.url).toBe(cs2ApiPaths.playerBunkerSummary);
    req.flush({ status: 'ready' });
  });

  it('5. withCredentials é true', () => {
    service.getSummary().subscribe();

    const req = httpTesting.expectOne(cs2ApiPaths.playerBunkerSummary);
    expect(req.request.withCredentials).toBe(true);
    req.flush({ status: 'ready' });
  });

  it('6. payload direto válido retorna BunkerSummary canônico', () => {
    let result: BunkerSummary | undefined;
    service.getSummary().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.playerBunkerSummary);
    req.flush({
      status: 'ready',
      seasonFirst: true,
      statsAvailable: true,
    });

    expect(result).toEqual({
      status: 'ready',
      seasonFirst: true,
      statsAvailable: true,
      currentSeason: null,
      seasonPlayer: null,
      competitiveProfile: null,
    });
  });

  it('7. payload envelopado válido retorna BunkerSummary canônico', () => {
    let result: BunkerSummary | undefined;
    service.getSummary().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.playerBunkerSummary);
    req.flush({
      ok: true,
      data: {
        bunker: {
          status: 'ready',
          seasonFirst: false,
          statsAvailable: true,
        },
      },
    });

    expect(result).toEqual({
      status: 'ready',
      seasonFirst: false,
      statsAvailable: true,
      currentSeason: null,
      seasonPlayer: null,
      competitiveProfile: null,
    });
  });

  it('8. aliases de transporte são normalizados para camelCase', () => {
    let result: BunkerSummary | undefined;
    service.getSummary().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.playerBunkerSummary);
    req.flush({
      seasonPlayer: {
        steamid64: '76561198000000001',
        recentMaps: [
          {
            mapname: 'de_mirage',
            team1_score: 13,
            team2_score: 9,
            utility_damage: 120,
          },
        ],
      },
    });

    expect(result?.seasonPlayer?.steamId64).toBe('76561198000000001');
    expect('steamid64' in (result?.seasonPlayer ?? {})).toBe(false);

    const map = result?.seasonPlayer?.recentMaps[0];
    expect(map?.mapName).toBe('de_mirage');
    expect(map?.team1Score).toBe(13);
    expect(map?.team2Score).toBe(9);
    expect(map?.utilityDamage).toBe(120);

    expect('team1_score' in (map ?? {})).toBe(false);
    expect('team2_score' in (map ?? {})).toBe(false);
    expect('utility_damage' in (map ?? {})).toBe(false);
  });

  it('9. payload inválido faz o Observable emitir BunkerContractError', () => {
    let errorReceived: unknown;
    service.getSummary().subscribe({
      next: () => expect.fail('Não deveria emitir valor para payload inválido'),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.playerBunkerSummary);
    req.flush({});

    expect(errorReceived).toBeInstanceOf(BunkerContractError);
  });

  it('10. erro possui name "BunkerContractError"', () => {
    let errorReceived: unknown;
    service.getSummary().subscribe({
      next: () => expect.fail('Não deveria emitir valor para payload inválido'),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.playerBunkerSummary);
    req.flush('not-a-valid-bunker-json');

    expect(errorReceived).toBeInstanceOf(BunkerContractError);

    if (errorReceived instanceof BunkerContractError) {
      expect(errorReceived.name).toBe('BunkerContractError');
    }
  });

  it('11. erro possui mensagem estável', () => {
    let errorReceived: unknown;
    service.getSummary().subscribe({
      next: () => expect.fail('Não deveria emitir valor para payload inválido'),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.playerBunkerSummary);
    req.flush(null);

    expect(errorReceived).toBeInstanceOf(BunkerContractError);

    if (errorReceived instanceof BunkerContractError) {
      expect(errorReceived.message).toBe('Invalid Player Bunker summary contract.');
    }
  });

  it('12. HTTP 401 continua sendo HttpErrorResponse', () => {
    let errorReceived: unknown;
    service.getSummary().subscribe({
      next: () => expect.fail('Não deveria emitir valor em HTTP 401'),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.playerBunkerSummary);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(errorReceived).toBeInstanceOf(HttpErrorResponse);

    if (errorReceived instanceof HttpErrorResponse) {
      expect(errorReceived.status).toBe(401);
    }
  });

  it('13. HTTP 403 continua sendo HttpErrorResponse', () => {
    let errorReceived: unknown;
    service.getSummary().subscribe({
      next: () => expect.fail('Não deveria emitir valor em HTTP 403'),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.playerBunkerSummary);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(errorReceived).toBeInstanceOf(HttpErrorResponse);

    if (errorReceived instanceof HttpErrorResponse) {
      expect(errorReceived.status).toBe(403);
    }
  });

  it('14. HTTP 404 continua sendo HttpErrorResponse', () => {
    let errorReceived: unknown;
    service.getSummary().subscribe({
      next: () => expect.fail('Não deveria emitir valor em HTTP 404'),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.playerBunkerSummary);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(errorReceived).toBeInstanceOf(HttpErrorResponse);

    if (errorReceived instanceof HttpErrorResponse) {
      expect(errorReceived.status).toBe(404);
    }
  });

  it('15. HTTP 500 continua sendo HttpErrorResponse', () => {
    let errorReceived: unknown;
    service.getSummary().subscribe({
      next: () => expect.fail('Não deveria emitir valor em HTTP 500'),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.playerBunkerSummary);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(errorReceived).toBeInstanceOf(HttpErrorResponse);

    if (errorReceived instanceof HttpErrorResponse) {
      expect(errorReceived.status).toBe(500);
    }
  });

  it('16. erro de rede continua sendo HttpErrorResponse/status 0', () => {
    let errorReceived: unknown;
    service.getSummary().subscribe({
      next: () => expect.fail('Não deveria emitir valor em erro de rede'),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.playerBunkerSummary);
    const mockError = new ProgressEvent('error');
    req.error(mockError);

    expect(errorReceived).toBeInstanceOf(HttpErrorResponse);

    if (errorReceived instanceof HttpErrorResponse) {
      expect(errorReceived.status).toBe(0);
    }
  });

  it('17. não existe segunda requisição inesperada', () => {
    service.getSummary().subscribe();
    const req = httpTesting.expectOne(cs2ApiPaths.playerBunkerSummary);
    req.flush({ status: 'ready' });

    httpTesting.verify();
  });

  it('18. verify() do HttpTestingController passa no afterEach', () => {
    // Garantido pelo hook afterEach do bloco describe
    expect(httpTesting.verify).toBeDefined();
  });
});
