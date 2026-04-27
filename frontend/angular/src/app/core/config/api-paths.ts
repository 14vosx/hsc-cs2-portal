export const CS2_API_BASE_PATH = '/api/cs2/v2';

export const cs2ApiPaths = {
  health: `${CS2_API_BASE_PATH}/health.json`,
  ranking: `${CS2_API_BASE_PATH}/ranking.json`,
  matches: `${CS2_API_BASE_PATH}/matches.json`,
  match: (id: number | string) => `${CS2_API_BASE_PATH}/match/${encodeURIComponent(String(id))}.json`,
  maps: `${CS2_API_BASE_PATH}/maps.json`,
  map: (map: string) => `${CS2_API_BASE_PATH}/map/${encodeURIComponent(map)}.json`,
  player: (steamId64: string) => `${CS2_API_BASE_PATH}/player/${encodeURIComponent(steamId64)}.json`,
  steamCache: (steamId64: string) =>
    `${CS2_API_BASE_PATH}/steam-cache/${encodeURIComponent(steamId64)}.json`,
  newsIndex: '/content/news/',
  newsItem: (slug: string) => `/content/news/${encodeURIComponent(slug)}/`,
} as const;
