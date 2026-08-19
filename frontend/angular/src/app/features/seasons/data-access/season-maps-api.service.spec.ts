import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import { SeasonMapsApiService, SeasonMapsContractError } from './season-maps-api.service';

const createValidMapsPayload = (slug = 'season-1') => ({
  generatedAt: '2026-08-04T12:00:00Z',
  season: { slug, name: 'Season 1' },
  rules: { minRoundsPerMap: 12 },
  summary: { matches: 5, maps: 8, rounds: 160, players: 15 },
  computed: { distinctMaps: 4 },
  maps: [
    { map: 'de_mirage', matches: 3, rounds: 60, avgRoundsPerMatch: 20.0, lastPlayed: '2026-08-04T10:00:00Z' },
  ],
});

describe('SeasonMapsApiService', () => {
  let service: SeasonMapsApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });

    service = TestBed.inject(SeasonMapsApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('slug explícito faz requisição direta para a URL do recorte sazonal de mapas', async () => {
    const resultPromise = firstValueFrom(service.getMaps('season-1'));

    const req = httpTesting.expectOne(cs2ApiPaths.seasonMaps('season-1'));
    expect(req.request.method).toBe('GET');
    req.flush(createValidMapsPayload('season-1'));

    const result = await resultPromise;

    expect(result).toMatchObject({
      kind: 'available',
      maps: {
        season: {
          slug: 'season-1',
        },
      },
    });
  });

  it('retorna season-unavailable para erro HTTP 404', async () => {
    const resultPromise = firstValueFrom(service.getMaps('season-invalida'));

    const req = httpTesting.expectOne(cs2ApiPaths.seasonMaps('season-invalida'));
    expect(req.request.method).toBe('GET');
    req.flush('not-found', { status: 404, statusText: 'Not Found' });

    const result = await resultPromise;

    expect(result).toEqual({ kind: 'season-unavailable' });
  });

  it('lança SeasonMapsContractError se o payload for malformado', async () => {
    const resultPromise = firstValueFrom(service.getMaps('season-1'));

    const req = httpTesting.expectOne(cs2ApiPaths.seasonMaps('season-1'));
    expect(req.request.method).toBe('GET');
    req.flush({ payload: 'invalido' });

    await expect(resultPromise).rejects.toBeInstanceOf(SeasonMapsContractError);
  });
});
