export interface NewsIndexItemDto {
  slug?: string;
  title?: string;
  excerpt?: string | null;
  image_url?: string | null;
  published_at?: string | null;
}

export interface NewsIndexDto {
  items?: NewsIndexItemDto[];
}
