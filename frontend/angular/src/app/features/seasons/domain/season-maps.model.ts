import type {
  SeasonCompetitionRules,
  SeasonCompetitionSeason,
  SeasonCompetitionSummary,
} from './season-competition.model';

export interface SeasonMapSummary {
  readonly name: string;
  readonly matches: number;
  readonly rounds: number;
  readonly averageRoundsPerMatch: number;
  readonly lastPlayedAt: string | null;
}

export interface SeasonMapsComputed {
  readonly distinctMaps: number;
}

export interface SeasonMaps {
  readonly generatedAt: string;
  readonly season: SeasonCompetitionSeason;
  readonly rules: SeasonCompetitionRules;
  readonly summary: SeasonCompetitionSummary;
  readonly computed: SeasonMapsComputed;
  readonly maps: readonly SeasonMapSummary[];
}
