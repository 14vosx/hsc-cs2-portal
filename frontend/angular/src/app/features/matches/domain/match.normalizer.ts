import type {
  MatchAggregatePlayer,
  MatchAggregateTeam,
  MatchComputed,
  MatchDetail,
  MatchDetailMap,
  MatchesIndex,
  MatchHeader,
  MatchMapSummary,
  MatchPlayer,
  MatchPlayerStats,
  MatchSummary,
  MatchTeam,
} from './match.model';

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

function parseSteamId64(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed !== '' ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
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

function parseStatNumber(value: unknown): number {
  const num = parseNumberNullable(value);
  return num !== null ? num : 0;
}

function normalizePlayerStats(obj: Record<string, unknown> | null): MatchPlayerStats {
  const o = obj ?? {};
  return {
    kills: parseStatNumber(o['kills']),
    deaths: parseStatNumber(o['deaths']),
    damage: parseStatNumber(o['damage']),
    assists: parseStatNumber(o['assists']),
    enemy5Ks: parseStatNumber(o['enemy5ks'] ?? o['enemy5Ks']),
    enemy4Ks: parseStatNumber(o['enemy4ks'] ?? o['enemy4Ks']),
    enemy3Ks: parseStatNumber(o['enemy3ks'] ?? o['enemy3Ks']),
    enemy2Ks: parseStatNumber(o['enemy2ks'] ?? o['enemy2Ks']),
    utilityCount: parseStatNumber(o['utility_count'] ?? o['utilityCount']),
    utilityDamage: parseStatNumber(o['utility_damage'] ?? o['utilityDamage']),
    utilitySuccesses: parseStatNumber(o['utility_successes'] ?? o['utilitySuccesses']),
    utilityEnemies: parseStatNumber(o['utility_enemies'] ?? o['utilityEnemies']),
    flashCount: parseStatNumber(o['flash_count'] ?? o['flashCount']),
    flashSuccesses: parseStatNumber(o['flash_successes'] ?? o['flashSuccesses']),
    healthPointsRemovedTotal: parseStatNumber(
      o['health_points_removed_total'] ?? o['healthPointsRemovedTotal']
    ),
    healthPointsDealtTotal: parseStatNumber(
      o['health_points_dealt_total'] ?? o['healthPointsDealtTotal']
    ),
    shotsFiredTotal: parseStatNumber(o['shots_fired_total'] ?? o['shotsFiredTotal']),
    shotsOnTargetTotal: parseStatNumber(o['shots_on_target_total'] ?? o['shotsOnTargetTotal']),
    v1Count: parseStatNumber(o['v1_count'] ?? o['v1Count']),
    v1Wins: parseStatNumber(o['v1_wins'] ?? o['v1Wins']),
    v2Count: parseStatNumber(o['v2_count'] ?? o['v2Count']),
    v2Wins: parseStatNumber(o['v2_wins'] ?? o['v2Wins']),
    entryCount: parseStatNumber(o['entry_count'] ?? o['entryCount']),
    entryWins: parseStatNumber(o['entry_wins'] ?? o['entryWins']),
    equipmentValue: parseStatNumber(o['equipment_value'] ?? o['equipmentValue']),
    moneySaved: parseStatNumber(o['money_saved'] ?? o['moneySaved']),
    killReward: parseStatNumber(o['kill_reward'] ?? o['killReward']),
    liveTime: parseStatNumber(o['live_time'] ?? o['liveTime']),
    headShotKills: parseStatNumber(o['head_shot_kills'] ?? o['headShotKills']),
    cashEarned: parseStatNumber(o['cash_earned'] ?? o['cashEarned']),
    enemiesFlashed: parseStatNumber(o['enemies_flashed'] ?? o['enemiesFlashed']),
  };
}

export function normalizeMatchesIndex(payload: unknown): MatchesIndex | null {
  const root = asObject(payload);
  if (!root) {
    return null;
  }

  const generatedAt = typeof root['generatedAt'] === 'string' ? root['generatedAt'] : null;
  if (!generatedAt) {
    return null;
  }

  const rawMatches = root['matches'];
  if (!Array.isArray(rawMatches)) {
    return null;
  }

  const matches: MatchSummary[] = [];

  for (const item of rawMatches) {
    const matchObj = asObject(item);
    if (!matchObj) {
      continue;
    }

    const matchIdRaw = matchObj['matchid'] ?? matchObj['id'];
    const id = parseIntegerNullable(matchIdRaw);
    if (id === null) {
      continue;
    }

    const startedAt = parseString(matchObj['start_time'] ?? matchObj['startedAt']);
    const endedAt = parseString(matchObj['end_time'] ?? matchObj['endedAt']);
    const winner = parseString(matchObj['winner']);
    const seriesType = parseString(matchObj['series_type'] ?? matchObj['seriesType']);
    const serverIp = parseString(matchObj['server_ip'] ?? matchObj['serverIp']);

    const team1Name = parseString(matchObj['team1_name'] ?? asObject(matchObj['team1'])?.['name']);
    const team1Score = parseNumberNullable(
      matchObj['team1_score'] ?? asObject(matchObj['team1'])?.['score']
    );
    const team2Name = parseString(matchObj['team2_name'] ?? asObject(matchObj['team2'])?.['name']);
    const team2Score = parseNumberNullable(
      matchObj['team2_score'] ?? asObject(matchObj['team2'])?.['score']
    );

    const maps: MatchMapSummary[] = [];
    const rawMaps = matchObj['maps'];
    if (Array.isArray(rawMaps)) {
      for (const mapItem of rawMaps) {
        const mapObj = asObject(mapItem);
        if (!mapObj) {
          continue;
        }
        maps.push({
          mapNumber: parseIntegerNullable(mapObj['mapnumber'] ?? mapObj['mapNumber']),
          startedAt: parseString(mapObj['start_time'] ?? mapObj['startedAt']),
          endedAt: parseString(mapObj['end_time'] ?? mapObj['endedAt']),
          winner: parseString(mapObj['winner']),
          name: parseString(mapObj['mapname'] ?? mapObj['name']),
          team1Score: parseNumberNullable(mapObj['team1_score'] ?? mapObj['team1Score']),
          team2Score: parseNumberNullable(mapObj['team2_score'] ?? mapObj['team2Score']),
        });
      }
    }

    matches.push({
      id,
      startedAt,
      endedAt,
      winner,
      seriesType,
      team1: { name: team1Name, score: team1Score },
      team2: { name: team2Name, score: team2Score },
      serverIp,
      maps,
    });
  }

  return {
    generatedAt,
    matches,
  };
}

export function normalizeMatchDetail(payload: unknown): MatchDetail | null {
  const root = asObject(payload);
  if (!root) {
    return null;
  }

  const generatedAt = typeof root['generatedAt'] === 'string' ? root['generatedAt'] : null;
  if (!generatedAt) {
    return null;
  }

  const matchIdRaw = root['matchid'] ?? root['id'];
  const id = parseIntegerNullable(matchIdRaw);
  if (id === null) {
    return null;
  }

  const matchObj = asObject(root['match']) ?? root;
  const startedAt = parseString(matchObj['start_time'] ?? matchObj['startedAt']);
  const endedAt = parseString(matchObj['end_time'] ?? matchObj['endedAt']);
  const winner = parseString(matchObj['winner']);
  const seriesType = parseString(matchObj['series_type'] ?? matchObj['seriesType']);
  const serverIp = parseString(matchObj['server_ip'] ?? matchObj['serverIp']);

  const team1Name = parseString(matchObj['team1_name'] ?? asObject(matchObj['team1'])?.['name']);
  const team1Score = parseNumberNullable(
    matchObj['team1_score'] ?? asObject(matchObj['team1'])?.['score']
  );
  const team2Name = parseString(matchObj['team2_name'] ?? asObject(matchObj['team2'])?.['name']);
  const team2Score = parseNumberNullable(
    matchObj['team2_score'] ?? asObject(matchObj['team2'])?.['score']
  );

  const matchHeader: MatchHeader = {
    id,
    startedAt,
    endedAt,
    winner,
    seriesType,
    team1: { name: team1Name, score: team1Score },
    team2: { name: team2Name, score: team2Score },
    serverIp,
  };

  const computedObj = asObject(root['computed']);
  let teams: string[] = [];
  if (Array.isArray(computedObj?.['teams'])) {
    teams = (computedObj!['teams'] as unknown[]).filter(
      (t): t is string => typeof t === 'string'
    );
  }

  const mapsPlayed = parseStatNumber(computedObj?.['mapsPlayed']);
  const rawBestOf = computedObj?.['bestOf'];
  let bestOf: 1 | 3 | 5 = 1;
  if (rawBestOf === 3 || rawBestOf === '3') {
    bestOf = 3;
  } else if (rawBestOf === 5 || rawBestOf === '5') {
    bestOf = 5;
  } else if (rawBestOf === 1 || rawBestOf === '1') {
    bestOf = 1;
  }

  const rawPartial = computedObj?.['isPartialSeries'] ?? computedObj?.['partialSeries'];
  let partialSeries = false;
  if (typeof rawPartial === 'boolean') {
    partialSeries = rawPartial;
  } else if (rawPartial === 1 || rawPartial === '1') {
    partialSeries = true;
  } else if (rawPartial === 0 || rawPartial === '0') {
    partialSeries = false;
  }

  const computed: MatchComputed = {
    teams,
    mapsPlayed,
    bestOf,
    partialSeries,
  };

  const detailMaps: MatchDetailMap[] = [];
  const rawMaps = root['maps'];
  if (Array.isArray(rawMaps)) {
    for (const mItem of rawMaps) {
      const mObj = asObject(mItem);
      if (!mObj) {
        continue;
      }

      const mapNumber = parseIntegerNullable(mObj['mapnumber'] ?? mObj['mapNumber']);
      const mStartedAt = parseString(mObj['start_time'] ?? mObj['startedAt']);
      const mEndedAt = parseString(mObj['end_time'] ?? mObj['endedAt']);
      const mWinner = parseString(mObj['winner']);
      const mName = parseString(mObj['mapname'] ?? mObj['name']);
      const mTeam1Score = parseNumberNullable(mObj['team1_score'] ?? mObj['team1Score']);
      const mTeam2Score = parseNumberNullable(mObj['team2_score'] ?? mObj['team2Score']);

      const teamsInMap: MatchTeam[] = [];
      const rawTeams = mObj['teams'];
      if (Array.isArray(rawTeams)) {
        for (const tItem of rawTeams) {
          const tObj = asObject(tItem);
          if (!tObj) {
            continue;
          }
          const teamName = typeof tObj['team'] === 'string' ? tObj['team'] : '';

          const players: MatchPlayer[] = [];
          const rawPlayers = tObj['players'];
          if (Array.isArray(rawPlayers)) {
            for (const pItem of rawPlayers) {
              const pObj = asObject(pItem);
              if (!pObj) {
                continue;
              }

              const pMatchId =
                parseIntegerNullable(pObj['matchid'] ?? pObj['matchId']) ?? id;
              const pMapNumber =
                parseIntegerNullable(pObj['mapnumber'] ?? pObj['mapNumber']) ?? mapNumber;
              const steamId64 = parseSteamId64(pObj['steamid64'] ?? pObj['steamId64']);
              const pTeam = typeof pObj['team'] === 'string' ? pObj['team'] : teamName;
              const pName = parseString(pObj['name']);
              const stats = normalizePlayerStats(pObj);

              players.push({
                ...stats,
                matchId: pMatchId,
                mapNumber: pMapNumber,
                steamId64,
                team: pTeam,
                name: pName,
              });
            }
          }

          const teamTotals = normalizePlayerStats(asObject(tObj['teamTotals']));
          teamsInMap.push({
            team: teamName,
            players,
            teamTotals,
          });
        }
      }

      detailMaps.push({
        matchId: parseIntegerNullable(mObj['matchid'] ?? mObj['matchId']) ?? id,
        mapNumber,
        startedAt: mStartedAt,
        endedAt: mEndedAt,
        winner: mWinner,
        name: mName,
        team1Score: mTeam1Score,
        team2Score: mTeam2Score,
        teams: teamsInMap,
      });
    }
  }

  const totals: MatchAggregateTeam[] = [];
  const rawTotals = root['totals'];
  if (Array.isArray(rawTotals)) {
    for (const totItem of rawTotals) {
      const totObj = asObject(totItem);
      if (!totObj) {
        continue;
      }
      const teamName = typeof totObj['team'] === 'string' ? totObj['team'] : '';

      const aggPlayers: MatchAggregatePlayer[] = [];
      const rawAggPlayers = totObj['players'];
      if (Array.isArray(rawAggPlayers)) {
        for (const apItem of rawAggPlayers) {
          const apObj = asObject(apItem);
          if (!apObj) {
            continue;
          }
          const steamId64 = parseSteamId64(apObj['steamid64'] ?? apObj['steamId64']);
          const apName = parseString(apObj['name']);
          let aggObj = asObject(apObj['aggregates']);
          if (!aggObj && typeof apObj['aggregates'] === 'string') {
            try {
              aggObj = asObject(JSON.parse(apObj['aggregates']));
            } catch {
              aggObj = null;
            }
          }
          const aggregates = normalizePlayerStats(aggObj);

          aggPlayers.push({
            steamId64,
            name: apName,
            aggregates,
          });
        }
      }

      const teamTotals = normalizePlayerStats(asObject(totObj['teamTotals']));
      totals.push({
        team: teamName,
        players: aggPlayers,
        teamTotals,
      });
    }
  }

  const notesObj = asObject(root['notes']);
  const rawLimitations = notesObj?.['limitations'] ?? root['limitations'];
  const limitations: string[] = [];
  if (Array.isArray(rawLimitations)) {
    for (const lim of rawLimitations) {
      if (typeof lim === 'string') {
        limitations.push(lim);
      }
    }
  }

  return {
    generatedAt,
    id,
    match: matchHeader,
    computed,
    maps: detailMaps,
    totals,
    limitations,
  };
}
