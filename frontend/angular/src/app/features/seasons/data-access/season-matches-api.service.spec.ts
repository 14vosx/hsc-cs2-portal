import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  let httpMock: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpMock = { get: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        SeasonMatchesApiService,
        { provide: HttpClient, useValue: httpMock },
      ],
    });

    service = TestBed.inject(SeasonMatchesApiService);
  });

  it('slug explícito faz requisição direta para a URL do recorte sazonal de partidas', async () => {
    httpMock.get.mockReturnValue(of(createValidPayload('season-1')));

    const result = await firstValueFrom(service.getMatches(' season-1 '));

    expect(httpMock.get).toHaveBeenCalledWith(
      '/api/cs2/v2/season/season-1/matches.json',
    );

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
    httpMock.get.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );

    const result = await firstValueFrom(
      service.getMatches('season-invalida'),
    );

    expect(result).toEqual({ kind: 'season-unavailable' });
  });

  it('lança SeasonMatchesContractError se o payload for malformado', async () => {
    httpMock.get.mockReturnValue(of({ payload: 'invalido' }));

    await expect(
      firstValueFrom(service.getMatches('season-1')),
    ).rejects.toBeInstanceOf(SeasonMatchesContractError);
  });

  it('sem slug consulta o índice de seasons e resolve o contexto ativo', async () => {
    const seasonsIndex = {
      activeSeasonSlug: 'season-2',
      seasons: [{ slug: 'season-2', status: 'active' }],
    };

    httpMock.get
      .mockReturnValueOnce(of(seasonsIndex))
      .mockReturnValueOnce(of(createValidPayload('season-2')));

    const result = await firstValueFrom(service.getMatches(null));

    expect(httpMock.get).toHaveBeenCalledTimes(2);
    expect(httpMock.get).toHaveBeenNthCalledWith(
      1,
      '/api/cs2/v2/seasons.json',
    );
    expect(httpMock.get).toHaveBeenNthCalledWith(
      2,
      '/api/cs2/v2/season/season-2/matches.json',
    );
    expect(result).toMatchObject({ kind: 'available' });
  });
});
