import { describe, expect, it } from 'vitest';
import { normalizeSeasonMaps } from './season-maps.normalizer';

const createValidPayload = () => ({
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
});

describe('normalizeSeasonMaps', () => {
  it('normaliza payload completo mapeando campos para camelCase e preservando lastPlayed null', () => {
    const raw = createValidPayload();
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

  it('rejeita objetos estruturais que sejam arrays (rules, summary, computed)', () => {
    const base = createValidPayload();

    expect(normalizeSeasonMaps({ ...base, rules: [] })).toBeNull();
    expect(normalizeSeasonMaps({ ...base, summary: [] })).toBeNull();
    expect(normalizeSeasonMaps({ ...base, computed: [] })).toBeNull();
  });

  it('preserva computed.distinctMaps sem substituir por maps.length', () => {
    const raw = {
      ...createValidPayload(),
      computed: { distinctMaps: 7 },
      maps: [],
    };

    const res = normalizeSeasonMaps(raw);
    expect(res?.computed.distinctMaps).toBe(7);
    expect(res?.maps.length).toBe(0);
  });

  it('preserva item com lastPlayed null explícito', () => {
    const raw = {
      ...createValidPayload(),
      maps: [
        {
          map: 'de_inferno',
          matches: 1,
          rounds: 20,
          avgRoundsPerMatch: 20.0,
          lastPlayed: null,
        },
      ],
    };

    const res = normalizeSeasonMaps(raw);
    expect(res?.maps.length).toBe(1);
    expect(res?.maps[0].name).toBe('de_inferno');
    expect(res?.maps[0].lastPlayedAt).toBeNull();
  });

  it('ignora item sem lastPlayed nem lastPlayedAt', () => {
    const raw = {
      ...createValidPayload(),
      maps: [
        {
          map: 'de_inferno',
          matches: 1,
          rounds: 20,
          avgRoundsPerMatch: 20.0,
        },
      ],
    };

    const res = normalizeSeasonMaps(raw);
    expect(res?.maps.length).toBe(0);
  });

  it('ignora item com lastPlayed de tipo inválido (ex: number)', () => {
    const raw = {
      ...createValidPayload(),
      maps: [
        {
          map: 'de_inferno',
          matches: 1,
          rounds: 20,
          avgRoundsPerMatch: 20.0,
          lastPlayed: 123456789,
        },
      ],
    };

    const res = normalizeSeasonMaps(raw);
    expect(res?.maps.length).toBe(0);
  });

  it('aceita item com alias lastPlayedAt válido', () => {
    const raw = {
      ...createValidPayload(),
      maps: [
        {
          map: 'de_ancient',
          matches: 4,
          rounds: 80,
          avgRoundsPerMatch: 20.0,
          lastPlayedAt: '2026-08-04T15:00:00Z',
        },
      ],
    };

    const res = normalizeSeasonMaps(raw);
    expect(res?.maps.length).toBe(1);
    expect(res?.maps[0].name).toBe('de_ancient');
    expect(res?.maps[0].lastPlayedAt).toBe('2026-08-04T15:00:00Z');
  });

  it('preserva a ordem dos itens válidos ao ignorar itens inválidos', () => {
    const raw = {
      ...createValidPayload(),
      maps: [
        {
          map: 'de_mirage',
          matches: 3,
          rounds: 60,
          avgRoundsPerMatch: 20.0,
          lastPlayed: '2026-08-04T10:00:00Z',
        },
        {
          map: 'de_invalido',
          matches: 1,
          rounds: 10,
          avgRoundsPerMatch: 10.0,
          // sem lastPlayed
        },
        {
          map: 'de_dust2',
          matches: 5,
          rounds: 100,
          avgRoundsPerMatch: 20.0,
          lastPlayed: '2026-08-04T11:00:00Z',
        },
      ],
    };

    const res = normalizeSeasonMaps(raw);
    expect(res?.maps.length).toBe(2);
    expect(res?.maps[0].name).toBe('de_mirage');
    expect(res?.maps[1].name).toBe('de_dust2');
  });
});
