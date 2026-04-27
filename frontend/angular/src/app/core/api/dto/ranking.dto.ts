export interface RankingPlayerDto {
  steamid64: string;
  name: string;
  matchesPlayed: number;
  mapsPlayed: number;
  roundsPlayed: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
  kdRatio: number;
  headshotPct: number;
  adr: number;
  utilityDmgPerRound: number;
  killsPerRound: number;
  assistsPerRound: number;
  deathsPerRound: number;
  impactRating: number;
  winRate: number;
  sampleWeight: number;
  score: number;
}

export interface RankingDto {
  generatedAt: string;
  mapsFinalizados: number;
  players: RankingPlayerDto[];
}
