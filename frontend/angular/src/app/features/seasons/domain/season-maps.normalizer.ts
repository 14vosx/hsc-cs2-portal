import type {
  SeasonCompetitionRules,
  SeasonCompetitionSeason,
  SeasonCompetitionSummary,
} from './season-competition.model';
import type {
  SeasonMaps,
  SeasonMapsComputed,
  SeasonMapSummary,
} from './season-maps.model';

export function normalizeSeasonMaps(payload: unknown): SeasonMaps | null {
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

  const rawMaps = payload['maps'];
  if (!Array.isArray(rawMaps)) {
    return null;
  }

  const maps: SeasonMapSummary[] = [];

  for (const rawItem of rawMaps) {
    const item = normalizeSeasonMapItem(rawItem);
    if (item) {
      maps.push(item);
    }
  }

  return {
    generatedAt,
    season,
    rules,
    summary,
    computed,
    maps,
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

function normalizeComputed(raw: unknown): SeasonMapsComputed | null {
  if (!isObject(raw)) {
    return null;
  }

  const distinctMaps = readNonNegativeInteger(raw['distinctMaps']);
  if (distinctMaps === null) {
    return null;
  }

  return { distinctMaps };
}

function normalizeSeasonMapItem(raw: unknown): SeasonMapSummary | null {
  if (!isObject(raw)) {
    return null;
  }

  const name = readString(raw['map']) ?? readString(raw['name']);
  if (!name) {
    return null;
  }

  const matches = readNonNegativeInteger(raw['matches']);
  const rounds = readNonNegativeInteger(raw['rounds']);
  const avgRounds =
    readFiniteNonNegativeNumber(raw['avgRoundsPerMatch']) ??
    readFiniteNonNegativeNumber(raw['averageRoundsPerMatch']);

  if (matches === null || rounds === null || avgRounds === null) {
    return null;
  }

  const lastPlayedAt =
    readNullableString(raw['lastPlayed']) ?? readNullableString(raw['lastPlayedAt']);

  return {
    name,
    matches,
    rounds,
    averageRoundsPerMatch: avgRounds,
    lastPlayedAt,
  };
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
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

function readNonNegativeInteger(val: unknown): number | null {
  if (typeof val === 'number' && Number.isInteger(val) && val >= 0) {
    return val;
  }
  return null;
}

function readFiniteNonNegativeNumber(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
    return val;
  }
  return null;
}
