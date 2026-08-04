import type { NewsArticle, NewsIndex, NewsSummary } from './news.model';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeNewsSummary(item: unknown): NewsSummary | null {
  if (!isObject(item)) {
    return null;
  }
  if (typeof item['slug'] !== 'string' || typeof item['title'] !== 'string') {
    return null;
  }
  const slug = item['slug'].trim();
  const title = item['title'].trim();
  if (slug.length === 0 || title.length === 0) {
    return null;
  }
  if (!('excerpt' in item) || (typeof item['excerpt'] !== 'string' && item['excerpt'] !== null)) {
    return null;
  }
  if (!('image_url' in item) || (typeof item['image_url'] !== 'string' && item['image_url'] !== null)) {
    return null;
  }
  if (!('published_at' in item) || (typeof item['published_at'] !== 'string' && item['published_at'] !== null)) {
    return null;
  }

  return {
    slug,
    title,
    excerpt: item['excerpt'],
    imageUrl: item['image_url'],
    publishedAt: item['published_at'],
  };
}

export function normalizeNewsIndex(payload: unknown): NewsIndex | null {
  if (!isObject(payload)) {
    return null;
  }
  if (payload['ok'] !== true) {
    return null;
  }
  const count = payload['count'];
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
    return null;
  }
  const itemsRaw = payload['items'];
  if (!Array.isArray(itemsRaw)) {
    return null;
  }

  const items: NewsSummary[] = [];
  for (const itemRaw of itemsRaw) {
    const summary = normalizeNewsSummary(itemRaw);
    if (summary !== null) {
      items.push(summary);
    }
  }

  return {
    count,
    items,
  };
}

export function normalizeNewsArticle(payload: unknown): NewsArticle | null {
  if (!isObject(payload)) {
    return null;
  }
  if (payload['ok'] !== true) {
    return null;
  }
  const item = payload['item'];
  if (!isObject(item)) {
    return null;
  }
  if (typeof item['slug'] !== 'string' || typeof item['title'] !== 'string') {
    return null;
  }
  const slug = item['slug'].trim();
  const title = item['title'].trim();
  if (slug.length === 0 || title.length === 0) {
    return null;
  }
  if (!('excerpt' in item) || (typeof item['excerpt'] !== 'string' && item['excerpt'] !== null)) {
    return null;
  }
  if (!('content' in item) || typeof item['content'] !== 'string') {
    return null;
  }
  if (!('image_url' in item) || (typeof item['image_url'] !== 'string' && item['image_url'] !== null)) {
    return null;
  }
  if (!('published_at' in item) || (typeof item['published_at'] !== 'string' && item['published_at'] !== null)) {
    return null;
  }

  return {
    slug,
    title,
    excerpt: item['excerpt'],
    contentHtml: item['content'],
    imageUrl: item['image_url'],
    publishedAt: item['published_at'],
  };
}
