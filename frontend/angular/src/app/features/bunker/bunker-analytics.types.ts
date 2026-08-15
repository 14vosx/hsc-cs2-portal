import type {
  BunkerMapPerformance,
  BunkerPlayerStats,
  BunkerRecentMap,
  BunkerTimelineItem,
} from './domain/bunker.model';

export type AnalyticsTab = 'overview' | 'maps' | 'matches' | 'combat';

export type AnalyticsContext = 'season' | 'lifetime';

export interface SelectedAnalyticsData {
  readonly summary: BunkerPlayerStats | null;
  readonly periods: Readonly<Record<string, BunkerPlayerStats>>;
  readonly byMap: readonly BunkerMapPerformance[];
  readonly recentMaps: readonly BunkerRecentMap[];
  readonly timeline: readonly BunkerTimelineItem[];
}
