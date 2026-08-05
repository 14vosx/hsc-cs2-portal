export interface NewsSummary {
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string | null;
  readonly imageUrl: string | null;
  readonly publishedAt: string | null;
}

export interface NewsIndex {
  readonly count: number;
  readonly items: readonly NewsSummary[];
}

export interface NewsArticle extends NewsSummary {
  readonly contentHtml: string;
}
