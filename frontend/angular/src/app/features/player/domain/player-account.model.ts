export type PlayerAccountStatus = 'active' | 'disabled';

export type PlayerSteamCapabilityReason = 'steam_link_required' | null;

export interface PlayerAccountSummary {
  readonly status: PlayerAccountStatus;

  readonly identities: {
    readonly email: {
      readonly linked: boolean;
      readonly email: string | null;
      readonly verified: boolean;
    };

    readonly steam: {
      readonly linked: boolean;
      readonly steamId64: string | null;
    };
  };

  readonly capabilities: {
    readonly cs2Identity: {
      readonly ready: boolean;
      readonly reason: PlayerSteamCapabilityReason;
    };

    readonly personalizedStats: {
      readonly available: boolean;
      readonly reason: PlayerSteamCapabilityReason;
    };
  };
}
