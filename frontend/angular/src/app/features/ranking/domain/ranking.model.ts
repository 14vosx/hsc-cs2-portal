export interface Ranking {
  readonly generatedAt: string | null;
  readonly completedMaps: number;
  readonly players: readonly RankingPlayer[];
  readonly rankedPlayerCount: number;
  readonly leader: RankingPlayer | null;
}

export interface RankingPlayer {
  readonly position: number;
  readonly steamId64: string;
  readonly name: string | null;

  readonly matchesPlayed: number;
  readonly mapsPlayed: number;
  readonly roundsPlayed: number;

  readonly wins: number;
  readonly losses: number;

  readonly kills: number;
  readonly deaths: number;
  readonly assists: number;

  readonly kdRatio: number;
  readonly headshotPct: number;
  readonly adr: number;
  readonly utilityDmgPerRound: number;

  readonly killsPerRound: number;
  readonly assistsPerRound: number;
  readonly deathsPerRound: number;

  readonly impactRating: number;
  readonly winRate: number;
  readonly sampleWeight: number;
  readonly score: number;
}
