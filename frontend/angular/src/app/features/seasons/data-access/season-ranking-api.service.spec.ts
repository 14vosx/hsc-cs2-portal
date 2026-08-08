import { HttpErrorResponse, provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import { SeasonRankingApiService } from './season-ranking-api.service';

describe('SeasonRankingApiService', () => {
  let service: SeasonRankingApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });

    service = TestBed.inject(SeasonRankingApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('slug explícito realiza uma única requisição e retorna available', () => {
    let result: unknown;
    service.getRanking('season-1').subscribe((value) => (result = value));

    const req = httpTesting.expectOne(cs2ApiPaths.seasonRanking('season-1'));
    expect(req.request.method).toBe('GET');
    req.flush({ season: { slug: 'season-1' } });

    expect(result).toEqual({
      kind: 'available',
      ranking: expect.objectContaining({ season: expect.objectContaining({ slug: 'season-1' }) }),
    });
  });

  it('current usa activeSeasonSlug válido', () => {
    let result: unknown;
    service.getRanking(null).subscribe((value) => (result = value));

    const seasonsReq = httpTesting.expectOne(cs2ApiPaths.seasons);
    seasonsReq.flush({ activeSeasonSlug: 'active-season', seasons: [{ slug: 'active-season', status: 'active' }] });

    const rankingReq = httpTesting.expectOne(cs2ApiPaths.seasonRanking('active-season'));
    rankingReq.flush({ season: { slug: 'active-season' } });

    expect(result).toEqual({
      kind: 'available',
      ranking: expect.objectContaining({ season: expect.objectContaining({ slug: 'active-season' }) }),
    });
  });

  it('current usa latest-closed quando não existe contexto ativo válido', () => {
    let result: unknown;
    service.getRanking(null).subscribe((value) => (result = value));

    const seasonsReq = httpTesting.expectOne(cs2ApiPaths.seasons);
    seasonsReq.flush({
      activeSeasonSlug: 'missing',
      seasons: [
        { slug: 'older', status: 'closed', end_at: '2025-01-01T00:00:00Z' },
        { slug: 'newer', status: 'closed', end_at: '2026-01-01T00:00:00Z' },
      ],
    });

    const rankingReq = httpTesting.expectOne(cs2ApiPaths.seasonRanking('newer'));
    rankingReq.flush({ season: { slug: 'newer' } });

    expect(result).toEqual({
      kind: 'available',
      ranking: expect.objectContaining({ season: expect.objectContaining({ slug: 'newer' }) }),
    });
  });

  it('current sem active nem closed retorna season-unavailable sem pedir ranking', () => {
    let result: unknown;
    service.getRanking(null).subscribe((value) => (result = value));

    const seasonsReq = httpTesting.expectOne(cs2ApiPaths.seasons);
    seasonsReq.flush({ activeSeasonSlug: null, seasons: [] });

    expect(result).toEqual({ kind: 'season-unavailable' });
  });

  it('payload de ranking sem season válida retorna season-unavailable', () => {
    let result: unknown;
    service.getRanking('season-1').subscribe((value) => (result = value));

    const req = httpTesting.expectOne(cs2ApiPaths.seasonRanking('season-1'));
    req.flush({ season: { slug: '' } });

    expect(result).toEqual({ kind: 'season-unavailable' });
  });

  it('HTTP 404 do ranking retorna season-unavailable', () => {
    let result: unknown;
    service.getRanking('season-1').subscribe((value) => (result = value));

    const req = httpTesting.expectOne(cs2ApiPaths.seasonRanking('season-1'));
    req.flush('not-found', { status: 404, statusText: 'Not Found' });

    expect(result).toEqual({ kind: 'season-unavailable' });
  });

  it('HTTP 500 é propagado', () => {
    let errorStatus: number | undefined;
    service.getRanking('season-1').subscribe({
      next: () => undefined,
      error: (received) => {
        errorStatus = received.status;
      },
    });

    const req = httpTesting.expectOne(cs2ApiPaths.seasonRanking('season-1'));
    req.flush('server-error', { status: 500, statusText: 'Internal Server Error' });

     expect(errorStatus).toBe(500);
  });
});
