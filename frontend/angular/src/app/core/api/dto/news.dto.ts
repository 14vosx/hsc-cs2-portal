export interface NewsIndexItemDto {
  slug?: string;
  title?: string;
  excerpt?: string | null;
  image_url?: string | null;
  published_at?: string | null;
}

export interface NewsIndexDto {
  ok?: boolean;
  count?: number;
  items?: NewsIndexItemDto[];
  generatedAt?: string;
  source?: string;
}

export interface NewsDetailItemDto {
  slug?: string;
  title?: string;
  excerpt?: string | null;
  content?: string | null;
  image_url?: string | null;
  published_at?: string | null;
}

export interface NewsDetailDto {
  ok?: boolean;
  item?: NewsDetailItemDto | null;
}
