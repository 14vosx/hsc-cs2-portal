export interface BunkerSeasonScope {
  readonly startAt: string | null;
  readonly endAt: string | null;
}

export interface BunkerCurrentSeason {
  readonly slug: string | null;
  readonly name: string | null;
  readonly status: string | null;
  readonly scope: BunkerSeasonScope | null;
}

export interface BunkerPlayerStats {
  readonly mapsPlayed: number | null;
  readonly matchesPlayed: number | null;
  readonly wins: number | null;
  readonly losses: number | null;
  readonly winRate: number | null;
  readonly kdRatio: number | null;
  readonly adr: number | null;
  readonly impactRating: number | null;
  readonly kills: number | null;
  readonly deaths: number | null;
  readonly assists: number | null;
  readonly roundsPlayed: number | null;
  readonly headshotPct: number | null;
  readonly accuracy: number | null;
  readonly utilityDmgPerRound: number | null;
  readonly killsPerRound: number | null;
  readonly assistsPerRound: number | null;
  readonly deathsPerRound: number | null;
  readonly entryWinRate: number | null;
  readonly v1Count: number | null;
  readonly v1Wins: number | null;
  readonly v1WinRate: number | null;
  readonly v2Count: number | null;
  readonly v2Wins: number | null;
  readonly v2WinRate: number | null;
  readonly enemy2ks: number | null;
  readonly enemy3ks: number | null;
  readonly enemy4ks: number | null;
  readonly enemy5ks: number | null;
  readonly sampleWeight: number | null;
  readonly score: number | null;
}

export interface BunkerMapPerformance {
  readonly mapName: string | null;
  readonly mapsPlayed: number | null;
  readonly matchesPlayed: number | null;
  readonly wins: number | null;
  readonly losses: number | null;
  readonly winRate: number | null;
  readonly kdRatio: number | null;
  readonly adr: number | null;
  readonly impactRating: number | null;
  readonly roundsPlayed: number | null;
  readonly kills: number | null;
  readonly deaths: number | null;
  readonly assists: number | null;
  readonly headshotPct: number | null;
  readonly accuracy: number | null;
  readonly utilityDmgPerRound: number | null;
  readonly entryWinRate: number | null;
  readonly enemy2ks: number | null;
  readonly enemy3ks: number | null;
  readonly enemy4ks: number | null;
  readonly enemy5ks: number | null;
}

export interface BunkerRecentMap {
  readonly mapName: string | null;
  readonly startedAt: string | null;
  readonly matchId: string | null;
  readonly mapNumber: number | null;
  readonly result: string | null;
  readonly outcome: string | null;
  readonly score: string | null;
  readonly team: string | null;
  readonly winner: string | null;
  readonly isWin: boolean | null;
  readonly team1Score: number | null;
  readonly team2Score: number | null;
  readonly rounds: number | null;
  readonly damage: number | null;
  readonly utilityDamage: number | null;
  readonly headShotKills: number | null;
  readonly entryCount: number | null;
  readonly entryWins: number | null;
  readonly v1Count: number | null;
  readonly v1Wins: number | null;
  readonly v2Count: number | null;
  readonly v2Wins: number | null;
  readonly enemy2ks: number | null;
  readonly enemy3ks: number | null;
  readonly enemy4ks: number | null;
  readonly enemy5ks: number | null;
  readonly shotsFiredTotal: number | null;
  readonly shotsOnTargetTotal: number | null;
  readonly kills: number | null;
  readonly deaths: number | null;
  readonly assists: number | null;
  readonly kdRatio: number | null;
  readonly adr: number | null;
  readonly impactRating: number | null;
}

export interface BunkerTimelineItem {
  readonly at: string | null;
  readonly event: string | null;
  readonly mapName: string | null;
  readonly matchId: string | null;
  readonly mapNumber: number | null;
  readonly result: string | null;
  readonly score: string | null;
  readonly kills: number | null;
  readonly deaths: number | null;
  readonly assists: number | null;
  readonly kdRatio: number | null;
  readonly adr: number | null;
  readonly impactRating: number | null;
}

export interface BunkerSeasonPlayer {
  readonly name: string | null;
  readonly steamId64: string | null;
  readonly generatedAt: string | null;
  readonly summary: BunkerPlayerStats | null;
  readonly byMap: readonly BunkerMapPerformance[];
  readonly recentMaps: readonly BunkerRecentMap[];
  readonly timeline: readonly BunkerTimelineItem[];
}

export interface BunkerCompetitiveProfile {
  readonly generatedAt: string | null;
  readonly steamId64: string | null;
  readonly name: string | null;
  readonly avatarMedium: string | null;
  readonly steamProfileUrl: string | null;
  readonly lifetime: BunkerPlayerStats | null;
}

export interface BunkerSummary {
  readonly status: string | null;
  readonly seasonFirst: boolean | null;
  readonly statsAvailable: boolean | null;
  readonly currentSeason: BunkerCurrentSeason | null;
  readonly seasonPlayer: BunkerSeasonPlayer | null;
  readonly competitiveProfile: BunkerCompetitiveProfile | null;
}
