export interface MatchMapDto {
  mapnumber: number;
  start_time: string;
  end_time: string;
  winner: string;
  mapname: string;
  team1_score: number;
  team2_score: number;
}

export interface MatchSummaryDto {
  matchid: number;
  start_time: string;
  end_time: string;
  winner: string;
  series_type: string;
  team1_name: string;
  team1_score: number;
  team2_name: string;
  team2_score: number;
  server_ip: string;
  maps: MatchMapDto[];
}

export interface MatchesDto {
  generatedAt: string;
  matches: MatchSummaryDto[];
}
