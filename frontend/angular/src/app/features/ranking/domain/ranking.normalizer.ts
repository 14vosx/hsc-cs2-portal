import { Ranking, RankingPlayer } from './ranking.model';

export function normalizeRanking(value: unknown): Ranking {
  if (!isRecord(value)) {
    return {
      generatedAt: null,
      completedMaps: 0,
      players: [],
      rankedPlayerCount: 0,
      leader: null,
    };
  }

  const generatedAt = parseGeneratedAt(ownDataProperty(value, 'generatedAt'));
  const completedMaps = parseCount(ownDataProperty(value, 'mapsFinalizados'));

  const rawPlayers = ownDataProperty(value, 'players');
  const playersList = asSafeArray(rawPlayers);
  const length = playersList !== null ? safeArrayLength(playersList) : null;

  const validPlayers: RankingPlayer[] = [];
  const seenSteamIds = new Set<string>();

  if (playersList !== null && length !== null) {
    for (let i = 0; i < length; i++) {
      const item = ownDataProperty(playersList, String(i));

      if (!isRecord(item)) {
        continue;
      }

      const steamId64 = extractSteamId64(item);
      if (!steamId64 || seenSteamIds.has(steamId64)) {
        continue;
      }

      seenSteamIds.add(steamId64);

      const player: RankingPlayer = {
        position: validPlayers.length + 1,
        steamId64,
        name: parseName(ownDataProperty(item, 'name')),
        matchesPlayed: parseCount(ownDataProperty(item, 'matchesPlayed')),
        mapsPlayed: parseCount(ownDataProperty(item, 'mapsPlayed')),
        roundsPlayed: parseCount(ownDataProperty(item, 'roundsPlayed')),
        wins: parseCount(ownDataProperty(item, 'wins')),
        losses: parseCount(ownDataProperty(item, 'losses')),
        kills: parseCount(ownDataProperty(item, 'kills')),
        deaths: parseCount(ownDataProperty(item, 'deaths')),
        assists: parseCount(ownDataProperty(item, 'assists')),
        kdRatio: parseMetric(ownDataProperty(item, 'kdRatio')),
        headshotPct: parseMetric(ownDataProperty(item, 'headshotPct')),
        adr: parseMetric(ownDataProperty(item, 'adr')),
        utilityDmgPerRound: parseMetric(ownDataProperty(item, 'utilityDmgPerRound')),
        killsPerRound: parseMetric(ownDataProperty(item, 'killsPerRound')),
        assistsPerRound: parseMetric(ownDataProperty(item, 'assistsPerRound')),
        deathsPerRound: parseMetric(ownDataProperty(item, 'deathsPerRound')),
        impactRating: parseMetric(ownDataProperty(item, 'impactRating')),
        winRate: parseMetric(ownDataProperty(item, 'winRate')),
        sampleWeight: parseMetric(ownDataProperty(item, 'sampleWeight')),
        score: parseMetric(ownDataProperty(item, 'score')),
      };

      validPlayers.push(player);
    }
  }

  return {
    generatedAt,
    completedMaps,
    players: validPlayers,
    rankedPlayerCount: validPlayers.length,
    leader: validPlayers[0] ?? null,
  };
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

function asSafeArray(value: unknown): readonly unknown[] | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  try {
    return Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function safeArrayLength(value: readonly unknown[]): number | null {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, 'length');

    if (!descriptor || !('value' in descriptor)) {
      return null;
    }

    const len = descriptor.value;
    if (typeof len === 'number' && Number.isSafeInteger(len) && len >= 0) {
      return len;
    }

    return null;
  } catch {
    return null;
  }
}

function ownDataProperty(record: object, key: PropertyKey): unknown {
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

function parseGeneratedAt(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function parseName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function extractSteamId64(item: Record<string, unknown>): string | null {
  const val1 = ownDataProperty(item, 'steamid64');
  const str1 = parseSteamIdVal(val1);
  if (str1 !== null) {
    return str1;
  }

  const val2 = ownDataProperty(item, 'steamId64');
  return parseSteamIdVal(val2);
}

function parseSteamIdVal(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (typeof value === 'number') {
    if (Number.isSafeInteger(value) && value > 0) {
      return String(value);
    }
  }

  return null;
}

function parseCount(value: unknown): number {
  const num = parseNumber(value);
  if (num === null || num < 0) {
    return 0;
  }

  return Math.floor(num);
}

function parseMetric(value: unknown): number {
  const num = parseNumber(value);
  if (num === null || num < 0) {
    return 0;
  }

  return num;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }

    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const num = Number(trimmed);
    if (!Number.isFinite(num)) {
      return null;
    }

    return num;
  }

  return null;
}
