import type { BunkerRecentMap } from './domain/bunker.model';

export function bunkerMatchStableKey(match: BunkerRecentMap): string {
  if (match.matchId) {
    return `match:${JSON.stringify([match.matchId, match.mapNumber])}`;
  }

  return `published:${JSON.stringify([
    match.startedAt,
    match.mapNumber,
    match.mapName,
    match.team,
  ])}`;
}
