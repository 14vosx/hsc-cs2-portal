import type {
  BunkerCompetitiveProfile,
  BunkerCurrentSeason,
  BunkerMapPerformance,
  BunkerPlayerStats,
  BunkerRecentMap,
  BunkerSeasonPlayer,
  BunkerSummary,
  BunkerTimelineItem,
} from '../domain/bunker.model';

export function normalizeBunkerSummary(payload: unknown): BunkerSummary | null {
  if (!isRecord(payload)) {
    return null;
  }

  const rawData = ownDataProperty(payload, 'data');
  const data = isRecord(rawData) ? rawData : null;
  const rawBunker = data ? ownDataProperty(data, 'bunker') : null;
  const bunker = isRecord(rawBunker) ? rawBunker : payload;

  const rawCurrentSeason =
    (data && ownDataProperty(data, 'currentSeason')) ?? ownDataProperty(bunker, 'currentSeason');
  const rawSeasonPlayer =
    (data && ownDataProperty(data, 'seasonPlayer')) ?? ownDataProperty(bunker, 'seasonPlayer');
  const rawCompetitiveProfile =
    (data && ownDataProperty(data, 'competitiveProfile')) ??
    ownDataProperty(bunker, 'competitiveProfile');
  const rawResponsePlayer = data ? ownDataProperty(data, 'player') : null;

  const currentSeason = normalizeCurrentSeason(rawCurrentSeason);
  const seasonPlayer = normalizeSeasonPlayer(rawSeasonPlayer);
  const competitiveProfile = normalizeCompetitiveProfile(
    rawCompetitiveProfile,
    rawResponsePlayer,
  );

  const status = optionalTrimmedString(ownDataProperty(bunker, 'status'));
  const seasonFirst = optionalBoolean(ownDataProperty(bunker, 'seasonFirst'));
  const statsAvailable = optionalBoolean(ownDataProperty(bunker, 'statsAvailable'));

  if (
    status === null &&
    seasonFirst === null &&
    statsAvailable === null &&
    currentSeason === null &&
    seasonPlayer === null &&
    competitiveProfile === null
  ) {
    return null;
  }

  return {
    status,
    seasonFirst,
    statsAvailable,
    currentSeason,
    seasonPlayer,
    competitiveProfile,
  };
}

function normalizeCurrentSeason(currentSeason: unknown): BunkerCurrentSeason | null {
  if (!isRecord(currentSeason)) {
    return null;
  }

  const rawScope = ownDataProperty(currentSeason, 'scope');
  const scopeRecord = isRecord(rawScope) ? rawScope : null;
  const scope = scopeRecord
    ? {
        startAt: optionalTrimmedString(ownDataProperty(scopeRecord, 'startAt')),
        endAt: optionalTrimmedString(ownDataProperty(scopeRecord, 'endAt')),
      }
    : null;

  const slug = optionalTrimmedString(ownDataProperty(currentSeason, 'slug'));
  const name = optionalTrimmedString(ownDataProperty(currentSeason, 'name'));
  const status = optionalTrimmedString(ownDataProperty(currentSeason, 'status'));

  if (!slug && !name && !status && !scope) {
    return null;
  }

  return {
    slug,
    name,
    status,
    scope,
  };
}

function normalizeCompetitiveProfile(
  competitiveProfile: unknown,
  responsePlayer: unknown,
): BunkerCompetitiveProfile | null {
  if (!isRecord(competitiveProfile) && !isRecord(responsePlayer)) {
    return null;
  }

  const profile = isRecord(competitiveProfile) ? competitiveProfile : {};
  const player = isRecord(responsePlayer) ? responsePlayer : {};
  const lifetime = normalizeCompetitiveLifetime(ownDataProperty(profile, 'lifetime'));

  const steamId64 = optionalTrimmedString(
    ownDataProperty(profile, 'steamid64') ??
      ownDataProperty(profile, 'steamId64') ??
      ownDataProperty(player, 'steamid64') ??
      ownDataProperty(player, 'steamId64'),
  );
  const name = optionalTrimmedString(
    ownDataProperty(profile, 'name') ?? ownDataProperty(player, 'displayName'),
  );
  const avatarMedium = optionalTrimmedString(
    ownDataProperty(profile, 'avatarMedium') ?? ownDataProperty(player, 'avatarMedium'),
  );
  const steamProfileUrl = optionalTrimmedString(
    ownDataProperty(profile, 'steamProfileUrl') ?? ownDataProperty(player, 'steamProfileUrl'),
  );
  const generatedAt = optionalTrimmedString(ownDataProperty(profile, 'generatedAt'));

  if (
    !generatedAt &&
    !steamId64 &&
    !name &&
    !avatarMedium &&
    !steamProfileUrl &&
    !lifetime
  ) {
    return null;
  }

  return {
    generatedAt,
    steamId64,
    name,
    avatarMedium,
    steamProfileUrl,
    lifetime,
  };
}

