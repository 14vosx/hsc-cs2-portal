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
  utilityDmgPerRound?: number | null;
  killsPerRound?: number | null;
  assistsPerRound?: number | null;
  deathsPerRound?: number | null;
  entryWinRate?: number | null;
  v1Count?: number | null;
  v1Wins?: number | null;
  v1WinRate?: number | null;
  v2Count?: number | null;
  v2Wins?: number | null;
  v2WinRate?: number | null;
  enemy2ks?: number | null;
  enemy3ks?: number | null;
  enemy4ks?: number | null;
  enemy5ks?: number | null;
  sampleWeight?: number | null;
  score?: number | null;
}

export interface PlayerBunkerCurrentSeasonDto {
  slug?: string | null;
  name?: string | null;
  status?: string | null;
  scope?: {
    startAt?: string | null;
    endAt?: string | null;
  } | null;
}

export interface PlayerBunkerSeasonPlayerDto {
  name?: string | null;
  steamid64?: string | null;
  generatedAt?: string | null;
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
  roundsPlayed?: number | null;
  losses?: number | null;
  headshotPct?: number | null;
  accuracy?: number | null;
  utilityDmgPerRound?: number | null;
  killsPerRound?: number | null;
  assistsPerRound?: number | null;
  deathsPerRound?: number | null;
  entryWinRate?: number | null;
  v1Count?: number | null;
  v1Wins?: number | null;
  v1WinRate?: number | null;
  v2Count?: number | null;
  v2Wins?: number | null;
  v2WinRate?: number | null;
  enemy2ks?: number | null;
  enemy3ks?: number | null;
  enemy4ks?: number | null;
  enemy5ks?: number | null;
  sampleWeight?: number | null;
  score?: number | null;
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
  roundsPlayed?: number | null;
  kills?: number | null;
  deaths?: number | null;
  assists?: number | null;
  headshotPct?: number | null;
  accuracy?: number | null;
  utilityDmgPerRound?: number | null;
  entryWinRate?: number | null;
  enemy2ks?: number | null;
  enemy3ks?: number | null;
  enemy4ks?: number | null;
  enemy5ks?: number | null;
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
  team?: string | null;
  winner?: string | null;
  isWin?: boolean | null;
  team1_score?: number | null;
  team2_score?: number | null;
  rounds?: number | null;
  damage?: number | null;
  utility_damage?: number | null;
  head_shot_kills?: number | null;
  entry_count?: number | null;
  entry_wins?: number | null;
  v1_count?: number | null;
  v1_wins?: number | null;
  v2_count?: number | null;
  v2_wins?: number | null;
  enemy2ks?: number | null;
  enemy3ks?: number | null;
  enemy4ks?: number | null;
  enemy5ks?: number | null;
  shots_fired_total?: number | null;
  shots_on_target_total?: number | null;
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
