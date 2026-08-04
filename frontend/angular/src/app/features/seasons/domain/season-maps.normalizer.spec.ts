import { describe, expect, it } from 'vitest';
import { normalizeSeasonMaps } from './season-maps.normalizer';

describe('normalizeSeasonMaps', () => {
  it('normaliza payload completo mapeando campos para camelCase e preservando lastPlayed null', () => {
    const raw = {
      generatedAt: '2026-08-04T12:00:00Z',
      season: {
        slug: 'season-1',
        name: 'Season 1',
        description: null,
        status: 'active',
      },
      rules: { minRoundsPerMap: 12 },
      summary: { matches: 5, maps: 8, rounds: 160, players: 15 },
      computed: { distinctMaps: 4 },
      maps: [
        {
          map: 'de_mirage',
          matches: 3,
          rounds: 60,
          avgRoundsPerMatch: 20.0,
          lastPlayed: '2026-08-04T10:00:00Z',
        },
        {
          map: 'de_nuke',
          matches: 2,
          rounds: 40,
          avgRoundsPerMatch: 20.0,
          lastPlayed: null,
        },
      ],
    };

    const res = normalizeSeasonMaps(raw);

    expect(res).not.toBeNull();
    expect(res?.generatedAt).toBe('2026-08-04T12:00:00Z');
    expect(res?.computed.distinctMaps).toBe(4);
    expect(res?.maps.length).toBe(2);
    expect(res?.maps[0].name).toBe('de_mirage');
    expect(res?.maps[0].averageRoundsPerMatch).toBe(20.0);
    expect(res?.maps[0].lastPlayedAt).toBe('2026-08-04T10:00:00Z');
    expect(res?.maps[1].name).toBe('de_nuke');
    expect(res?.maps[1].lastPlayedAt).toBeNull();
  });

  it('retorna null para root sem geradoAt ou season.slug', () => {
    expect(normalizeSeasonMaps(null)).toBeNull();
    expect(normalizeSeasonMaps({ generatedAt: '2026-08-04T12:00:00Z' })).toBeNull();
  });

  it('preserva computed.distinctMaps sem substituir por maps.length', () => {
    const raw = {
      generatedAt: '2026-08-04T12:00:00Z',
      season: { slug: 'season-1' },
      rules: { minRoundsPerMap: 0 },
      summary: { matches: 0, maps: 0, rounds: 0, players: 0 },
      computed: { distinctMaps: 7 },
      maps: [],
    };

    const res = normalizeSeasonMaps(raw);
    expect(res?.computed.distinctMaps).toBe(7);
    expect(res?.maps.length).toBe(0);
  });
});
