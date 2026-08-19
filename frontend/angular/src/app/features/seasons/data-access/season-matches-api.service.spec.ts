import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import { SeasonMatchesApiService, SeasonMatchesContractError } from './season-matches-api.service';

const createValidPayload = (slug = 'season-1') => ({
  generatedAt: '2026-08-04T12:00:00Z',
  season: { slug, name: 'Season 1' },
  rules: { minRoundsPerMap: 12 },
  summary: { matches: 1, maps: 1, rounds: 20, players: 10 },
  computed: { firstMapStartedAt: '2026-01-01T10:00:00Z' },
  matches: [
    {
      matchid: 101,
      team1_score: 2,
      team2_score: 1,
      seasonMapCount: 3,
      seasonRounds: 40,
      maps: [
        { mapnumber: 1, mapname: 'de_mirage', team1_score: 13, team2_score: 7, rounds: 20 },
      ],
    },
  ],
});

describe('SeasonMatchesApiService', () => {
  let service: SeasonMatchesApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });

    service = TestBed.inject(SeasonMatchesApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('slug explícito faz requisição direta para a URL do recorte sazonal de partidas', async () => {
    const resultPromise = firstValueFrom(service.getMatches(' season-1 '));

    const req = httpTesting.expectOne(cs2ApiPaths.seasonMatches('season-1'));
    expect(req.request.method).toBe('GET');
    req.flush(createValidPayload('season-1'));

    const result = await resultPromise;

    expect(result).toMatchObject({
      kind: 'available',
      matches: {
        season: {
          slug: 'season-1',
        },
      },
    });
  });

  it('retorna season-unavailable para erro HTTP 404', async () => {
    const resultPromise = firstValueFrom(service.getMatches('season-invalida'));

    const req = httpTesting.expectOne(cs2ApiPaths.seasonMatches('season-invalida'));
    expect(req.request.method).toBe('GET');
    req.flush('not-found', { status: 404, statusText: 'Not Found' });

    const result = await resultPromise;

    expect(result).toEqual({ kind: 'season-unavailable' });
  });

  it('lança SeasonMatchesContractError se o payload for malformado', async () => {
    const resultPromise = firstValueFrom(service.getMatches('season-1'));

    const req = httpTesting.expectOne(cs2ApiPaths.seasonMatches('season-1'));
    expect(req.request.method).toBe('GET');
    req.flush({ payload: 'invalido' });

    await expect(resultPromise).rejects.toBeInstanceOf(SeasonMatchesContractError);
  });

  it('sem slug consulta o índice de seasons e resolve o contexto ativo', async () => {
    const seasonsIndex = {
      activeSeasonSlug: 'season-2',
      seasons: [{ slug: 'season-2', status: 'active' }],
    };

    const resultPromise = firstValueFrom(service.getMatches(null));

    const seasonsReq = httpTesting.expectOne(cs2ApiPaths.seasons);
    expect(seasonsReq.request.method).toBe('GET');
    seasonsReq.flush(seasonsIndex);

    const matchesReq = httpTesting.expectOne(cs2ApiPaths.seasonMatches('season-2'));
    expect(matchesReq.request.method).toBe('GET');
    matchesReq.flush(createValidPayload('season-2'));

    const result = await resultPromise;

    expect(result).toMatchObject({ kind: 'available' });
  });
});
