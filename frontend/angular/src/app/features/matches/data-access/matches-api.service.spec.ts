import { HttpErrorResponse, provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import type { MatchDetail, MatchesIndex } from '../domain/match.model';
import { MatchesApiService, MatchesContractError } from './matches-api.service';

describe('MatchesApiService', () => {
  let service: MatchesApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });

    service = TestBed.inject(MatchesApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('o serviço pode ser injetado', () => {
    expect(service).toBeTruthy();
  });

  describe('getMatches()', () => {
    it('realiza exatamente uma requisição GET para a URL exata de cs2ApiPaths.matches', () => {
      service.getMatches().subscribe();

      const req = httpTesting.expectOne(cs2ApiPaths.matches);
      expect(req.request.method).toBe('GET');
      req.flush({ generatedAt: '2026-08-04T12:00:00Z', matches: [] });
    });

    it('retorna modelo canônico MatchesIndex preservando a ordem remota', () => {
      let result: MatchesIndex | undefined;
      service.getMatches().subscribe((res) => (result = res));

      const req = httpTesting.expectOne(cs2ApiPaths.matches);
      req.flush({
        generatedAt: '2026-08-04T12:00:00Z',
        matches: [
          { matchid: 1, series_type: 'BO3', maps: [] },
          { matchid: 2, series_type: 'BO1', maps: [] },
        ],
      });

      expect(result).toBeDefined();
      expect(result?.generatedAt).toBe('2026-08-04T12:00:00Z');
      expect(result?.matches.map((m) => m.id)).toEqual([1, 2]);
    });

    it('lança erro contratual MatchesContractError quando o payload for inválido', () => {
      let errorReceived: unknown;
      service.getMatches().subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.matches);
      req.flush({ invalid: true });

      expect(errorReceived).toBeInstanceOf(MatchesContractError);
    });

    it('propaga erro HTTP 404 sem converter em erro contratual', () => {
      let errorReceived: unknown;
      service.getMatches().subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.matches);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(errorReceived).toBeInstanceOf(HttpErrorResponse);
      expect((errorReceived as HttpErrorResponse).status).toBe(404);
    });

    it('propaga erro HTTP 500 sem converter em erro contratual', () => {
      let errorReceived: unknown;
      service.getMatches().subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.matches);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).toBeInstanceOf(HttpErrorResponse);
      expect((errorReceived as HttpErrorResponse).status).toBe(500);
    });
  });

  describe('getMatch()', () => {
    it('realiza exatamente uma requisição GET para a URL exata de cs2ApiPaths.match(id)', () => {
      const matchId = 123;
      service.getMatch(matchId).subscribe();

      const expectedUrl = cs2ApiPaths.match(matchId);
      const req = httpTesting.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({
        generatedAt: '2026-08-04T12:00:00Z',
        matchid: 123,
        match: { matchid: 123 },
        computed: { mapsPlayed: 1, bestOf: 1, isPartialSeries: 0 },
        maps: [],
        totals: [],
      });
    });

    it('retorna modelo canônico MatchDetail para payload válido', () => {
      let result: MatchDetail | undefined;
      service.getMatch(456).subscribe((res) => (result = res));

      const req = httpTesting.expectOne(cs2ApiPaths.match(456));
      req.flush({
        generatedAt: '2026-08-04T12:00:00Z',
        matchid: 456,
        match: { matchid: 456, winner: 'Team A' },
        computed: { mapsPlayed: 2, bestOf: 3, isPartialSeries: 0 },
        maps: [],
        totals: [],
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe(456);
      expect(result?.match.winner).toBe('Team A');
    });

    it('lança erro contratual MatchesContractError quando o payload do detalhe for inválido', () => {
      let errorReceived: unknown;
      service.getMatch(789).subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.match(789));
      req.flush({ generatedAt: '2026-08-04T12:00:00Z' }); // sem matchid

      expect(errorReceived).toBeInstanceOf(MatchesContractError);
    });

    it('propaga erro HTTP 404 sem converter em erro contratual para o detalhe', () => {
      let errorReceived: unknown;
      service.getMatch(999).subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.match(999));
      req.flush('Match Not Found', { status: 404, statusText: 'Not Found' });

      expect(errorReceived).toBeInstanceOf(HttpErrorResponse);
      expect((errorReceived as HttpErrorResponse).status).toBe(404);
    });

    it('propaga erro HTTP 500 sem converter em erro contratual para o detalhe', () => {
      let errorReceived: unknown;
      service.getMatch(999).subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.match(999));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).toBeInstanceOf(HttpErrorResponse);
      expect((errorReceived as HttpErrorResponse).status).toBe(500);
    });
  });
});
