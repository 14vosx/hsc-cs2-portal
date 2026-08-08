export type PlayerProfileVisibility = 'private' | 'public';

export interface PlayerProfile {
  readonly displayName: string;
  readonly slug: string;
  readonly bio: string | null;
  readonly avatarUrl: string | null;
  readonly bannerUrl: string | null;
  readonly discordHandle: string | null;
  readonly preferredRole: string | null;
  readonly preferredMap: string | null;
  readonly visibility: PlayerProfileVisibility;
  readonly joinedAt: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}
