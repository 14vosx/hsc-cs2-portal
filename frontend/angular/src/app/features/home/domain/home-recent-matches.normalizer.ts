import type {
  SeasonMatchesDto,
  SeasonMatchMapDto,
  SeasonMatchSummaryDto,
} from '../../../core/api/dto/season-matches.dto';
import type { HomeRecentMatch, HomeRecentMatchMap } from './home-season.model';

export function normalizeHomeRecentMatches(payload: SeasonMatchesDto): readonly HomeRecentMatch[] {
  if (!Array.isArray(payload.matches)) {
    throw new Error('Invalid season matches collection');
  }

  const matches = payload.matches.map((match, index) => normalizeMatch(match, index));
  return matches.slice(0, 3);
}

function normalizeMatch(match: SeasonMatchSummaryDto, index: number): HomeRecentMatch {
  if (!match || typeof match !== 'object') {
    throw new Error(`Invalid season match at index ${index}`);
  }
  if (!Array.isArray(match.maps)) {
    throw new Error(`Invalid maps for season match at index ${index}`);
  }

  return {
    matchId: requiredInteger(match.matchid, `matches[${index}].matchid`),
    seasonLastMapEndedAt: requiredNullableString(
      match.seasonLastMapEndedAt,
      `matches[${index}].seasonLastMapEndedAt`,
    ),
    winnerName: requiredNullableString(match.winner, `matches[${index}].winner`),
    team1Name: requiredNullableString(match.team1_name, `matches[${index}].team1_name`),
    team1Score: requiredInteger(match.team1_score, `matches[${index}].team1_score`),
    team2Name: requiredNullableString(match.team2_name, `matches[${index}].team2_name`),
    team2Score: requiredInteger(match.team2_score, `matches[${index}].team2_score`),
    maps: match.maps.map((map, mapIndex) => normalizeMap(map, index, mapIndex)),
  };
}

function normalizeMap(
  map: SeasonMatchMapDto,
  matchIndex: number,
  mapIndex: number,
): HomeRecentMatchMap {
  if (!map || typeof map !== 'object') {
    throw new Error(`Invalid map at matches[${matchIndex}].maps[${mapIndex}]`);
  }

  const name = nonEmptyString(map.mapname);
  if (!name) {
    throw new Error(`Invalid matches[${matchIndex}].maps[${mapIndex}].mapname`);
  }

  return {
    name,
    team1Score: requiredInteger(
      map.team1_score,
      `matches[${matchIndex}].maps[${mapIndex}].team1_score`,
    ),
    team2Score: requiredInteger(
      map.team2_score,
      `matches[${matchIndex}].maps[${mapIndex}].team2_score`,
    ),
  };
}

function requiredInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
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

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
