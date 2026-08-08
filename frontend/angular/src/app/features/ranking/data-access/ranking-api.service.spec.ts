import { HttpErrorResponse, provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import type { Ranking } from '../domain/ranking.model';
import { RankingApiService } from './ranking-api.service';

describe('RankingApiService', () => {
  let service: RankingApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });

    service = TestBed.inject(RankingApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('o serviço pode ser injetado', () => {
    expect(service).toBeTruthy();
  });

  it('getRanking() realiza exatamente uma requisição HTTP', () => {
    service.getRanking().subscribe();
    const req = httpTesting.expectOne(cs2ApiPaths.ranking);
    expect(req.request.url).toBe(cs2ApiPaths.ranking);
    req.flush(null);
  });

  it('a URL da requisição é exatamente cs2ApiPaths.ranking', () => {
    service.getRanking().subscribe();
    const req = httpTesting.expectOne('/api/cs2/v2/ranking.json');
    expect(req.request.url).toBe(cs2ApiPaths.ranking);
    req.flush(null);
  });

  it('o método HTTP utilizado é GET', () => {
    service.getRanking().subscribe();
    const req = httpTesting.expectOne(cs2ApiPaths.ranking);
    expect(req.request.method).toBe('GET');
    req.flush(null);
  });

  it('as opções HTTP preservam o comportamento de Cs2ApiService.getRanking() sem withCredentials', () => {
    service.getRanking().subscribe();
    const req = httpTesting.expectOne(cs2ApiPaths.ranking);
    expect(req.request.withCredentials).toBe(false);
    req.flush(null);
  });

  it('payload válido com HTTP 200 é convertido em modelo de domínio Ranking', () => {
    let result: Ranking | undefined;
    service.getRanking().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.ranking);
    req.flush({
      generatedAt: '2026-08-03T12:00:00Z',
      mapsFinalizados: 12,
      players: [
        {
          steamid64: '1001',
          name: 'Player One',
          matchesPlayed: 4,
          mapsPlayed: 7,
          roundsPlayed: 120,
          wins: 3,
          losses: 1,
          kills: 80,
          deaths: 60,
          assists: 20,
          kdRatio: 1.33,
          headshotPct: 42.5,
          adr: 81.2,
          utilityDmgPerRound: 5.4,
          killsPerRound: 0.66,
          assistsPerRound: 0.16,
          deathsPerRound: 0.5,
          impactRating: 1.14,
          winRate: 0.75,
          sampleWeight: 0.4,
          score: 73.1,
        },
      ],
    });

    expect(result).toBeDefined();
    expect(result?.generatedAt).toBe('2026-08-03T12:00:00Z');
    expect(result?.players.length).toBe(1);
    expect(result?.players[0].name).toBe('Player One');
  });

  it('mapsFinalizados do payload é exposto como completedMaps', () => {
    let result: Ranking | undefined;
    service.getRanking().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.ranking);
    req.flush({
      mapsFinalizados: 15,
      players: [],
    });

    expect(result?.completedMaps).toBe(15);
  });

  it('steamid64 do jogador é exposto como steamId64', () => {
    let result: Ranking | undefined;
    service.getRanking().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.ranking);
    req.flush({
      players: [
        {
          steamid64: '76561198000000001',
          name: 'Test Player',
        },
      ],
    });

    expect(result?.players[0].steamId64).toBe('76561198000000001');
  });

  it('rankedPlayerCount é derivado a partir dos jogadores válidos', () => {
    let result: Ranking | undefined;
    service.getRanking().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.ranking);
    req.flush({
      players: [
        { steamid64: '1001', name: 'Player One' },
        { steamid64: '1002', name: 'Player Two' },
      ],
    });

    expect(result?.rankedPlayerCount).toBe(2);
  });

  it('leader é derivado como o primeiro jogador válido do ranking', () => {
    let result: Ranking | undefined;
    service.getRanking().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.ranking);
    req.flush({
      players: [
        { steamid64: '1001', name: 'Leader Player' },
        { steamid64: '1002', name: 'Second Player' },
      ],
    });

    expect(result?.leader).not.toBeNull();
    expect(result?.leader?.steamId64).toBe('1001');
    expect(result?.leader?.name).toBe('Leader Player');
  });

  it('a ordem dos jogadores recebida no payload é preservada no domínio', () => {
    let result: Ranking | undefined;
    service.getRanking().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.ranking);
    req.flush({
      players: [
        { steamid64: '1001', name: 'First' },
        { steamid64: '1002', name: 'Second' },
        { steamid64: '1003', name: 'Third' },
      ],
    });

    expect(result?.players.map((p) => p.steamId64)).toEqual(['1001', '1002', '1003']);
    expect(result?.players.map((p) => p.position)).toEqual([1, 2, 3]);
  });

  it('payload null com HTTP 200 retorna estrutura de domínio segura', () => {
    let result: Ranking | undefined;
    service.getRanking().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.ranking);
    req.flush(null);

    expect(result).toEqual({
      generatedAt: null,
      completedMaps: 0,
      players: [],
      rankedPlayerCount: 0,
      leader: null,
    });
  });

  it('payload malformado (string ou objeto inválido) com HTTP 200 retorna estrutura de domínio segura', () => {
    let result: Ranking | undefined;
    service.getRanking().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.ranking);
    req.flush('not-a-valid-ranking-json-payload');

    expect(result).toEqual({
      generatedAt: null,
      completedMaps: 0,
      players: [],
      rankedPlayerCount: 0,
      leader: null,
    });
  });

  it('array de jogadores inválidos ou sem steamid64 é normalizado filtrando os inválidos', () => {
    let result: Ranking | undefined;
    service.getRanking().subscribe((res) => (result = res));

    const req = httpTesting.expectOne(cs2ApiPaths.ranking);
    req.flush({
      players: [
        'invalid-item',
        { name: 'No Steam ID' },
        { steamid64: '1001', name: 'Valid Player' },
        { steamid64: '1001', name: 'Duplicate Steam ID' },
      ],
    });

    expect(result?.players.length).toBe(1);
    expect(result?.players[0].steamId64).toBe('1001');
    expect(result?.players[0].name).toBe('Valid Player');
    expect(result?.rankedPlayerCount).toBe(1);
  });

  it('erro HTTP 404 é propagado no Observable sem ser capturado ou silenciado', () => {
    let errorReceived: unknown;
    let nextCalled = false;

    service.getRanking().subscribe({
      next: () => (nextCalled = true),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.ranking);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(nextCalled).toBe(false);
    expect(errorReceived).toBeInstanceOf(HttpErrorResponse);
    if (errorReceived instanceof HttpErrorResponse) {
      expect(errorReceived.status).toBe(404);
    }
  });

  it('erro HTTP 500 é propagado no Observable sem ser capturado ou silenciado', () => {
    let errorReceived: unknown;
    let nextCalled = false;

    service.getRanking().subscribe({
      next: () => (nextCalled = true),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.ranking);
    req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(nextCalled).toBe(false);
    expect(errorReceived).toBeInstanceOf(HttpErrorResponse);
    if (errorReceived instanceof HttpErrorResponse) {
      expect(errorReceived.status).toBe(500);
    }
  });

  it('erro de rede é propagado no Observable', () => {
    let errorReceived: unknown;
    let nextCalled = false;

    service.getRanking().subscribe({
      next: () => (nextCalled = true),
      error: (err) => (errorReceived = err),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.ranking);
    const mockProgressEvent = new ProgressEvent('error');
    req.error(mockProgressEvent);

    expect(nextCalled).toBe(false);
    expect(errorReceived).toBeDefined();
  });

  it('erro HTTP não é convertido em Ranking nem em fallback de ranking vazio', () => {
    let nextCalled = false;
    let errorCalled = false;

    service.getRanking().subscribe({
      next: () => (nextCalled = true),
      error: () => (errorCalled = true),
    });

    const req = httpTesting.expectOne(cs2ApiPaths.ranking);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(nextCalled).toBe(false);
    expect(errorCalled).toBe(true);
  });

  it('chamadas separadas resultam em requisições separadas, confirmando ausência de cache interno', () => {
    let result1: Ranking | undefined;
    let result2: Ranking | undefined;

    service.getRanking().subscribe((res) => (result1 = res));
    service.getRanking().subscribe((res) => (result2 = res));

    const requests = httpTesting.match(cs2ApiPaths.ranking);
    expect(requests.length).toBe(2);

    requests[0].flush({ mapsFinalizados: 5, players: [] });
    requests[1].flush({ mapsFinalizados: 10, players: [] });

    expect(result1?.completedMaps).toBe(5);
    expect(result2?.completedMaps).toBe(10);
  });

  it('nenhuma requisição adicional fica pendente (verify)', () => {
    httpTesting.verify();
  });
});
