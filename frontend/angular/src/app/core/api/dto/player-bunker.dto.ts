export interface PlayerIdentityDto {
  displayName?: string | null;
  steamid64?: string | null;
  steamId64?: string | null;
}

export interface PlayerMeDto extends PlayerIdentityDto {
  authenticated?: boolean | null;
  player?: PlayerIdentityDto | null;
  user?: PlayerIdentityDto | null;
}

export interface PlayerBunkerSummaryDataDto {
  status?: string | null;
  seasonFirst?: boolean | null;
  statsAvailable?: boolean | null;
}

export interface PlayerBunkerSummaryDto extends PlayerBunkerSummaryDataDto {
  ok?: boolean | null;
  data?: {
    player?: PlayerIdentityDto | null;
    bunker?: PlayerBunkerSummaryDataDto | null;
  } | null;
}
