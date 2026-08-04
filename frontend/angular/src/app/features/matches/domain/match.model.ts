export interface MatchTeamScore {
  readonly name: string | null;
  readonly score: number | null;
}

export interface MatchMapSummary {
  readonly mapNumber: number | null;
  readonly startedAt: string | null;
  readonly endedAt: string | null;
  readonly winner: string | null;
  readonly name: string | null;
  readonly team1Score: number | null;
  readonly team2Score: number | null;
}

export interface MatchSummary {
  readonly id: number;
  readonly startedAt: string | null;
  readonly endedAt: string | null;
  readonly winner: string | null;
  readonly seriesType: string | null;
  readonly team1: MatchTeamScore;
  readonly team2: MatchTeamScore;
  readonly serverIp: string | null;
  readonly maps: readonly MatchMapSummary[];
}

export interface MatchesIndex {
  readonly generatedAt: string;
  readonly matches: readonly MatchSummary[];
}

export interface MatchHeader {
  readonly id: number;
  readonly startedAt: string | null;
  readonly endedAt: string | null;
  readonly winner: string | null;
  readonly seriesType: string | null;
  readonly team1: MatchTeamScore;
  readonly team2: MatchTeamScore;
  readonly serverIp: string | null;
}

export interface MatchComputed {
  readonly teams: readonly string[];
  readonly mapsPlayed: number;
  readonly bestOf: 1 | 3 | 5;
  readonly partialSeries: boolean;
}

export interface MatchPlayerStats {
  readonly kills: number;
  readonly deaths: number;
  readonly damage: number;
  readonly assists: number;
  readonly enemy5Ks: number;
  readonly enemy4Ks: number;
  readonly enemy3Ks: number;
  readonly enemy2Ks: number;
  readonly utilityCount: number;
  readonly utilityDamage: number;
  readonly utilitySuccesses: number;
  readonly utilityEnemies: number;
  readonly flashCount: number;
  readonly flashSuccesses: number;
  readonly healthPointsRemovedTotal: number;
  readonly healthPointsDealtTotal: number;
  readonly shotsFiredTotal: number;
  readonly shotsOnTargetTotal: number;
  readonly v1Count: number;
  readonly v1Wins: number;
  readonly v2Count: number;
  readonly v2Wins: number;
  readonly entryCount: number;
  readonly entryWins: number;
  readonly equipmentValue: number;
  readonly moneySaved: number;
  readonly killReward: number;
  readonly liveTime: number;
  readonly headShotKills: number;
  readonly cashEarned: number;
  readonly enemiesFlashed: number;
}

export interface MatchPlayer extends MatchPlayerStats {
  readonly matchId: number;
  readonly mapNumber: number | null;
  readonly steamId64: string | null;
  readonly team: string;
  readonly name: string | null;
}

export interface MatchTeam {
  readonly team: string;
  readonly players: readonly MatchPlayer[];
  readonly teamTotals: MatchPlayerStats;
}

export interface MatchDetailMap {
  readonly matchId: number;
  readonly mapNumber: number | null;
  readonly startedAt: string | null;
  readonly endedAt: string | null;
  readonly winner: string | null;
  readonly name: string | null;
  readonly team1Score: number | null;
  readonly team2Score: number | null;
  readonly teams: readonly MatchTeam[];
}

export interface MatchAggregatePlayer {
  readonly steamId64: string | null;
  readonly name: string | null;
  readonly aggregates: MatchPlayerStats;
}

export interface MatchAggregateTeam {
  readonly team: string;
  readonly players: readonly MatchAggregatePlayer[];
  readonly teamTotals: MatchPlayerStats;
}

export interface MatchDetail {
  readonly generatedAt: string;
  readonly id: number;
  readonly match: MatchHeader;
  readonly computed: MatchComputed;
  readonly maps: readonly MatchDetailMap[];
  readonly totals: readonly MatchAggregateTeam[];
  readonly limitations: readonly string[];
}
