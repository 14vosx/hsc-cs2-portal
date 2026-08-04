import {
  SeasonRanking,
  SeasonRankingPlayer,
  SeasonRankingPrizeEligibilityRules,
  SeasonRankingRules,
  SeasonRankingSeason,
  SeasonRankingSummary,
} from './season-ranking.model';

export function normalizeSeasonRanking(value: unknown): SeasonRanking | null {
  const container = asRecord(value);
  if (!container) {
    return null;
  }

  const seasonPayload = asRecord(getPropertyValue(container, 'season'));
  if (!seasonPayload) {
    return null;
  }

  const slug = parseTrimmedString(getPropertyValue(seasonPayload, 'slug'));
  if (!slug) {
    return null;
  }

  const season: SeasonRankingSeason = {
    slug,
    name: parseNullableString(getPropertyValue(seasonPayload, 'name')),
    description: parseNullableString(getPropertyValue(seasonPayload, 'description')),
    status: parseNullableString(getPropertyValue(seasonPayload, 'status')),
    startAt: pickFirstStringValue(seasonPayload, ['startAt', 'start_at']),
    endAt: pickFirstStringValue(seasonPayload, ['endAt', 'end_at']),
    coverImageUrl: pickFirstStringValue(seasonPayload, [
      'cover_image_url',
      'coverImageUrl',
      'image_url',
      'hero_image_url',
    ]),
  };

  const rulesPayload = asRecord(getPropertyValue(container, 'rules'));
  const rules: SeasonRankingRules = {
    minRoundsPerMap: pickFirstNonNegativeIntegerValue(rulesPayload, ['minRoundsPerMap', 'min_rounds_per_map']),
    rankingFormulaVersion: pickFirstStringValue(rulesPayload, ['rankingFormulaVersion', 'ranking_formula_version']),
    prizeEligibility: normalizePrizeEligibilityRules(
      rulesPayload
        ? (asRecord(getPropertyValue(rulesPayload, 'prizeEligibility')) ??
          asRecord(getPropertyValue(rulesPayload, 'prize_eligibility')))
        : null,
    ),
  };

  const summaryPayload = asRecord(getPropertyValue(container, 'summary'));
  const summary: SeasonRankingSummary = {
    matches: pickFirstNonNegativeIntegerValue(summaryPayload, ['matches']),
    maps: pickFirstNonNegativeIntegerValue(summaryPayload, ['maps']),
    rounds: pickFirstNonNegativeIntegerValue(summaryPayload, ['rounds']),
    players: pickFirstNonNegativeIntegerValue(summaryPayload, ['players']),
    eligiblePlayers: pickFirstNonNegativeIntegerValue(summaryPayload, ['eligiblePlayers', 'eligible_players']),
    lastMapEndedAt: pickFirstStringValue(summaryPayload, ['lastMapEndedAt', 'last_map_ended_at']),
  };

  const rawPlayersValue = getValueByAlias(container, ['players']);
  const rawTopPrizeCandidatesValue = getValueByAliasForArrays(container, ['topPrizeCandidates', 'top_prize_candidates']);
  const topPrizeCandidates = normalizePlayers(rawTopPrizeCandidatesValue);
  const players = normalizePlayers(rawPlayersValue);

  return {
    generatedAt: pickFirstStringValue(container, ['generatedAt', 'generated_at']),
    season,
    rules,
    summary,
    topPrizeCandidates,
    players,
  };
}

function normalizePrizeEligibilityRules(value: unknown): SeasonRankingPrizeEligibilityRules {
  const record = asRecord(value);
  if (!record) {
    return {
      minMapsPlayed: 0,
      minRoundsPlayed: 0,
    };
  }

  return {
    minMapsPlayed: pickFirstNonNegativeIntegerValue(record, ['minMapsPlayed', 'min_maps_played']),
    minRoundsPlayed: pickFirstNonNegativeIntegerValue(record, ['minRoundsPlayed', 'min_rounds_played']),
  };
}

function normalizePlayers(value: unknown): SeasonRankingPlayer[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: SeasonRankingPlayer[] = [];

  for (const item of value) {
    const record = asRecord(item);
    if (!record) {
      continue;
    }

    result.push(normalizePlayer(record));
  }

  return result;
}

