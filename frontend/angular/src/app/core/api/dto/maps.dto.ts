export interface MapSummaryDto {
  map: string;
  matches: number;
  rounds: number;
  avgRoundsPerMatch: number;
  lastPlayed: string;
}

export interface MapsDto {
  generatedAt: string;
  maps: MapSummaryDto[];
}
