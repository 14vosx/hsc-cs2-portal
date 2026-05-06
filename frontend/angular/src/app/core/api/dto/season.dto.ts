export interface SeasonSummaryDto {
  matches?: number;
  maps?: number;
  rounds?: number;
  players?: number;
  lastMapEndedAt?: string | null;
}

export interface SeasonDto {
  slug?: string;
  name?: string;
  description?: string | null;
  status?: string;
  start_at?: string | null;
  end_at?: string | null;
  cover_image_url?: string | null;
  coverImageUrl?: string | null;
  image_url?: string | null;
  hero_image_url?: string | null;
  summary?: SeasonSummaryDto;
}

export interface SeasonsIndexDto {
  generatedAt?: string;
  activeSeasonSlug?: string | null;
  seasons?: SeasonDto[];
}

export interface SeasonDetailDto {
  generatedAt?: string;
  season?: SeasonDto | null;
  summary?: SeasonSummaryDto | null;
}
