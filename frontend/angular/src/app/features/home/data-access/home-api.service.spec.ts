import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Cs2ApiService } from '../../../core/api/cs2-api.service';
import type { SeasonRankingDto } from '../../../core/api/dto/season-ranking.dto';
import type { SeasonsIndexDto } from '../../../core/api/dto/season.dto';
import { NewsApiService } from '../../news/data-access/news-api.service';
import { HomeApiService } from './home-api.service';

describe('HomeApiService', () => {
  let service: HomeApiService;
  let cs2Api: { getSeasons: ReturnType<typeof vi.fn>; getSeasonRanking: ReturnType<typeof vi.fn>; getSeasonMatches: ReturnType<typeof vi.fn>; getMatch: ReturnType<typeof vi.fn> };
  let newsApi: { getNewsIndex: ReturnType<typeof vi.fn> };
  const ranking: SeasonRankingDto = {
    summary: { players: 0, matches: 0, maps: 0, rounds: 0 },
    players: [],
  };

  beforeEach(() => {
    cs2Api = { getSeasons: vi.fn(), getSeasonRanking: vi.fn(), getSeasonMatches: vi.fn(), getMatch: vi.fn() };
    newsApi = { getNewsIndex: vi.fn() };
  });

  function configure(seasons: SeasonsIndexDto): void {
    cs2Api.getSeasons.mockReturnValue(of(seasons));
    TestBed.configureTestingModule({ providers: [HomeApiService, { provide: Cs2ApiService, useValue: cs2Api }, { provide: NewsApiService, useValue: newsApi }] });
    service = TestBed.inject(HomeApiService);
  }

  it('resolves active context and ranking', () => {
    configure({ activeSeasonSlug: 's1', seasons: [{ slug: 's1', name: 'Season 1', status: 'active' }] });
    cs2Api.getSeasonRanking.mockReturnValue(of(ranking));
    const statuses: string[] = [];
    service.getHomeSeasonMetrics().subscribe((state) => statuses.push(state.status));
    expect(statuses).toEqual(['loading', 'ready']);
    expect(cs2Api.getSeasonRanking).toHaveBeenCalledWith('s1');
  });

  it('resolves the latest closed context', () => {
    configure({ seasons: [{ slug: 'old', name: 'Old', status: 'closed', end_at: '2025-01-01' }, { slug: 'latest', name: 'Latest', status: 'closed', end_at: '2026-01-01' }] });
    cs2Api.getSeasonRanking.mockReturnValue(of(ranking));
    service.getHomeSeasonMetrics().subscribe();
    expect(cs2Api.getSeasonRanking).toHaveBeenCalledWith('latest');
  });

  it('preserves season context when ranking fails', () => {
    configure({ activeSeasonSlug: 's1', seasons: [{ slug: 's1', name: 'Season 1', status: 'active' }] });
    cs2Api.getSeasonRanking.mockReturnValue(throwError(() => new Error('ranking')));
    let last: unknown;
    service.getHomeSeasonMetrics().subscribe((state) => { last = state; });
    expect(last).toEqual({ status: 'ranking-error', error: 'Não foi possível carregar o ranking da temporada.', seasonSlug: 's1', seasonName: 'Season 1', contextMode: 'active' });
  });

  it('returns recent matches independently without detail requests or player N+1', () => {
    configure({ activeSeasonSlug: 's1', seasons: [{ slug: 's1', name: 'Season 1', status: 'active' }] });
    cs2Api.getSeasonMatches.mockReturnValue(of({ matches: [{ matchid: 1, seasonLastMapEndedAt: null, winner: 'A', team1_name: 'A', team1_score: 1, team2_name: 'B', team2_score: 0, maps: [] }] }));
    const statuses: string[] = [];
    service.getRecentMatches().subscribe((state) => statuses.push(state.status));
    expect(statuses).toEqual(['loading', 'ready']);
    expect(cs2Api.getSeasonMatches).toHaveBeenCalledWith('s1');
    expect(cs2Api.getMatch).not.toHaveBeenCalled();
    expect(cs2Api.getSeasons).toHaveBeenCalledTimes(1);
  });

  it('shares the season resolution between ranking and matches', () => {
    configure({ activeSeasonSlug: 's1', seasons: [{ slug: 's1', name: 'Season 1', status: 'active' }] });
    cs2Api.getSeasonRanking.mockReturnValue(of(ranking));
    cs2Api.getSeasonMatches.mockReturnValue(of({ matches: [] }));

    service.getHomeSeasonMetrics().subscribe();
    service.getRecentMatches().subscribe();

    expect(cs2Api.getSeasons).toHaveBeenCalledTimes(1);
  });

  it('maps empty and failed matches independently', () => {
    configure({ activeSeasonSlug: 's1', seasons: [{ slug: 's1', name: 'Season 1', status: 'active' }] });
    cs2Api.getSeasonMatches.mockReturnValueOnce(of({ matches: [] })).mockReturnValueOnce(throwError(() => new Error('matches')));
    let empty: unknown; let failed: unknown;
    service.getRecentMatches().subscribe((state) => { empty = state; });
    service.getRecentMatches().subscribe((state) => { failed = state; });
    expect(empty).toEqual({ status: 'empty' });
    expect(failed).toEqual({ status: 'error' });
  });

  it('maps a ranking contract error to ranking-error', () => {
    configure({ activeSeasonSlug: 's1', seasons: [{ slug: 's1', name: 'Season 1', status: 'active' }] });
    cs2Api.getSeasonRanking.mockReturnValue(of({ summary: {}, players: [] }));
    let last: unknown;
    service.getHomeSeasonMetrics().subscribe((state) => { last = state; });
    expect(last).toMatchObject({ status: 'ranking-error', seasonSlug: 's1' });
  });

  it('maps a matches contract error to error rather than empty', () => {
    configure({ activeSeasonSlug: 's1', seasons: [{ slug: 's1', name: 'Season 1', status: 'active' }] });
    cs2Api.getSeasonMatches.mockReturnValue(of({}));
    let last: unknown;
    service.getRecentMatches().subscribe((state) => { last = state; });
    expect(last).toEqual({ status: 'error' });
  });

  it('returns at most two canonical news items in received order', () => {
    configure({ seasons: [] });
    newsApi.getNewsIndex.mockReturnValue(of({ count: 3, items: [
      { slug: 'first', title: 'First', excerpt: null, imageUrl: null, publishedAt: null },
      { slug: 'second', title: 'Second', excerpt: 'Two', imageUrl: null, publishedAt: null },
      { slug: 'third', title: 'Third', excerpt: null, imageUrl: null, publishedAt: null },
    ] }));
    let last: unknown;
    service.getHomeNews().subscribe((state) => { last = state; });
    expect(last).toMatchObject({ status: 'ready', data: [{ slug: 'first' }, { slug: 'second' }] });
  });

  it('keeps news errors independent', () => {
    configure({ seasons: [] });
    newsApi.getNewsIndex.mockReturnValue(throwError(() => new Error('news')));
    let last: unknown;
    service.getHomeNews().subscribe((state) => { last = state; });
    expect(last).toEqual({ status: 'error' });
  });
});
