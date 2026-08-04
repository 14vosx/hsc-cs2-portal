import {
  SeasonRankingDto,
  SeasonRankingPlayerDto,
} from '../../../core/api/dto/season-ranking.dto';
import { SeasonContext } from '../../seasons/season-context';
import { HomeSeasonLeader, HomeSeasonMetrics } from './home-season.model';

export function normalizeHomeSeasonMetrics(
  context: SeasonContext,
  rankingDto: SeasonRankingDto,
): HomeSeasonMetrics {
  const summary = rankingDto?.summary;

  const seasonSlug = context.slug;
  const seasonName =
    getValidNonEmptyString(context.season?.name) ??
    getValidNonEmptyString(rankingDto?.season?.name) ??
    context.slug;
  const contextMode = context.mode;
  const generatedAt = getValidNonEmptyString(rankingDto?.generatedAt);

  const playersCount = safeNonNegativeInteger(summary?.players);
  const matchesCount = safeNonNegativeInteger(summary?.matches);
  const mapsCount = safeNonNegativeInteger(summary?.maps);
  const roundsCount = safeNonNegativeInteger(summary?.rounds);

  const validPlayers = extractValidPlayers(rankingDto?.players);
  const leader = validPlayers.length > 0 ? validPlayers[0] : null;
  const hasClassifiedPlayers = validPlayers.length > 0;

  return {
    seasonSlug,
    seasonName,
    contextMode,
    generatedAt,
    playersCount,
    matchesCount,
    mapsCount,
    roundsCount,
    leader,
    hasClassifiedPlayers,
  };
}

function extractValidPlayers(
  players?: SeasonRankingPlayerDto[] | null,
): HomeSeasonLeader[] {
  if (!Array.isArray(players) || players.length === 0) {
    return [];
  }

  const result: HomeSeasonLeader[] = [];

  for (const p of players) {
    if (!p || typeof p !== 'object') {
      continue;
    }

    const steamId = getValidNonEmptyString(p.steamid64);
    const name = getValidNonEmptyString(p.name);

    if (steamId && /^\d{17}$/.test(steamId) && name) {
      result.push({
        position: safePositiveInteger(p.rank, result.length + 1),
        steamId64: steamId,
        name,
        score: safeNumber(p.score, 0),
        wins: safeNonNegativeInteger(p.wins),
        losses: safeNonNegativeInteger(p.losses),
        kdRatio: safeNonNegativeNumber(p.kdRatio),
      });
    }
  }

  return result;
}

function getValidNonEmptyString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

function safeNonNegativeInteger(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  return 0;
}

function safePositiveInteger(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  return fallback;
}

function safeNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return fallback;
}

function safeNonNegativeNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }
  return 0;
}
