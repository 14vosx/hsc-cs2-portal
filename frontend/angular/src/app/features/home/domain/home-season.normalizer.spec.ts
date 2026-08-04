import { describe, expect, it } from 'vitest';

import { SeasonRankingDto } from '../../../core/api/dto/season-ranking.dto';
import { SeasonContext } from '../../seasons/season-context';
import { normalizeHomeSeasonMetrics } from './home-season.normalizer';

describe('normalizeHomeSeasonMetrics', () => {
  const mockContext: SeasonContext = {
    mode: 'active',
    slug: 'season-1',
    season: {
      slug: 'season-1',
      name: 'Temporada 1',
      start_at: '2026-01-01',
      end_at: '2026-12-31',
      status: 'active',
    },
  };

  const mockRankingDto: SeasonRankingDto = {
    season: { slug: 'season-1', name: 'Temporada 1' },
    generatedAt: '2026-08-04T12:00:00Z',
    summary: {
      players: 42,
      matches: 100,
      maps: 150,
      rounds: 1200,
    },
    players: [
      {
        rank: 1,
        steamid64: '76561198012345678',
        name: 'PlayerOne',
        score: 1500,
        wins: 10,
        losses: 2,
        kdRatio: 1.5,
      },
    ],
  };

  it('should normalize active season context and ranking dto correctly', () => {
    const metrics = normalizeHomeSeasonMetrics(mockContext, mockRankingDto);

    expect(metrics.seasonSlug).toBe('season-1');
    expect(metrics.seasonName).toBe('Temporada 1');
    expect(metrics.contextMode).toBe('active');
    expect(metrics.playersCount).toBe(42);
    expect(metrics.matchesCount).toBe(100);
    expect(metrics.mapsCount).toBe(150);
    expect(metrics.roundsCount).toBe(1200);
    expect(metrics.hasClassifiedPlayers).toBe(true);
    expect(metrics.leader).toEqual({
      position: 1,
      steamId64: '76561198012345678',
      name: 'PlayerOne',
      score: 1500,
      wins: 10,
      losses: 2,
      kdRatio: 1.5,
    });
  });

  it('should handle ranking dto with empty players list', () => {
    const emptyRanking: SeasonRankingDto = {
      ...mockRankingDto,
      players: [],
    };
    const metrics = normalizeHomeSeasonMetrics(mockContext, emptyRanking);

    expect(metrics.hasClassifiedPlayers).toBe(false);
    expect(metrics.leader).toBeNull();
  });
});