function normalizeCompetitiveLifetime(lifetime: unknown): BunkerPlayerStats | null {
  if (!isRecord(lifetime)) {
    return null;
  }

  const stats = extractStats(lifetime);

  if (!Object.values(stats).some(isFiniteNumber)) {
    return null;
  }

  return stats;
}

function normalizeSeasonPlayer(seasonPlayer: unknown): BunkerSeasonPlayer | null {
  if (!isRecord(seasonPlayer)) {
    return null;
  }

  const name = optionalTrimmedString(ownDataProperty(seasonPlayer, 'name'));
  const steamId64 = optionalTrimmedString(
    ownDataProperty(seasonPlayer, 'steamid64') ?? ownDataProperty(seasonPlayer, 'steamId64'),
  );
  const generatedAt = optionalTrimmedString(ownDataProperty(seasonPlayer, 'generatedAt'));
  const summary = normalizeSeasonPlayerSummary(ownDataProperty(seasonPlayer, 'summary'));
  const byMap = normalizeSeasonPlayerByMap(ownDataProperty(seasonPlayer, 'byMap'));
  const recentMaps = normalizeSeasonPlayerRecentMaps(
    ownDataProperty(seasonPlayer, 'recentMaps'),
  );
  const timeline = normalizeSeasonPlayerTimeline(ownDataProperty(seasonPlayer, 'timeline'));

  if (
    !name &&
    !steamId64 &&
    !generatedAt &&
    !summary &&
    byMap.length === 0 &&
    recentMaps.length === 0 &&
    timeline.length === 0
  ) {
    return null;
  }

  return {
    name,
    steamId64,
    generatedAt,
    summary,
    byMap,
    recentMaps,
    timeline,
  };
}

function normalizeSeasonPlayerSummary(summary: unknown): BunkerPlayerStats | null {
  return normalizeCompetitiveLifetime(summary);
}

function normalizeSeasonPlayerByMap(byMap: unknown): readonly BunkerMapPerformance[] {
  if (!Array.isArray(byMap)) {
    return [];
  }

  return byMap
    .map((item) => normalizeSeasonPlayerMap(item))
    .filter((item): item is BunkerMapPerformance => item !== null)
    .slice(0, 6);
}

function normalizeSeasonPlayerMap(item: unknown): BunkerMapPerformance | null {
  if (!isRecord(item)) {
    return null;
  }

  const mapName = optionalTrimmedString(
    ownDataProperty(item, 'mapName') ??
      ownDataProperty(item, 'mapname') ??
      ownDataProperty(item, 'map'),
  );

  const mapPerformance: BunkerMapPerformance = {
    mapName,
    mapsPlayed: optionalNumber(ownDataProperty(item, 'mapsPlayed')),
    matchesPlayed: optionalNumber(ownDataProperty(item, 'matchesPlayed')),
    wins: optionalNumber(ownDataProperty(item, 'wins')),
    losses: optionalNumber(ownDataProperty(item, 'losses')),
    winRate: optionalNumber(ownDataProperty(item, 'winRate')),
    kdRatio: optionalNumber(ownDataProperty(item, 'kdRatio')),
    adr: optionalNumber(ownDataProperty(item, 'adr')),
    impactRating: optionalNumber(ownDataProperty(item, 'impactRating')),
    roundsPlayed: optionalNumber(ownDataProperty(item, 'roundsPlayed')),
    kills: optionalNumber(ownDataProperty(item, 'kills')),
    deaths: optionalNumber(ownDataProperty(item, 'deaths')),
    assists: optionalNumber(ownDataProperty(item, 'assists')),
    headshotPct: optionalNumber(ownDataProperty(item, 'headshotPct')),
    accuracy: optionalNumber(ownDataProperty(item, 'accuracy')),
    utilityDmgPerRound: optionalNumber(ownDataProperty(item, 'utilityDmgPerRound')),
    entryWinRate: optionalNumber(ownDataProperty(item, 'entryWinRate')),
    enemy2ks: optionalNumber(ownDataProperty(item, 'enemy2ks')),
    enemy3ks: optionalNumber(ownDataProperty(item, 'enemy3ks')),
    enemy4ks: optionalNumber(ownDataProperty(item, 'enemy4ks')),
    enemy5ks: optionalNumber(ownDataProperty(item, 'enemy5ks')),
  };

  if (!mapName && !hasMapStats(mapPerformance)) {
    return null;
  }

  return mapPerformance;
}

