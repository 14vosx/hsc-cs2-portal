export type HomeSeasonContextMode = 'active' | 'latest-closed';

export interface HomeTopPlayer {
  readonly position: number;
  readonly steamId64: string;
  readonly name: string;
  readonly avatarUrl: string | null;
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
  readonly leader: HomeTopPlayer | null;
  readonly topPlayers: readonly HomeTopPlayer[];
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

export interface HomeRecentMatchMap {
  readonly name: string;
  readonly team1Score: number;
  readonly team2Score: number;
}

export interface HomeRecentMatch {
  readonly matchId: number;
  readonly seasonLastMapEndedAt: string | null;
  readonly winnerName: string | null;
  readonly team1Name: string | null;
  readonly team1Score: number;
  readonly team2Name: string | null;
  readonly team2Score: number;
  readonly maps: readonly HomeRecentMatchMap[];
}

export type HomeRecentMatchesState =
  | { readonly status: 'loading' }
  | { readonly status: 'empty' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly data: readonly HomeRecentMatch[] };

export interface HomeNewsItem {
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string | null;
  readonly imageUrl: string | null;
  readonly publishedAt: string | null;
}

export type HomeNewsState =
  | { readonly status: 'loading' }
  | { readonly status: 'empty' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly data: readonly HomeNewsItem[] };
