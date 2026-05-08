import { MapSummaryDto } from './maps.dto';
import { SeasonMatchesMapsRulesDto } from './season-matches-maps-rules.dto';
import { SeasonDto } from './season.dto';

export interface SeasonMapsSummaryDto {
  matches?: number;
  maps?: number;
  rounds?: number;
  players?: number;
  lastMapEndedAt?: string | null;
}

export interface SeasonMapsComputedDto {
  distinctMaps?: number;
}

export interface SeasonMapsDto {
  generatedAt?: string;
  season?: SeasonDto | null;
  rules?: SeasonMatchesMapsRulesDto | null;
  summary?: SeasonMapsSummaryDto | null;
  computed?: SeasonMapsComputedDto | null;
  maps?: MapSummaryDto[];
}
