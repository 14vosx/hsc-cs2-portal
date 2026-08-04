export interface SeasonCompetitionSeason {
  readonly slug: string;
  readonly name: string | null;
  readonly description: string | null;
  readonly status: string | null;
  readonly startAt: string | null;
  readonly endAt: string | null;
  readonly coverImageUrl: string | null;
}

export interface SeasonCompetitionRules {
  readonly minRoundsPerMap: number;
  readonly seasonMembership: string | null;
  readonly matchDetailEndpoint: string | null;
  readonly mapDetailEndpoint: string | null;
}

export interface SeasonCompetitionSummary {
  readonly matches: number;
  readonly maps: number;
  readonly rounds: number;
  readonly players: number;
  readonly lastMapEndedAt: string | null;
}
