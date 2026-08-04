export type OverviewSeasonContextMode = 'active' | 'latest-closed';

export interface OverviewSeasonLeader {
  readonly position: number;
  readonly steamId64: string;
  readonly name: string;
  readonly score: number;
  readonly wins: number;
  readonly losses: number;
  readonly kdRatio: number;
}

export interface OverviewSeasonMetrics {
  readonly seasonSlug: string;
  readonly seasonName: string;
  readonly contextMode: OverviewSeasonContextMode;
  readonly generatedAt: string | null;
  readonly playersCount: number;
  readonly matchesCount: number;
  readonly mapsCount: number;
  readonly roundsCount: number;
  readonly leader: OverviewSeasonLeader | null;
}
