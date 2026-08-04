import type { MatchMapSummary, MatchSummary, MatchTeamScore } from '../../matches/domain/match.model';
import type {
  SeasonCompetitionRules,
  SeasonCompetitionSeason,
  SeasonCompetitionSummary,
} from './season-competition.model';

export interface SeasonMatchTeamScore extends MatchTeamScore {
  readonly name: string | null;
  readonly score: number;
}

export interface SeasonMatchMap extends MatchMapSummary {
  readonly mapNumber: number;
  readonly startedAt: string | null;
  readonly endedAt: string | null;
  readonly winner: string | null;
  readonly name: string;
  readonly team1Score: number;
  readonly team2Score: number;
  readonly rounds: number;
}

export interface SeasonMatchSummary extends MatchSummary {
  readonly id: number;
  readonly startedAt: string | null;
  readonly endedAt: string | null;
  readonly winner: string | null;
  readonly seriesType: string | null;
  readonly team1: SeasonMatchTeamScore;
  readonly team2: SeasonMatchTeamScore;
  readonly serverIp: string | null;
  readonly maps: readonly SeasonMatchMap[];
  readonly seasonMapCount: number;
  readonly seasonRounds: number;
  readonly seasonFirstMapStartedAt: string | null;
  readonly seasonLastMapEndedAt: string | null;
}

export interface SeasonMatchesComputed {
  readonly firstMapStartedAt: string | null;
}

export interface SeasonMatches {
  readonly generatedAt: string;
  readonly season: SeasonCompetitionSeason;
  readonly rules: SeasonCompetitionRules;
  readonly summary: SeasonCompetitionSummary;
  readonly computed: SeasonMatchesComputed;
  readonly matches: readonly SeasonMatchSummary[];
}
