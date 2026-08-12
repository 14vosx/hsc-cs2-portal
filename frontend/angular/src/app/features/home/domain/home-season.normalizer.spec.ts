import { describe, expect, it } from 'vitest';
import type { SeasonRankingDto, SeasonRankingPlayerDto } from '../../../core/api/dto/season-ranking.dto';
import type { SeasonContext } from '../../seasons/season-context';
import { normalizeHomeSeasonMetrics } from './home-season.normalizer';

describe('normalizeHomeSeasonMetrics', () => {
  const context: SeasonContext = {
    mode: 'active',
    slug: 'season-1',
    season: { slug: 'season-1', name: 'Temporada 1', status: 'active' },
  };
  const player = (rank: number): SeasonRankingPlayerDto => ({
    rank,
    steamid64: `7656119800000000${rank}`,
    name: `Player ${rank}`,
    steam_avatar_url: rank === 1 ? 'https://example.test/one.jpg' : null,
    wins: 10,
    losses: 2,
    kdRatio: 1.5,
    score: 1500,
  });
  const ranking = (players: SeasonRankingPlayerDto[]): SeasonRankingDto => ({
    summary: { players: players.length, matches: 10, maps: 15, rounds: 300 },
    players,
  });

  it('preserves official order, leader, top three and canonical avatar', () => {
    const result = normalizeHomeSeasonMetrics(context, ranking([player(1), player(2), player(3), player(4)]));
    expect(result.leader?.name).toBe('Player 1');
    expect(result.topPlayers.map((item) => item.name)).toEqual(['Player 1', 'Player 2', 'Player 3']);
    expect(result.leader?.avatarUrl).toBe('https://example.test/one.jpg');
  });

  it('rejects a missing rank', () => {
    expect(() => normalizeHomeSeasonMetrics(context, ranking([{ ...player(1), rank: undefined }]))).toThrow();
  });

  it('rejects rank inconsistent with array position without promoting a player', () => {
    expect(() => normalizeHomeSeasonMetrics(context, ranking([player(2), player(3)]))).toThrow();
  });

  it('rejects missing score instead of replacing it with zero', () => {
    expect(() => normalizeHomeSeasonMetrics(context, ranking([{ ...player(1), score: undefined }]))).toThrow();
  });

  it('rejects invalid wins and K/D', () => {
    expect(() => normalizeHomeSeasonMetrics(context, ranking([{ ...player(1), wins: -1 }]))).toThrow();
    expect(() => normalizeHomeSeasonMetrics(context, ranking([{ ...player(1), kdRatio: Number.NaN }]))).toThrow();
  });

  it('rejects missing or invalid required summary metrics', () => {
    expect(() => normalizeHomeSeasonMetrics(context, { players: [] })).toThrow();
    expect(() => normalizeHomeSeasonMetrics(context, { summary: { players: 0, matches: -1, maps: 0, rounds: 0 }, players: [] })).toThrow();
  });

  it('rejects a summary player count mismatch', () => {
    const payload = ranking([player(1)]);
    expect(() => normalizeHomeSeasonMetrics(context, { ...payload, summary: { ...payload.summary, players: 2 } })).toThrow();
  });

  it('accepts a canonical empty ranking', () => {
    const result = normalizeHomeSeasonMetrics(context, ranking([]));
    expect(result.leader).toBeNull();
    expect(result.topPlayers).toEqual([]);
  });

  it('preserves a canonical null avatar', () => {
    const result = normalizeHomeSeasonMetrics(context, ranking([{ ...player(1), steam_avatar_url: null }]));
    expect(result.leader?.avatarUrl).toBeNull();
  });

  it('does not use historical avatar aliases to repair a missing canonical field', () => {
    const invalid = {
      ...player(1),
      steam_avatar_url: undefined,
      avatarUrl: 'historical-alias.jpg',
    };
    expect(() => normalizeHomeSeasonMetrics(context, ranking([invalid]))).toThrow();
  });
});
