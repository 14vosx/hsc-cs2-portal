export interface MapDetailLifetimeDto {
  matches: number;
  rounds: number;
  avgRoundsPerMatch: number;
  lastPlayed: string;
}

export interface MapDetailRecentMatchTeamDto {
  name: string;
  score: number;
}

export interface MapDetailRecentMatchMapScoreDto {
  team1: number;
  team2: number;
}

export interface MapDetailRecentMatchDto {
  matchid: number;
  seriesType: string;
  endedAt: string;
  winner: string;
  team1: MapDetailRecentMatchTeamDto;
  team2: MapDetailRecentMatchTeamDto;
  mapNumber: number;
  mapScore: MapDetailRecentMatchMapScoreDto;
}

export interface MapDetailDto {
  generatedAt: string;
  map: string;
  lifetime: MapDetailLifetimeDto;
  recentMatches: MapDetailRecentMatchDto[];
}