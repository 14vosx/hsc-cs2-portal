import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cs2ApiService } from '../../../core/api/cs2-api.service';
import { SeasonRankingDto } from '../../../core/api/dto/season-ranking.dto';
import { SeasonsIndexDto } from '../../../core/api/dto/season.dto';
import { NewsApiService, NewsContractError } from '../../news/data-access/news-api.service';
import type { NewsIndex } from '../../news/domain/news.model';
import { HomeApiService } from './home-api.service';

describe('HomeApiService', () => {
  let service: HomeApiService;
  let cs2ApiMock: {
    getSeasons: ReturnType<typeof vi.fn>;
    getSeasonRanking: ReturnType<typeof vi.fn>;
  };
  let newsApiMock: {
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
    };

    newsApiMock = {
      getNewsIndex: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        HomeApiService,
        { provide: Cs2ApiService, useValue: cs2ApiMock },
        { provide: NewsApiService, useValue: newsApiMock },
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

  describe('getEditorialHighlight()', () => {
    it('1. índice com item canônico retorna HomeEditorialItem corretamente', () => {
      const canonicalIndex: NewsIndex = {
        count: 1,
        items: [
          {
            slug: 'news-1',
            title: 'News Title 1',
            excerpt: 'News Excerpt 1',
            imageUrl: 'https://example.com/1.jpg',
            publishedAt: '2026-08-04T12:00:00Z',
          },
        ],
      };
      newsApiMock.getNewsIndex.mockReturnValue(of(canonicalIndex));

      const emittedValues: unknown[] = [];
      service.getEditorialHighlight().subscribe((val) => {
        emittedValues.push(val);
      });

      expect(emittedValues).toEqual([
        null,
        {
          id: 'news-1',
          title: 'News Title 1',
          summary: 'News Excerpt 1',
          slug: 'news-1',
          date: '2026-08-04T12:00:00Z',
        },
      ]);
    });

    it('2. usa o primeiro item sem ordenar por publishedAt', () => {
      const canonicalIndex: NewsIndex = {
        count: 2,
        items: [
          {
            slug: 'old-first',
            title: 'Old Item Published First In List',
            excerpt: 'Excerpt 1',
            imageUrl: null,
            publishedAt: '2020-01-01T00:00:00Z',
          },
          {
            slug: 'new-second',
            title: 'New Item Published Second In List',
            excerpt: 'Excerpt 2',
            imageUrl: null,
            publishedAt: '2026-08-04T00:00:00Z',
          },
        ],
      };
      newsApiMock.getNewsIndex.mockReturnValue(of(canonicalIndex));

      let result: unknown;
      service.getEditorialHighlight().subscribe((val) => {
        if (val !== null) {
          result = val;
        }
      });

      expect(result).toEqual({
        id: 'old-first',
        title: 'Old Item Published First In List',
        summary: 'Excerpt 1',
        slug: 'old-first',
        date: '2020-01-01T00:00:00Z',
      });
    });

    it('3. excerpt null vira summary ""', () => {
      const canonicalIndex: NewsIndex = {
        count: 1,
        items: [
          {
            slug: 'no-excerpt',
            title: 'Title',
            excerpt: null,
            imageUrl: null,
            publishedAt: '2026-08-04T12:00:00Z',
          },
        ],
      };
      newsApiMock.getNewsIndex.mockReturnValue(of(canonicalIndex));

      let result: unknown;
      service.getEditorialHighlight().subscribe((val) => {
        if (val !== null) {
          result = val;
        }
      });

      expect(result).toEqual({
        id: 'no-excerpt',
        title: 'Title',
        summary: '',
        slug: 'no-excerpt',
        date: '2026-08-04T12:00:00Z',
      });
    });

    it('4. publishedAt null vira date ""', () => {
      const canonicalIndex: NewsIndex = {
        count: 1,
        items: [
          {
            slug: 'no-date',
            title: 'Title',
            excerpt: 'Excerpt',
            imageUrl: null,
            publishedAt: null,
          },
        ],
      };
      newsApiMock.getNewsIndex.mockReturnValue(of(canonicalIndex));

      let result: unknown;
      service.getEditorialHighlight().subscribe((val) => {
        if (val !== null) {
          result = val;
        }
      });

      expect(result).toEqual({
        id: 'no-date',
        title: 'Title',
        summary: 'Excerpt',
        slug: 'no-date',
        date: '',
      });
    });

    it('5. índice vazio retorna null', () => {
      newsApiMock.getNewsIndex.mockReturnValue(of({ count: 0, items: [] }));

      const emittedValues: unknown[] = [];
      service.getEditorialHighlight().subscribe((val) => {
        emittedValues.push(val);
      });

      expect(emittedValues).toEqual([null]);
    });

    it('6. erro HTTP retorna null', () => {
      newsApiMock.getNewsIndex.mockReturnValue(throwError(() => new Error('HTTP 500')));

      const emittedValues: unknown[] = [];
      service.getEditorialHighlight().subscribe((val) => {
        emittedValues.push(val);
      });

      expect(emittedValues).toEqual([null]);
    });

    it('7. NewsContractError retorna null', () => {
      newsApiMock.getNewsIndex.mockReturnValue(
        throwError(() => new NewsContractError('Invalid NewsIndex payload received'))
      );

      const emittedValues: unknown[] = [];
      service.getEditorialHighlight().subscribe((val) => {
        emittedValues.push(val);
      });

      expect(emittedValues).toEqual([null]);
    });

    it('8. nenhuma falha de News interfere no fluxo sazonal', () => {
      cs2ApiMock.getSeasons.mockReturnValue(of(mockSeasonsIndex));
      cs2ApiMock.getSeasonRanking.mockReturnValue(of(mockSeasonRanking));
      newsApiMock.getNewsIndex.mockReturnValue(throwError(() => new Error('HTTP 500')));

      const seasonStates: string[] = [];
      service.getHomeSeasonMetrics().subscribe((state) => {
        seasonStates.push(state.status);
      });

      const editorialValues: unknown[] = [];
      service.getEditorialHighlight().subscribe((val) => {
        editorialValues.push(val);
      });

      expect(seasonStates).toEqual(['loading', 'ready']);
      expect(editorialValues).toEqual([null]);
    });

    it('9. chamada editorial usa NewsApiService e não Cs2ApiService', () => {
      newsApiMock.getNewsIndex.mockReturnValue(of({ count: 0, items: [] }));

      service.getEditorialHighlight().subscribe();

      expect(newsApiMock.getNewsIndex).toHaveBeenCalledTimes(1);
    });
  });
});
