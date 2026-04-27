export interface MatchDetailMatchDto {
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
}

export interface MatchDetailComputedDto {
  teams: string[];
  mapsPlayed: number;
  bestOf: number;
  isPartialSeries: number;
}

export interface MatchDetailStatsDto {
  kills: number;
  deaths: number;
  damage: number;
  assists: number;
  enemy5ks: number;
  enemy4ks: number;
  enemy3ks: number;
  enemy2ks: number;
  utility_count: number;
  utility_damage: number;
  utility_successes: number;
  utility_enemies: number;
  flash_count: number;
  flash_successes: number;
  health_points_removed_total: number;
  health_points_dealt_total: number;
  shots_fired_total: number;
  shots_on_target_total: number;
  v1_count: number;
  v1_wins: number;
  v2_count: number;
  v2_wins: number;
  entry_count: number;
  entry_wins: number;
  equipment_value: number;
  money_saved: number;
  kill_reward: number;
  live_time: number;
  head_shot_kills: number;
  cash_earned: number;
  enemies_flashed: number;
}

export interface MatchDetailPlayerDto extends MatchDetailStatsDto {
  matchid: number;
  mapnumber: number;
  steamid64: number | string;
  team: string;
  name: string;
}

export interface MatchDetailTeamDto {
  team: string;
  players: MatchDetailPlayerDto[];
  teamTotals: MatchDetailStatsDto;
}

export interface MatchDetailMapDto {
  matchid: number;
  mapnumber: number;
  start_time: string;
  end_time: string;
  winner: string;
  mapname: string;
  team1_score: number;
  team2_score: number;
  teams: MatchDetailTeamDto[];
}

export interface MatchDetailTotalPlayerDto {
  steamid64: number | string;
  name: string;
  aggregates: string;
}

export interface MatchDetailTotalTeamDto {
  team: string;
  players: MatchDetailTotalPlayerDto[];
  teamTotals: MatchDetailStatsDto;
}

export interface MatchDetailNotesDto {
  limitations: string[];
}

export interface MatchDetailDto {
  generatedAt: string;
  matchid: number;
  match: MatchDetailMatchDto;
  computed: MatchDetailComputedDto;
  maps: MatchDetailMapDto[];
  totals: MatchDetailTotalTeamDto[];
  notes?: MatchDetailNotesDto;
}