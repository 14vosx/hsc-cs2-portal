export interface SeasonRanking {
  readonly generatedAt: string | null;
  readonly season: SeasonRankingSeason;
  readonly rules: SeasonRankingRules;
  readonly summary: SeasonRankingSummary;
  readonly topPrizeCandidates: readonly SeasonRankingPlayer[];
  readonly players: readonly SeasonRankingPlayer[];
}

export interface SeasonRankingSeason {
  readonly slug: string;
  readonly name: string | null;
  readonly description: string | null;
  readonly status: string | null;
  readonly startAt: string | null;
  readonly endAt: string | null;
  readonly coverImageUrl: string | null;
}

export interface SeasonRankingRules {
  readonly minRoundsPerMap: number;
  readonly rankingFormulaVersion: string | null;
  readonly prizeEligibility: SeasonRankingPrizeEligibilityRules;
}

export interface SeasonRankingPrizeEligibilityRules {
  readonly minMapsPlayed: number;
  readonly minRoundsPlayed: number;
}

export interface SeasonRankingSummary {
  readonly matches: number;
  readonly maps: number;
  readonly rounds: number;
  readonly players: number;
  readonly eligiblePlayers: number;
  readonly lastMapEndedAt: string | null;
}

export interface SeasonRankingPlayer {
  readonly rank: number;
  readonly prizeRank: number | null;
  readonly prizeEligible: boolean | null;
  readonly prizeEligibilityReason: string | null;
  readonly steamId64: string | null;
  readonly name: string | null;
  readonly avatarUrl: string | null;
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
