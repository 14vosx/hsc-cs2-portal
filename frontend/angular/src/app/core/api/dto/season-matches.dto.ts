import { MatchSummaryDto } from './matches.dto';
import { SeasonMatchesMapsRulesDto } from './season-matches-maps-rules.dto';
import { SeasonDto } from './season.dto';

export interface SeasonMatchesSummaryDto {
  matches?: number;
  maps?: number;
  rounds?: number;
  players?: number;
  lastMapEndedAt?: string | null;
}

export interface SeasonMatchesComputedDto {
  firstMapStartedAt?: string | null;
}

export interface SeasonMatchMapDto {
  mapnumber?: number;
  start_time?: string;
  end_time?: string;
  winner?: string;
  mapname?: string;
  team1_score?: number;
  team2_score?: number;
  rounds?: number;
}

export interface SeasonMatchSummaryDto extends Omit<MatchSummaryDto, 'maps'> {
  maps: SeasonMatchMapDto[];
  seasonMapCount?: number;
  seasonRounds?: number;
  seasonFirstMapStartedAt?: string | null;
  seasonLastMapEndedAt?: string | null;
}

export interface SeasonMatchesDto {
  generatedAt?: string;
  season?: SeasonDto | null;
  rules?: SeasonMatchesMapsRulesDto | null;
  summary?: SeasonMatchesSummaryDto | null;
  computed?: SeasonMatchesComputedDto | null;
  matches?: SeasonMatchSummaryDto[];
}