function normalizeSeasonPlayerRecentMaps(recentMaps: unknown): readonly BunkerRecentMap[] {
  if (!Array.isArray(recentMaps)) {
    return [];
  }

  return recentMaps
    .map((item) => normalizeSeasonPlayerRecentMap(item))
    .filter((item): item is BunkerRecentMap => item !== null)
    .slice(0, 5);
}

function normalizeSeasonPlayerRecentMap(item: unknown): BunkerRecentMap | null {
  if (!isRecord(item)) {
    return null;
  }

  const mapName = optionalTrimmedString(
    ownDataProperty(item, 'mapName') ??
      ownDataProperty(item, 'mapname') ??
      ownDataProperty(item, 'map'),
  );
  const startedAt = optionalTrimmedString(
    ownDataProperty(item, 'startedAt') ??
      ownDataProperty(item, 'startTime') ??
      ownDataProperty(item, 'start_time'),
  );
  const matchId = optionalTrimmedString(
    ownDataProperty(item, 'matchId') ?? ownDataProperty(item, 'matchid'),
  );
  const mapNumber = optionalNumber(
    ownDataProperty(item, 'mapNumber') ?? ownDataProperty(item, 'mapnumber'),
  );
  const result = optionalTrimmedString(
    ownDataProperty(item, 'result') ?? ownDataProperty(item, 'outcome'),
  );
  const outcome = optionalTrimmedString(ownDataProperty(item, 'outcome'));
  const score = optionalTrimmedString(ownDataProperty(item, 'score'));
  const team = optionalTrimmedString(ownDataProperty(item, 'team'));
  const winner = optionalTrimmedString(ownDataProperty(item, 'winner'));
  const isWin = optionalBoolean(ownDataProperty(item, 'isWin'));

  const team1Score = optionalNumber(
    ownDataProperty(item, 'team1Score') ?? ownDataProperty(item, 'team1_score'),
  );
  const team2Score = optionalNumber(
    ownDataProperty(item, 'team2Score') ?? ownDataProperty(item, 'team2_score'),
  );
  const utilityDamage = optionalNumber(
    ownDataProperty(item, 'utilityDamage') ?? ownDataProperty(item, 'utility_damage'),
  );
  const headShotKills = optionalNumber(
    ownDataProperty(item, 'headShotKills') ?? ownDataProperty(item, 'head_shot_kills'),
  );
  const entryCount = optionalNumber(
    ownDataProperty(item, 'entryCount') ?? ownDataProperty(item, 'entry_count'),
  );
  const entryWins = optionalNumber(
    ownDataProperty(item, 'entryWins') ?? ownDataProperty(item, 'entry_wins'),
  );
  const v1Count = optionalNumber(
    ownDataProperty(item, 'v1Count') ?? ownDataProperty(item, 'v1_count'),
  );
  const v1Wins = optionalNumber(
    ownDataProperty(item, 'v1Wins') ?? ownDataProperty(item, 'v1_wins'),
  );
  const v2Count = optionalNumber(
    ownDataProperty(item, 'v2Count') ?? ownDataProperty(item, 'v2_count'),
  );
  const v2Wins = optionalNumber(
    ownDataProperty(item, 'v2Wins') ?? ownDataProperty(item, 'v2_wins'),
  );
  const shotsFiredTotal = optionalNumber(
    ownDataProperty(item, 'shotsFiredTotal') ?? ownDataProperty(item, 'shots_fired_total'),
  );
  const shotsOnTargetTotal = optionalNumber(
    ownDataProperty(item, 'shotsOnTargetTotal') ?? ownDataProperty(item, 'shots_on_target_total'),
  );

  const recentMap: BunkerRecentMap = {
    mapName,
    startedAt,
    matchId,
    mapNumber,
    result,
    outcome,
    score,
    team,
    winner,
    isWin,
    team1Score,
    team2Score,
    rounds: optionalNumber(ownDataProperty(item, 'rounds')),
    damage: optionalNumber(ownDataProperty(item, 'damage')),
    utilityDamage,
    headShotKills,
    entryCount,
    entryWins,
    v1Count,
    v1Wins,
    v2Count,
    v2Wins,
    enemy2ks: optionalNumber(ownDataProperty(item, 'enemy2ks')),
    enemy3ks: optionalNumber(ownDataProperty(item, 'enemy3ks')),
    enemy4ks: optionalNumber(ownDataProperty(item, 'enemy4ks')),
    enemy5ks: optionalNumber(ownDataProperty(item, 'enemy5ks')),
    shotsFiredTotal,
    shotsOnTargetTotal,
    kills: optionalNumber(ownDataProperty(item, 'kills')),
    deaths: optionalNumber(ownDataProperty(item, 'deaths')),
    assists: optionalNumber(ownDataProperty(item, 'assists')),
    kdRatio: optionalNumber(ownDataProperty(item, 'kdRatio')),
    adr: optionalNumber(ownDataProperty(item, 'adr')),
    impactRating: optionalNumber(ownDataProperty(item, 'impactRating')),
  };

  if (!hasRecentMapIdentity(recentMap) && !hasRecentMapStats(recentMap)) {
    return null;
  }

  return recentMap;
}

