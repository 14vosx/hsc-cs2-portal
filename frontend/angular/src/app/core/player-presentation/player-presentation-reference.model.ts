export interface PlayerPresentationReference {
  readonly steam: {
    readonly steamId64: string;
    readonly personaname: string | null;
    readonly avatarMediumUrl: string | null;
  };
  readonly profile: {
    readonly slug: string;
  } | null;
}

export type PlayerPresentationReferences = ReadonlyMap<string, PlayerPresentationReference>;
