export type HomeSeasonContextMode = 'active' | 'latest-closed';

export interface HomeSeasonLeader {
  readonly position: number;
  readonly steamId64: string;
  readonly name: string;
  readonly score: number;
  readonly wins: number;
  readonly losses: number;
  readonly kdRatio: number;
}

export interface HomeSeasonMetrics {
  readonly seasonSlug: string;
  readonly seasonName: string;
  readonly contextMode: HomeSeasonContextMode;
  readonly generatedAt: string | null;
  readonly playersCount: number;
  readonly matchesCount: number;
  readonly mapsCount: number;
  readonly roundsCount: number;
  readonly leader: HomeSeasonLeader | null;
  readonly hasClassifiedPlayers: boolean;
}

export type HomeSeasonState =
  | { readonly status: 'loading' }
  | { readonly status: 'empty' }
  | { readonly status: 'seasons-error'; readonly error: string }
  | {
      readonly status: 'ranking-error';
      readonly error: string;
      readonly seasonSlug: string;
      readonly seasonName: string;
      readonly contextMode: HomeSeasonContextMode;
    }
  | { readonly status: 'ready'; readonly data: HomeSeasonMetrics };

export interface HomeEditorialItem {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly slug: string;
  readonly date: string;
}