function normalizePlayer(record: Record<string, unknown>): SeasonRankingPlayer {
  return {
    rank: pickFirstNonNegativeIntegerValue(record, ['rank']),
    prizeRank: pickFirstOptionalIntegerValue(record, ['prizeRank', 'prize_rank']),
    prizeEligible: pickFirstBooleanValue(record, ['prizeEligible', 'prize_eligible']),
    prizeEligibilityReason: pickFirstStringValue(record, ['prizeEligibilityReason', 'prize_eligibility_reason']),
    steamId64: pickFirstStringValue(record, ['steamId64', 'steamid64']),
    name: pickFirstStringValue(record, ['name']),
    avatarUrl: pickFirstStringValue(record, [
      'avatarUrl',
      'avatar_url',
      'steamAvatarUrl',
      'steam_avatar_url',
      'avatar',
    ]),
    matchesPlayed: pickFirstNonNegativeIntegerValue(record, ['matchesPlayed', 'matches_played']),
    mapsPlayed: pickFirstNonNegativeIntegerValue(record, ['mapsPlayed', 'maps_played']),
    roundsPlayed: pickFirstNonNegativeIntegerValue(record, ['roundsPlayed', 'rounds_played']),
    wins: pickFirstNonNegativeIntegerValue(record, ['wins']),
    losses: pickFirstNonNegativeIntegerValue(record, ['losses']),
    kills: pickFirstNonNegativeIntegerValue(record, ['kills']),
    deaths: pickFirstNonNegativeIntegerValue(record, ['deaths']),
    assists: pickFirstNonNegativeIntegerValue(record, ['assists']),
    kdRatio: pickFirstNonNegativeNumberValue(record, ['kdRatio', 'kd_ratio']),
    headshotPct: pickFirstNonNegativeNumberValue(record, ['headshotPct', 'headshot_pct']),
    adr: pickFirstNonNegativeNumberValue(record, ['adr']),
    utilityDmgPerRound: pickFirstNonNegativeNumberValue(record, ['utilityDmgPerRound', 'utility_dmg_per_round']),
    killsPerRound: pickFirstNonNegativeNumberValue(record, ['killsPerRound', 'kills_per_round']),
    assistsPerRound: pickFirstNonNegativeNumberValue(record, ['assistsPerRound', 'assists_per_round']),
    deathsPerRound: pickFirstNonNegativeNumberValue(record, ['deathsPerRound', 'deaths_per_round']),
    impactRating: pickFirstNonNegativeNumberValue(record, ['impactRating', 'impact_rating']),
    winRate: pickFirstNonNegativeNumberValue(record, ['winRate', 'win_rate']),
    sampleWeight: pickFirstNonNegativeNumberValue(record, ['sampleWeight', 'sample_weight']),
    score: pickFirstNonNegativeNumberValue(record, ['score']),
  };
}

function getValueByAlias(record: unknown, keys: readonly string[]): unknown {
  const container = asRecord(record);
  if (!container) {
    return undefined;
  }

  for (const key of keys) {
    const value = getPropertyValue(container, key);
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function getValueByAliasForArrays(record: unknown, keys: readonly string[]): unknown {
  const container = asRecord(record);
  if (!container) {
    return undefined;
  }

  for (const key of keys) {
    const value = getPropertyValue(container, key);
    if (Array.isArray(value)) {
      return value;
    }
  }

  return undefined;
}

function pickFirstStringValue(record: unknown, keys: readonly string[]): string | null {
  const container = asRecord(record);
  if (!container) {
    return null;
  }

  for (const key of keys) {
    const value = getPropertyValue(container, key);
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return null;
}

function pickFirstNonNegativeIntegerValue(record: unknown, keys: readonly string[]): number {
  const container = asRecord(record);
  if (!container) {
    return 0;
  }

  for (const key of keys) {
    const value = getPropertyValue(container, key);
    const parsed = parseFiniteNumber(value);
    if (parsed !== null && parsed >= 0) {
      return Math.floor(parsed);
    }
  }

  return 0;
}

function pickFirstOptionalIntegerValue(record: unknown, keys: readonly string[]): number | null {
  const container = asRecord(record);
  if (!container) {
    return null;
  }

  for (const key of keys) {
    const value = getPropertyValue(container, key);
    const parsed = parseFiniteNumber(value);
    if (parsed !== null && parsed >= 0) {
      return Math.floor(parsed);
    }
  }

  return null;
}

function pickFirstBooleanValue(record: unknown, keys: readonly string[]): boolean | null {
  const container = asRecord(record);
  if (!container) {
    return null;
  }

  for (const key of keys) {
    const value = getPropertyValue(container, key);
    if (value === true) {
      return true;
    }

    if (value === false) {
      return false;
    }
  }

  return null;
}

function pickFirstNonNegativeNumberValue(record: unknown, keys: readonly string[]): number {
  const container = asRecord(record);
  if (!container) {
    return 0;
  }

  for (const key of keys) {
    const value = getPropertyValue(container, key);
    const parsed = parseFiniteNumber(value);
    if (parsed !== null && parsed >= 0) {
      return parsed;
    }
  }

  return 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getPropertyValue(record: Record<string, unknown>, key: string): unknown {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    return descriptor?.value;
  } catch {
    return undefined;
  }
}

function parseNullableString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}
