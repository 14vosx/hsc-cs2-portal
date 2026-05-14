export interface PlayerIdentityDto {
  displayName?: string | null;
  steamid64?: string | null;
  steamId64?: string | null;
  avatarMedium?: string | null;
  steamProfileUrl?: string | null;
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
  currentSeason?: PlayerBunkerCurrentSeasonDto | null;
  seasonPlayer?: PlayerBunkerSeasonPlayerDto | null;
  competitiveProfile?: PlayerBunkerCompetitiveProfileDto | null;
}

export interface PlayerBunkerCompetitiveProfileDto {
  generatedAt?: string | null;
  steamid64?: string | null;
  name?: string | null;
  avatarMedium?: string | null;
  steamProfileUrl?: string | null;
  lifetime?: PlayerBunkerCompetitiveLifetimeDto | null;
}

export interface PlayerBunkerCompetitiveLifetimeDto {
  matchesPlayed?: number | null;
  mapsPlayed?: number | null;
  roundsPlayed?: number | null;
  wins?: number | null;
  losses?: number | null;
  winRate?: number | null;
  kdRatio?: number | null;
  adr?: number | null;
  impactRating?: number | null;
  kills?: number | null;
  deaths?: number | null;
  assists?: number | null;
  headshotPct?: number | null;
  accuracy?: number | null;
}

export interface PlayerBunkerCurrentSeasonDto {
  slug?: string | null;
  scope?: {
    startAt?: string | null;
    endAt?: string | null;
  } | null;
}

export interface PlayerBunkerSeasonPlayerDto {
  name?: string | null;
  steamid64?: string | null;
  summary?: PlayerBunkerSeasonPlayerSummaryDto | null;
  byMap?: PlayerBunkerSeasonPlayerMapDto[] | null;
  recentMaps?: PlayerBunkerSeasonPlayerRecentMapDto[] | null;
  timeline?: PlayerBunkerSeasonPlayerTimelineItemDto[] | null;
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

export interface PlayerBunkerSeasonPlayerMapDto {
  mapName?: string | null;
  mapname?: string | null;
  map?: string | null;
  mapsPlayed?: number | null;
  matchesPlayed?: number | null;
  wins?: number | null;
  losses?: number | null;
  winRate?: number | null;
  kdRatio?: number | null;
  adr?: number | null;
  impactRating?: number | null;
}

export interface PlayerBunkerSeasonPlayerRecentMapDto {
  mapName?: string | null;
  mapname?: string | null;
  map?: string | null;
  startedAt?: string | null;
  startTime?: string | null;
  start_time?: string | null;
  matchId?: string | null;
  matchid?: string | null;
  mapNumber?: number | null;
  mapnumber?: number | null;
  result?: string | null;
  outcome?: string | null;
  score?: string | null;
  kills?: number | null;
  deaths?: number | null;
  assists?: number | null;
  kdRatio?: number | null;
  adr?: number | null;
  impactRating?: number | null;
}

export interface PlayerBunkerSeasonPlayerTimelineItemDto {
  at?: string | null;
  timestamp?: string | null;
  startedAt?: string | null;
  startTime?: string | null;
  start_time?: string | null;
  event?: string | null;
  type?: string | null;
  mapName?: string | null;
  mapname?: string | null;
  map?: string | null;
  matchId?: string | null;
  matchid?: string | null;
  mapNumber?: number | null;
  mapnumber?: number | null;
  result?: string | null;
  outcome?: string | null;
  score?: string | null;
  kills?: number | null;
  deaths?: number | null;
  assists?: number | null;
  kdRatio?: number | null;
  adr?: number | null;
  impactRating?: number | null;
}

export interface PlayerBunkerSummaryDto extends PlayerBunkerSummaryDataDto {
  ok?: boolean | null;
  data?: {
    player?: PlayerIdentityDto | null;
    bunker?: PlayerBunkerSummaryDataDto | null;
    competitiveProfile?: PlayerBunkerCompetitiveProfileDto | null;
    currentSeason?: PlayerBunkerCurrentSeasonDto | null;
    seasonPlayer?: PlayerBunkerSeasonPlayerDto | null;
  } | null;
}