function normalizeSeasonPlayerTimeline(timeline: unknown): readonly BunkerTimelineItem[] {
  if (!Array.isArray(timeline)) {
    return [];
  }

  return timeline
    .map((item) => normalizeSeasonPlayerTimelineItem(item))
    .filter((item): item is BunkerTimelineItem => item !== null)
    .slice(0, 8);
}

function normalizeSeasonPlayerTimelineItem(item: unknown): BunkerTimelineItem | null {
  if (!isRecord(item)) {
    return null;
  }

  const at = optionalTrimmedString(
    ownDataProperty(item, 'at') ??
      ownDataProperty(item, 'timestamp') ??
      ownDataProperty(item, 'startedAt') ??
      ownDataProperty(item, 'startTime') ??
      ownDataProperty(item, 'start_time'),
  );
  const event = optionalTrimmedString(
    ownDataProperty(item, 'event') ?? ownDataProperty(item, 'type'),
  );
  const mapName = optionalTrimmedString(
    ownDataProperty(item, 'mapName') ??
      ownDataProperty(item, 'mapname') ??
      ownDataProperty(item, 'map'),
  );
  const matchId = optionalTrimmedString(
    ownDataProperty(item, 'matchId') ?? ownDataProperty(item, 'matchid'),
  );
  const mapNumber = optionalNumber(
    ownDataProperty(item, 'mapNumber') ?? ownDataProperty(item, 'mapnumber'),
  );
  const result = optionalTrimmedString(
    ownDataProperty(item, 'result') ?? ownDataProperty(item, 'outcome'),
  );
  const score = optionalTrimmedString(ownDataProperty(item, 'score'));

  const timelineItem: BunkerTimelineItem = {
    at,
    event,
    mapName,
    matchId,
    mapNumber,
    result,
    score,
    kills: optionalNumber(ownDataProperty(item, 'kills')),
    deaths: optionalNumber(ownDataProperty(item, 'deaths')),
    assists: optionalNumber(ownDataProperty(item, 'assists')),
    kdRatio: optionalNumber(ownDataProperty(item, 'kdRatio')),
    adr: optionalNumber(ownDataProperty(item, 'adr')),
    impactRating: optionalNumber(ownDataProperty(item, 'impactRating')),
  };

  if (!hasTimelineIdentity(timelineItem) && !hasTimelineStats(timelineItem)) {
    return null;
  }

  return timelineItem;
}

