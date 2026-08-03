export interface PlayerIdentity {
  readonly displayName: string | null;
  readonly steamId64: string;
  readonly avatarMedium: string | null;
  readonly steamProfileUrl: string | null;
}
