import type { PreferredMap, PreferredRole } from './player-profile.model';

export interface PlayerPublicProfile {
  readonly displayName: string;
  readonly slug: string;
  readonly bio: string | null;
  readonly avatarUrl: string | null;
  readonly bannerUrl: string | null;
  readonly discordHandle: string | null;
  readonly preferredRole: PreferredRole | null;
  readonly preferredMap: PreferredMap | null;
  readonly joinedAt: string;
}
