import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { Cs2ApiService } from '../../../core/api/cs2-api.service';
import { SeasonRankingDto } from '../../../core/api/dto/season-ranking.dto';
import { SeasonsIndexDto } from '../../../core/api/dto/season.dto';
import { HomeApiService } from './home-api.service';

describe('HomeApiService', () => {
  let service: HomeApiService;
  let cs2ApiMock: {
    getSeasons: ReturnType<typeof vi.fn>;
    getSeasonRanking: ReturnType<typeof vi.fn>;
    getNewsIndex: ReturnType<typeof vi.fn>;
  };

  const mockSeasonsIndex: SeasonsIndexDto = {
    activeSeasonSlug: 'season-1',
    seasons: [
      {
        slug: 'season-1',
        name: 'Season 1',
        start_at: '2026-01-01',
        end_at: '2026-12-31',
        status: 'active',
      },
    ],
  };

  const mockSeasonRanking: SeasonRankingDto = {
    season: { slug: 'season-1', name: 'Season 1' },
    summary: { players: 10, matches: 20, maps: 30, rounds: 400 },
    players: [],
  };

  beforeEach(() => {
    cs2ApiMock = {
      getSeasons: vi.fn(),
      getSeasonRanking: vi.fn(),
      getNewsIndex: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        HomeApiService,
        { provide: Cs2ApiService, useValue: cs2ApiMock },
      ],
    });

    service = TestBed.inject(HomeApiService);
  });

  it('should start with loading state and transition to ready when calls succeed', async () => {
    cs2ApiMock.getSeasons.mockReturnValue(of(mockSeasonsIndex));
    cs2ApiMock.getSeasonRanking.mockReturnValue(of(mockSeasonRanking));

    const emittedStates: string[] = [];
    service.getHomeSeasonMetrics().subscribe((state) => {
      emittedStates.push(state.status);
    });

    expect(emittedStates).toEqual(['loading', 'ready']);
  });

  it('should return empty state when no season context is resolved', async () => {
    cs2ApiMock.getSeasons.mockReturnValue(of({ activeSeasonSlug: null, seasons: [] }));

    const emittedStates: string[] = [];
    service.getHomeSeasonMetrics().subscribe((state) => {
      emittedStates.push(state.status);
    });

    expect(emittedStates).toEqual(['loading', 'empty']);
  });

  it('should return seasons-error when getSeasons fails and not treat as empty', async () => {
    cs2ApiMock.getSeasons.mockReturnValue(throwError(() => new Error('HTTP 500')));

    const emittedStates: unknown[] = [];
    service.getHomeSeasonMetrics().subscribe((state) => {
      emittedStates.push(state);
    });

    expect(emittedStates).toEqual([
      { status: 'loading' },
      { status: 'seasons-error', error: 'Não foi possível carregar a lista de temporadas.' },
    ]);
  });

  it('should return ranking-error preserving season context when getSeasonRanking fails', async () => {
    cs2ApiMock.getSeasons.mockReturnValue(of(mockSeasonsIndex));
    cs2ApiMock.getSeasonRanking.mockReturnValue(throwError(() => new Error('HTTP 500')));

    const emittedStates: unknown[] = [];
    service.getHomeSeasonMetrics().subscribe((state) => {
      emittedStates.push(state);
    });

    expect(emittedStates).toEqual([
      { status: 'loading' },
      {
        status: 'ranking-error',
        error: 'Não foi possível carregar o ranking da temporada.',
        seasonSlug: 'season-1',
        seasonName: 'Season 1',
        contextMode: 'active',
      },
    ]);
  });

  it('should isolate news failure and return null without throwing', async () => {
    cs2ApiMock.getNewsIndex.mockReturnValue(throwError(() => new Error('HTTP 404')));

    const emittedValues: unknown[] = [];
    service.getEditorialHighlight().subscribe((val) => {
      emittedValues.push(val);
    });

    expect(emittedValues).toEqual([null]);
  });
});
