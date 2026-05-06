import { SeasonDto } from './season.dto';

export interface SeasonPrizeEligibilityRulesDto {
  minMapsPlayed?: number;
  minRoundsPlayed?: number;
}

export interface SeasonRankingRulesDto {
  minRoundsPerMap?: number;
  prizeEligibility?: SeasonPrizeEligibilityRulesDto;
  rankingFormulaVersion?: string;
}

export interface SeasonRankingSummaryDto {
  matches?: number;
  maps?: number;
  rounds?: number;
  players?: number;
  eligiblePlayers?: number;
  lastMapEndedAt?: string | null;
}

export interface SeasonRankingPlayerDto {
  rank?: number;
  prizeRank?: number | null;
  prizeEligible?: boolean;
  prizeEligibilityReason?: string | null;
  steamid64?: string;
  name?: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  steamAvatarUrl?: string | null;
  steam_avatar_url?: string | null;
  avatar?: string | null;
  matchesPlayed?: number;
  mapsPlayed?: number;
  roundsPlayed?: number;
  wins?: number;
  losses?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  kdRatio?: number;
  headshotPct?: number;
  adr?: number;
  utilityDmgPerRound?: number;
  killsPerRound?: number;
  assistsPerRound?: number;
  deathsPerRound?: number;
  impactRating?: number;
  winRate?: number;
  sampleWeight?: number;
  score?: number;
}

export interface SeasonRankingDto {
  generatedAt?: string;
  season?: SeasonDto | null;
  rules?: SeasonRankingRulesDto | null;
  summary?: SeasonRankingSummaryDto | null;
  topPrizeCandidates?: SeasonRankingPlayerDto[];
  players?: SeasonRankingPlayerDto[];
}
