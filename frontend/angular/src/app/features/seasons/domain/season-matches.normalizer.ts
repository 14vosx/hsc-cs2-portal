import type {
  SeasonCompetitionRules,
  SeasonCompetitionSeason,
  SeasonCompetitionSummary,
} from './season-competition.model';
import type {
  SeasonMatches,
  SeasonMatchesComputed,
  SeasonMatchMap,
  SeasonMatchSummary,
  SeasonMatchTeamScore,
} from './season-matches.model';

export function normalizeSeasonMatches(payload: unknown): SeasonMatches | null {
  if (!isObject(payload)) {
    return null;
  }

  const generatedAt = readString(payload['generatedAt']);
  if (!generatedAt) {
    return null;
  }

  const season = normalizeSeason(payload['season']);
  if (!season) {
    return null;
  }

  const rules = normalizeRules(payload['rules']);
  if (!rules) {
    return null;
  }

  const summary = normalizeSummary(payload['summary']);
  if (!summary) {
    return null;
  }

  const computed = normalizeComputed(payload['computed']);
  if (!computed) {
    return null;
  }

  const rawMatches = payload['matches'];
  if (!Array.isArray(rawMatches)) {
    return null;
  }

  const matches: SeasonMatchSummary[] = [];

  for (const rawItem of rawMatches) {
    const match = normalizeSeasonMatchItem(rawItem);
    if (match) {
      matches.push(match);
    }
  }

  return {
    generatedAt,
    season,
    rules,
    summary,
    computed,
    matches,
  };
}

function normalizeSeason(raw: unknown): SeasonCompetitionSeason | null {
  if (!isObject(raw)) {
    return null;
  }

  const slug = readString(raw['slug']);
  if (!slug) {
    return null;
  }

  const name = readString(raw['name']);
  const description = readNullableString(raw['description']);
  const status = readNullableString(raw['status']);
  const startAt = readNullableString(raw['start_at']) ?? readNullableString(raw['startAt']);
  const endAt = readNullableString(raw['end_at']) ?? readNullableString(raw['endAt']);
  const coverImageUrl =
    readNullableString(raw['cover_image_url']) ??
    readNullableString(raw['coverImageUrl']) ??
    readNullableString(raw['image_url']) ??
    readNullableString(raw['hero_image_url']);

  return {
    slug,
    name,
    description,
    status,
    startAt,
    endAt,
    coverImageUrl,
  };
}

function normalizeRules(raw: unknown): SeasonCompetitionRules | null {
  if (!isObject(raw)) {
    return null;
  }

  const minRounds = readNonNegativeInteger(raw['minRoundsPerMap']);
  return {
    minRoundsPerMap: minRounds ?? 0,
    seasonMembership: readNullableString(raw['seasonMembership']),
    matchDetailEndpoint: readNullableString(raw['matchDetailEndpoint']),
    mapDetailEndpoint: readNullableString(raw['mapDetailEndpoint']),
  };
}

function normalizeSummary(raw: unknown): SeasonCompetitionSummary | null {
  if (!isObject(raw)) {
    return null;
  }

  return {
    matches: readNonNegativeInteger(raw['matches']) ?? 0,
    maps: readNonNegativeInteger(raw['maps']) ?? 0,
    rounds: readNonNegativeInteger(raw['rounds']) ?? 0,
    players: readNonNegativeInteger(raw['players']) ?? 0,
    lastMapEndedAt: readNullableString(raw['lastMapEndedAt']),
  };
}

function normalizeComputed(raw: unknown): SeasonMatchesComputed | null {
  if (!isObject(raw)) {
    return null;
  }

  if (!Object.prototype.hasOwnProperty.call(raw, 'firstMapStartedAt')) {
    return null;
  }

  const val = raw['firstMapStartedAt'];
  if (val === null) {
    return { firstMapStartedAt: null };
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    return { firstMapStartedAt: trimmed.length > 0 ? trimmed : null };
  }

  return null;
}

