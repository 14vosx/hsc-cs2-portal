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
  seasonPlayer?: PlayerBunkerSeasonPlayerDto | null;
}

export interface PlayerBunkerSeasonPlayerDto {
  summary?: PlayerBunkerSeasonPlayerSummaryDto | null;
}

export interface PlayerBunkerSeasonPlayerSummaryDto {
  mapsPlayed?: number | null;
  matchesPlayed?: number | null;
  wins?: number | null;
  winRate?: number | null;
  kdRatio?: number | null;
  adr?: number | null;
  impactRating?: number | null;
  kills?: number | null;
  deaths?: number | null;
  assists?: number | null;
}

export interface PlayerBunkerSummaryDto extends PlayerBunkerSummaryDataDto {
  ok?: boolean | null;
  data?: {
    player?: PlayerIdentityDto | null;
    bunker?: PlayerBunkerSummaryDataDto | null;
    seasonPlayer?: PlayerBunkerSeasonPlayerDto | null;
  } | null;
}
