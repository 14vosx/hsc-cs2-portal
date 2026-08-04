import type {
  MapDetail,
  MapLifetime,
  MapRecentMatch,
  MapRecentMatchScore,
  MapRecentMatchTeam,
  MapsIndex,
  MapSummary,
} from './map.model';

function asObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function parseString(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  return null;
}

function parseNonEmptyString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed !== '' ? trimmed : null;
  }
  return null;
}

function parseFiniteNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const num = Number(value);
    if (Number.isFinite(num)) {
      return num;
    }
  }
  return 0;
}

function parseNumberNullable(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const num = Number(value);
    if (Number.isFinite(num)) {
      return num;
    }
  }
  return null;
}

function parseIntegerNullable(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const num = Number(value);
    if (Number.isInteger(num)) {
      return num;
    }
  }
  return null;
}

export function normalizeMapsIndex(payload: unknown): MapsIndex | null {
  const root = asObject(payload);
  if (!root) {
    return null;
  }

  const generatedAt = typeof root['generatedAt'] === 'string' ? root['generatedAt'] : null;
  if (!generatedAt) {
    return null;
  }

  const rawMaps = root['maps'];
  if (!Array.isArray(rawMaps)) {
    return null;
  }

  const maps: MapSummary[] = [];

  for (const item of rawMaps) {
    const mapObj = asObject(item);
    if (!mapObj) {
      continue;
    }

    const name = parseNonEmptyString(mapObj['map'] ?? mapObj['name']);
    const lastPlayedAt = parseNonEmptyString(mapObj['lastPlayed'] ?? mapObj['lastPlayedAt']);
    if (!name || !lastPlayedAt) {
      continue;
    }

    const matches = parseFiniteNumber(mapObj['matches']);
    const rounds = parseFiniteNumber(mapObj['rounds']);
    const averageRoundsPerMatch = parseFiniteNumber(
      mapObj['avgRoundsPerMatch'] ?? mapObj['averageRoundsPerMatch']
    );

    maps.push({
      name,
      matches,
      rounds,
      averageRoundsPerMatch,
      lastPlayedAt,
    });
  }

  return {
    generatedAt,
    maps,
  };
}

export function normalizeMapDetail(payload: unknown): MapDetail | null {
  const root = asObject(payload);
  if (!root) {
    return null;
  }

  const generatedAt = typeof root['generatedAt'] === 'string' ? root['generatedAt'] : null;
  if (!generatedAt) {
    return null;
  }

  const name = parseNonEmptyString(root['map'] ?? root['name']);
  if (!name) {
    return null;
  }

  const lifetimeObj = asObject(root['lifetime']);
  if (!lifetimeObj) {
    return null;
  }

  const lastPlayedAt = parseNonEmptyString(
    lifetimeObj['lastPlayed'] ?? lifetimeObj['lastPlayedAt']
  );
  if (!lastPlayedAt) {
    return null;
  }

  const lifetime: MapLifetime = {
    matches: parseFiniteNumber(lifetimeObj['matches']),
    rounds: parseFiniteNumber(lifetimeObj['rounds']),
    averageRoundsPerMatch: parseFiniteNumber(
      lifetimeObj['avgRoundsPerMatch'] ?? lifetimeObj['averageRoundsPerMatch']
    ),
    lastPlayedAt,
  };

  const recentMatches: MapRecentMatch[] = [];
  const rawRecent = root['recentMatches'];
  if (Array.isArray(rawRecent)) {
    for (const rmItem of rawRecent) {
      const rmObj = asObject(rmItem);
      if (!rmObj) {
        continue;
      }

      const matchIdRaw = rmObj['matchid'] ?? rmObj['matchId'];
      const matchId = parseIntegerNullable(matchIdRaw);
      if (matchId === null) {
        continue;
      }

      const seriesType = parseString(rmObj['seriesType'] ?? rmObj['series_type']);
      const endedAt = parseString(rmObj['endedAt'] ?? rmObj['end_time']);
      const winner = parseString(rmObj['winner']);
      const mapNumber = parseIntegerNullable(rmObj['mapNumber'] ?? rmObj['mapnumber']);

      const team1Obj = asObject(rmObj['team1']);
      const team1: MapRecentMatchTeam = {
        name: parseString(team1Obj?.['name']),
        score: parseNumberNullable(team1Obj?.['score']),
      };

      const team2Obj = asObject(rmObj['team2']);
      const team2: MapRecentMatchTeam = {
        name: parseString(team2Obj?.['name']),
        score: parseNumberNullable(team2Obj?.['score']),
      };

      const mapScoreObj = asObject(rmObj['mapScore'] ?? rmObj['map_score']);
      const mapScore: MapRecentMatchScore = {
        team1: parseNumberNullable(mapScoreObj?.['team1']),
        team2: parseNumberNullable(mapScoreObj?.['team2']),
      };

      recentMatches.push({
        matchId,
        seriesType,
        endedAt,
        winner,
        team1,
        team2,
        mapNumber,
        mapScore,
      });
    }
  }

  return {
    generatedAt,
    name,
    lifetime,
    recentMatches,
  };
}