function normalizeSeasonMatchItem(raw: unknown): SeasonMatchSummary | null {
  if (!isObject(raw)) {
    return null;
  }

  const id = readPositiveInteger(raw['matchid']) ?? readPositiveInteger(raw['id']);
  if (id === null) {
    return null;
  }

  const team1ScoreVal =
    readNonNegativeInteger(raw['team1_score']) ??
    readNonNegativeInteger(raw['team1Score']) ??
    (isObject(raw['team1']) ? readNonNegativeInteger(raw['team1']['score']) : null);

  const team2ScoreVal =
    readNonNegativeInteger(raw['team2_score']) ??
    readNonNegativeInteger(raw['team2Score']) ??
    (isObject(raw['team2']) ? readNonNegativeInteger(raw['team2']['score']) : null);

  if (team1ScoreVal === null || team2ScoreVal === null) {
    return null;
  }

  const seasonMapCount = readNonNegativeInteger(raw['seasonMapCount']);
  const seasonRounds = readNonNegativeInteger(raw['seasonRounds']);
  if (seasonMapCount === null || seasonRounds === null) {
    return null;
  }

  const rawMaps = raw['maps'];
  if (!Array.isArray(rawMaps)) {
    return null;
  }

  const maps: SeasonMatchMap[] = [];
  for (const rawMapItem of rawMaps) {
    const mapObj = normalizeSeasonMatchMapItem(rawMapItem);
    if (mapObj) {
      maps.push(mapObj);
    }
  }

  const team1Name =
    readNullableString(raw['team1_name']) ??
    readNullableString(raw['team1Name']) ??
    (isObject(raw['team1']) ? readNullableString(raw['team1']['name']) : null);

  const team2Name =
    readNullableString(raw['team2_name']) ??
    readNullableString(raw['team2Name']) ??
    (isObject(raw['team2']) ? readNullableString(raw['team2']['name']) : null);

  const team1: SeasonMatchTeamScore = {
    name: team1Name,
    score: team1ScoreVal,
  };

  const team2: SeasonMatchTeamScore = {
    name: team2Name,
    score: team2ScoreVal,
  };

  const startedAt = readNullableString(raw['start_time']) ?? readNullableString(raw['startedAt']);
  const endedAt = readNullableString(raw['end_time']) ?? readNullableString(raw['endedAt']);
  const winner = readNullableString(raw['winner']);
  const seriesType = readNullableString(raw['series_type']) ?? readNullableString(raw['seriesType']);
  const serverIp = readNullableString(raw['server_ip']) ?? readNullableString(raw['serverIp']);
  const seasonFirstMapStartedAt = readNullableString(raw['seasonFirstMapStartedAt']);
  const seasonLastMapEndedAt = readNullableString(raw['seasonLastMapEndedAt']);

  return {
    id,
    startedAt,
    endedAt,
    winner,
    seriesType,
    team1,
    team2,
    serverIp,
    maps,
    seasonMapCount,
    seasonRounds,
    seasonFirstMapStartedAt,
    seasonLastMapEndedAt,
  };
}

function normalizeSeasonMatchMapItem(raw: unknown): SeasonMatchMap | null {
  if (!isObject(raw)) {
    return null;
  }

  const mapNumber = readInteger(raw['mapnumber']) ?? readInteger(raw['mapNumber']);
  if (mapNumber === null) {
    return null;
  }

  const name = readString(raw['mapname']) ?? readString(raw['name']);
  if (!name) {
    return null;
  }

  const team1Score = readNonNegativeInteger(raw['team1_score']) ?? readNonNegativeInteger(raw['team1Score']);
  const team2Score = readNonNegativeInteger(raw['team2_score']) ?? readNonNegativeInteger(raw['team2Score']);
  const rounds = readNonNegativeInteger(raw['rounds']);

  if (team1Score === null || team2Score === null || rounds === null) {
    return null;
  }

  const startedAt = readNullableString(raw['start_time']) ?? readNullableString(raw['startedAt']);
  const endedAt = readNullableString(raw['end_time']) ?? readNullableString(raw['endedAt']);
  const winner = readNullableString(raw['winner']);

  return {
    mapNumber,
    startedAt,
    endedAt,
    winner,
    name,
    team1Score,
    team2Score,
    rounds,
  };
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function readString(val: unknown): string | null {
  if (typeof val !== 'string') {
    return null;
  }
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readNullableString(val: unknown): string | null {
  if (typeof val !== 'string') {
    return null;
  }
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readInteger(val: unknown): number | null {
  if (typeof val === 'number' && Number.isInteger(val)) {
    return val;
  }
  return null;
}

function readPositiveInteger(val: unknown): number | null {
  if (typeof val === 'number' && Number.isInteger(val) && val > 0) {
    return val;
  }
  return null;
}

function readNonNegativeInteger(val: unknown): number | null {
  if (typeof val === 'number' && Number.isInteger(val) && val >= 0) {
    return val;
  }
  return null;
}
