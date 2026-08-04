export interface MapSummary {
  readonly name: string;
  readonly matches: number;
  readonly rounds: number;
  readonly averageRoundsPerMatch: number;
  readonly lastPlayedAt: string;
}

export interface MapsIndex {
  readonly generatedAt: string;
  readonly maps: readonly MapSummary[];
}

export interface MapLifetime {
  readonly matches: number;
  readonly rounds: number;
  readonly averageRoundsPerMatch: number;
  readonly lastPlayedAt: string;
}

export interface MapRecentMatchTeam {
  readonly name: string | null;
  readonly score: number | null;
}

export interface MapRecentMatchScore {
  readonly team1: number | null;
  readonly team2: number | null;
}

export interface MapRecentMatch {
  readonly matchId: number;
  readonly seriesType: string | null;
  readonly endedAt: string | null;
  readonly winner: string | null;
  readonly team1: MapRecentMatchTeam;
  readonly team2: MapRecentMatchTeam;
  readonly mapNumber: number | null;
  readonly mapScore: MapRecentMatchScore;
}

export interface MapDetail {
  readonly generatedAt: string;
  readonly name: string;
  readonly lifetime: MapLifetime;
  readonly recentMatches: readonly MapRecentMatch[];
}
