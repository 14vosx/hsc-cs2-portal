import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  let httpMock: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpMock = { get: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        SeasonMapsApiService,
        { provide: 'HttpClient', useValue: httpMock },
      ],
    });

    service = TestBed.inject(SeasonMapsApiService);
    (service as any).http = httpMock;
  });

  it('slug explícito faz requisição direta para a URL do recorte sazonal de mapas', () => {
    httpMock.get.mockReturnValue(of(createValidMapsPayload('season-1')));

    let result: any;
    service.getMaps('season-1').subscribe((res) => (result = res));

    expect(httpMock.get).toHaveBeenCalledWith('/api/cs2/v2/season/season-1/maps.json');
    expect(result.kind).toBe('available');
    expect(result.maps.season.slug).toBe('season-1');
  });

  it('retorna season-unavailable para erro HTTP 404', () => {
    httpMock.get.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    let result: any;
    service.getMaps('season-invalida').subscribe((res) => (result = res));

    expect(result.kind).toBe('season-unavailable');
  });

  it('lança SeasonMapsContractError se o payload for malformado', () => {
    httpMock.get.mockReturnValue(of({ payload: 'invalido' }));

    let error: any;
    service.getMaps('season-1').subscribe({
      error: (e) => (error = e),
    });

    expect(error).toBeInstanceOf(SeasonMapsContractError);
  });
});