function extractStats(record: Record<string, unknown>): BunkerPlayerStats {
  return {
    mapsPlayed: optionalNumber(ownDataProperty(record, 'mapsPlayed')),
    matchesPlayed: optionalNumber(ownDataProperty(record, 'matchesPlayed')),
    wins: optionalNumber(ownDataProperty(record, 'wins')),
    losses: optionalNumber(ownDataProperty(record, 'losses')),
    winRate: optionalNumber(ownDataProperty(record, 'winRate')),
    kdRatio: optionalNumber(ownDataProperty(record, 'kdRatio')),
    adr: optionalNumber(ownDataProperty(record, 'adr')),
    impactRating: optionalNumber(ownDataProperty(record, 'impactRating')),
    kills: optionalNumber(ownDataProperty(record, 'kills')),
    deaths: optionalNumber(ownDataProperty(record, 'deaths')),
    assists: optionalNumber(ownDataProperty(record, 'assists')),
    roundsPlayed: optionalNumber(ownDataProperty(record, 'roundsPlayed')),
    headshotPct: optionalNumber(ownDataProperty(record, 'headshotPct')),
    accuracy: optionalNumber(ownDataProperty(record, 'accuracy')),
    utilityDmgPerRound: optionalNumber(ownDataProperty(record, 'utilityDmgPerRound')),
    killsPerRound: optionalNumber(ownDataProperty(record, 'killsPerRound')),
    assistsPerRound: optionalNumber(ownDataProperty(record, 'assistsPerRound')),
    deathsPerRound: optionalNumber(ownDataProperty(record, 'deathsPerRound')),
    entryWinRate: optionalNumber(ownDataProperty(record, 'entryWinRate')),
    v1Count: optionalNumber(ownDataProperty(record, 'v1Count')),
    v1Wins: optionalNumber(ownDataProperty(record, 'v1Wins')),
    v1WinRate: optionalNumber(ownDataProperty(record, 'v1WinRate')),
    v2Count: optionalNumber(ownDataProperty(record, 'v2Count')),
    v2Wins: optionalNumber(ownDataProperty(record, 'v2Wins')),
    v2WinRate: optionalNumber(ownDataProperty(record, 'v2WinRate')),
    enemy2ks: optionalNumber(ownDataProperty(record, 'enemy2ks')),
    enemy3ks: optionalNumber(ownDataProperty(record, 'enemy3ks')),
    enemy4ks: optionalNumber(ownDataProperty(record, 'enemy4ks')),
    enemy5ks: optionalNumber(ownDataProperty(record, 'enemy5ks')),
    sampleWeight: optionalNumber(ownDataProperty(record, 'sampleWeight')),
    score: optionalNumber(ownDataProperty(record, 'score')),
  };
}

function hasMapStats(item: BunkerMapPerformance): boolean {
  return [
    item.mapsPlayed,
    item.matchesPlayed,
    item.wins,
    item.losses,
    item.winRate,
    item.kdRatio,
    item.adr,
    item.impactRating,
    item.roundsPlayed,
    item.kills,
    item.deaths,
    item.assists,
    item.headshotPct,
    item.accuracy,
    item.utilityDmgPerRound,
    item.entryWinRate,
    item.enemy2ks,
    item.enemy3ks,
    item.enemy4ks,
    item.enemy5ks,
  ].some(isFiniteNumber);
}

function hasRecentMapIdentity(item: BunkerRecentMap): boolean {
  return [
    item.mapName,
    item.startedAt,
    item.matchId,
    item.result,
    item.outcome,
    item.score,
    item.team,
    item.winner,
  ].some((val) => Boolean(val));
}

function hasRecentMapStats(item: BunkerRecentMap): boolean {
  return [
    item.mapNumber,
    item.kills,
    item.deaths,
    item.assists,
    item.kdRatio,
    item.adr,
    item.impactRating,
    item.team1Score,
    item.team2Score,
    item.rounds,
    item.damage,
    item.utilityDamage,
    item.headShotKills,
    item.entryCount,
    item.entryWins,
    item.v1Count,
    item.v1Wins,
    item.v2Count,
    item.v2Wins,
    item.enemy2ks,
    item.enemy3ks,
    item.enemy4ks,
    item.enemy5ks,
    item.shotsFiredTotal,
    item.shotsOnTargetTotal,
  ].some(isFiniteNumber);
}

function hasTimelineIdentity(item: BunkerTimelineItem): boolean {
  return [item.at, item.event, item.mapName, item.matchId, item.result, item.score].some(
    (val) => Boolean(val),
  );
}

function hasTimelineStats(item: BunkerTimelineItem): boolean {
  return [
    item.mapNumber,
    item.kills,
    item.deaths,
    item.assists,
    item.kdRatio,
    item.adr,
    item.impactRating,
  ].some(isFiniteNumber);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  try {
    return !Array.isArray(value);
  } catch {
    return false;
  }
}

function ownDataProperty(record: Record<string, unknown>, key: string): unknown {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);

    if (!descriptor || !('value' in descriptor)) {
      return undefined;
    }

    return descriptor.value;
  } catch {
    return undefined;
  }
}

function optionalTrimmedString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function optionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function optionalBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }

    return null;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'win', 'won', 'vitória', 'vitoria'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'loss', 'lost', 'derrota'].includes(normalized)) {
      return false;
    }
  }

  return null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
