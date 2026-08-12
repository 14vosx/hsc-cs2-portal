import type { SeasonRankingDto, SeasonRankingPlayerDto } from '../../../core/api/dto/season-ranking.dto';
import type { SeasonContext } from '../../seasons/season-context';
import type { HomeSeasonMetrics, HomeTopPlayer } from './home-season.model';

export function normalizeHomeSeasonMetrics(
  context: SeasonContext,
  rankingDto: SeasonRankingDto,
): HomeSeasonMetrics {
  const summary = rankingDto.summary;
  if (!summary) {
    throw new Error('Invalid season ranking summary');
  }

  const playersCount = requiredNonNegativeInteger(summary.players, 'summary.players');
  const matchesCount = requiredNonNegativeInteger(summary.matches, 'summary.matches');
  const mapsCount = requiredNonNegativeInteger(summary.maps, 'summary.maps');
  const roundsCount = requiredNonNegativeInteger(summary.rounds, 'summary.rounds');

  if (!Array.isArray(rankingDto.players)) {
    throw new Error('Invalid season ranking players');
  }
  if (playersCount !== rankingDto.players.length) {
    throw new Error('Season ranking player count mismatch');
  }

  const players = rankingDto.players.map((player, index) => normalizePlayer(player, index));

  return {
    seasonSlug: context.slug,
    seasonName: nonEmptyString(context.season.name) ?? nonEmptyString(rankingDto.season?.name) ?? context.slug,
    contextMode: context.mode,
    generatedAt: nullableNonEmptyString(rankingDto.generatedAt),
    playersCount,
    matchesCount,
    mapsCount,
    roundsCount,
    leader: players[0] ?? null,
    topPlayers: players.slice(0, 3),
    hasClassifiedPlayers: players.length > 0,
  };
}

function normalizePlayer(player: SeasonRankingPlayerDto, index: number): HomeTopPlayer {
  if (!player || typeof player !== 'object') {
    throw new Error(`Invalid season ranking player at index ${index}`);
  }

  const position = requiredPositiveInteger(player.rank, `players[${index}].rank`);
  if (position !== index + 1) {
    throw new Error(`Season ranking order mismatch at index ${index}`);
  }

  const steamId64 = nonEmptyString(player.steamid64);
  if (!steamId64 || !/^\d{17}$/.test(steamId64)) {
    throw new Error(`Invalid players[${index}].steamid64`);
  }

  const name = nonEmptyString(player.name);
  if (!name) {
    throw new Error(`Invalid players[${index}].name`);
  }

  return {
    position,
    steamId64,
    name,
    avatarUrl: requiredNullableString(player.steam_avatar_url, `players[${index}].steam_avatar_url`),
    score: requiredFiniteNumber(player.score, `players[${index}].score`),
    wins: requiredNonNegativeInteger(player.wins, `players[${index}].wins`),
    losses: requiredNonNegativeInteger(player.losses, `players[${index}].losses`),
    kdRatio: requiredFiniteNumber(player.kdRatio, `players[${index}].kdRatio`),
  };
}

function requiredNonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function requiredPositiveInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function requiredFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function requiredNullableString(value: unknown, field: string): string | null {
  if (value === null) {
    return null;
  }
  const normalized = nonEmptyString(value);
  if (!normalized) {
    throw new Error(`Invalid ${field}`);
  }
  return normalized;
}

function nullableNonEmptyString(value: unknown): string | null {
  return value === undefined || value === null ? null : requiredNullableString(value, 'generatedAt');
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
