import { describe, expect, it } from 'vitest';
import type {
  SeasonMatchesDto,
  SeasonMatchSummaryDto,
} from '../../../core/api/dto/season-matches.dto';
import { normalizeHomeRecentMatches } from './home-recent-matches.normalizer';

function match(id: number, date: string | null): SeasonMatchSummaryDto {
  return {
    matchid: id,
    start_time: '',
    end_time: '',
    winner: id === 1 ? null as unknown as string : 'Team A',
    series_type: 'BO1',
    team1_name: id === 1 ? null as unknown as string : 'Team A',
    team1_score: 1,
    team2_name: 'Team B',
    team2_score: 0,
    server_ip: '',
    seasonLastMapEndedAt: date,
    maps: [{ mapnumber: 1, mapname: 'de_nuke', team1_score: 13, team2_score: 8, rounds: 21 }],
  };
}

describe('normalizeHomeRecentMatches', () => {
  it('preserves payload order even when dates are deliberately out of order', () => {
    const result = normalizeHomeRecentMatches({ matches: [match(2, '2025-01-01'), match(1, '2026-01-01'), match(3, '2024-01-01')] });
    expect(result.map((item) => item.matchId)).toEqual([2, 1, 3]);
  });

  it('limits presentation to the first three without sorting', () => {
    const result = normalizeHomeRecentMatches({ matches: [match(4, null), match(2, null), match(3, null), match(1, null)] });
    expect(result.map((item) => item.matchId)).toEqual([4, 2, 3]);
  });

  it('accepts a canonical empty collection', () => {
    expect(normalizeHomeRecentMatches({ matches: [] })).toEqual([]);
  });

  it('rejects a missing matches collection', () => {
    expect(() => normalizeHomeRecentMatches({})).toThrow();
  });

  it('rejects an invalid item instead of filtering it out', () => {
    const invalidPayload = {
      matches: [
        match(2, null),
        {
          ...match(1, null),
          team1_score: undefined,
        },
      ],
    } as unknown as SeasonMatchesDto;

    expect(() => normalizeHomeRecentMatches(invalidPayload)).toThrow();
  });

  it('preserves seasonal timestamp, nullable team names and nullable winner', () => {
    const result = normalizeHomeRecentMatches({ matches: [match(1, '2026-08-04T11:00:00Z')] });
    expect(result[0].seasonLastMapEndedAt).toBe('2026-08-04T11:00:00Z');
    expect(result[0].team1Name).toBeNull();
    expect(result[0].winnerName).toBeNull();
  });
});
