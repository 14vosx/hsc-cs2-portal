import { describe, expect, it } from 'vitest';

import { normalizeMapDetail, normalizeMapsIndex } from './map.normalizer';

describe('normalizeMapsIndex', () => {
  it('retorna null para payload nulo, indefinido ou primitivos', () => {
    expect(normalizeMapsIndex(null)).toBeNull();
    expect(normalizeMapsIndex(undefined)).toBeNull();
    expect(normalizeMapsIndex('invalid')).toBeNull();
    expect(normalizeMapsIndex(123)).toBeNull();
    expect(normalizeMapsIndex(true)).toBeNull();
  });

  it('retorna null quando generatedAt ou maps não é válido', () => {
    expect(normalizeMapsIndex({ maps: [] })).toBeNull();
    expect(normalizeMapsIndex({ generatedAt: '2026-08-04T12:00:00Z', maps: 'not-array' })).toBeNull();
  });

  it('aceita array maps vazio como payload válido', () => {
    const result = normalizeMapsIndex({
      generatedAt: '2026-08-04T12:00:00Z',
      maps: [],
    });

    expect(result).toEqual({
      generatedAt: '2026-08-04T12:00:00Z',
      maps: [],
    });
  });

  it('normaliza payload de índice de mapas completo preservando a ordem remota', () => {
    const rawPayload = {
      generatedAt: '2026-08-04T12:00:00Z',
      maps: [
        {
          map: 'de_mirage',
          matches: 45,
          rounds: 980,
          avgRoundsPerMatch: 21.78,
          lastPlayed: '2026-08-04T10:00:00Z',
        },
        {
          map: 'de_inferno',
          matches: 30,
          rounds: 660,
          avgRoundsPerMatch: 22.0,
          lastPlayed: '2026-08-03T18:00:00Z',
        },
      ],
    };

    const result = normalizeMapsIndex(rawPayload);

    expect(result).not.toBeNull();
    expect(result?.generatedAt).toBe('2026-08-04T12:00:00Z');
    expect(result?.maps).toHaveLength(2);

    expect(result?.maps[0]).toEqual({
      name: 'de_mirage',
      matches: 45,
      rounds: 980,
      averageRoundsPerMatch: 21.78,
      lastPlayedAt: '2026-08-04T10:00:00Z',
    });

    expect(result?.maps[1].name).toBe('de_inferno');
  });

  it('ignora mapa sem nome ou sem lastPlayed válido', () => {
    const rawPayload = {
      generatedAt: '2026-08-04T12:00:00Z',
      maps: [
        { map: '', matches: 10, rounds: 200, lastPlayed: '2026-08-04T10:00:00Z' },
        { map: 'de_nuke', matches: 5, rounds: 100, lastPlayed: '' },
        { map: 'de_anubis', matches: 12, rounds: 250, lastPlayed: '2026-08-04T11:00:00Z' },
      ],
    };

    const result = normalizeMapsIndex(rawPayload);

    expect(result?.maps).toHaveLength(1);
    expect(result?.maps[0].name).toBe('de_anubis');
  });

  it('normaliza números inválidos ou nulos defensivamente para 0', () => {
    const rawPayload = {
      generatedAt: '2026-08-04T12:00:00Z',
      maps: [
        {
          map: 'de_ancient',
          matches: 'not-a-number',
          rounds: null,
          avgRoundsPerMatch: undefined,
          lastPlayed: '2026-08-04T10:00:00Z',
        },
      ],
    };

    const result = normalizeMapsIndex(rawPayload);
    const mapItem = result?.maps[0];

    expect(mapItem?.matches).toBe(0);
    expect(mapItem?.rounds).toBe(0);
    expect(mapItem?.averageRoundsPerMatch).toBe(0);
  });
});

describe('normalizeMapDetail', () => {
  it('retorna null se a raiz, nome ou lifetime for inválido', () => {
    expect(normalizeMapDetail(null)).toBeNull();
    expect(normalizeMapDetail({ generatedAt: '2026-08-04T12:00:00Z' })).toBeNull();
    expect(normalizeMapDetail({ generatedAt: '2026-08-04T12:00:00Z', map: 'de_dust2' })).toBeNull();
    expect(
      normalizeMapDetail({
        generatedAt: '2026-08-04T12:00:00Z',
        map: 'de_dust2',
        lifetime: { lastPlayed: '' },
      })
    ).toBeNull();
  });

  it('normaliza detalhe do mapa completo preservando ordem das partidas recentes e nulabilidade', () => {
    const rawPayload = {
      generatedAt: '2026-08-04T12:00:00Z',
      map: 'de_dust2',
      lifetime: {
        matches: 50,
        rounds: 1100,
        avgRoundsPerMatch: 22.0,
        lastPlayed: '2026-08-04T11:00:00Z',
      },
      recentMatches: [
        {
          matchid: 1001,
          seriesType: 'BO3',
          endedAt: '2026-08-04T11:00:00Z',
          winner: 'Team 1',
          team1: { name: 'Team 1', score: 13 },
          team2: { name: 'Team 2', score: 9 },
          mapNumber: 1,
          mapScore: { team1: 13, team2: 9 },
        },
        {
          matchid: 1002,
          seriesType: null,
          endedAt: null,
          winner: null,
          team1: { name: null, score: null },
          team2: { name: null, score: null },
          mapNumber: null,
          mapScore: { team1: null, team2: null },
        },
      ],
    };

    const result = normalizeMapDetail(rawPayload);

    expect(result).not.toBeNull();
    expect(result?.generatedAt).toBe('2026-08-04T12:00:00Z');
    expect(result?.name).toBe('de_dust2');

    expect(result?.lifetime).toEqual({
      matches: 50,
      rounds: 1100,
      averageRoundsPerMatch: 22.0,
      lastPlayedAt: '2026-08-04T11:00:00Z',
    });

    expect(result?.recentMatches).toHaveLength(2);

    expect(result?.recentMatches[0].matchId).toBe(1001);
    expect(result?.recentMatches[0].team1).toEqual({ name: 'Team 1', score: 13 });
    expect(result?.recentMatches[0].mapScore).toEqual({ team1: 13, team2: 9 });

    expect(result?.recentMatches[1].matchId).toBe(1002);
    expect(result?.recentMatches[1].winner).toBeNull();
    expect(result?.recentMatches[1].team1.name).toBeNull();
    expect(result?.recentMatches[1].team1.score).toBeNull();
  });

  it('ignora partidas recentes com matchid inválido ou ausente', () => {
    const rawPayload = {
      generatedAt: '2026-08-04T12:00:00Z',
      map: 'de_train',
      lifetime: {
        matches: 5,
        rounds: 100,
        avgRoundsPerMatch: 20,
        lastPlayed: '2026-08-04T10:00:00Z',
      },
      recentMatches: [
        { matchid: 'invalid' },
        { noMatchId: true },
        { matchid: 2001, winner: 'Team X' },
      ],
    };

    const result = normalizeMapDetail(rawPayload);

    expect(result?.recentMatches).toHaveLength(1);
    expect(result?.recentMatches[0].matchId).toBe(2001);
  });

  it('não recalcula placares nem infere vencedores', () => {
    const rawPayload = {
      generatedAt: '2026-08-04T12:00:00Z',
      map: 'de_vertigo',
      lifetime: {
        matches: 1,
        rounds: 20,
        avgRoundsPerMatch: 20,
        lastPlayed: '2026-08-04T10:00:00Z',
      },
      recentMatches: [
        {
          matchid: 3001,
          winner: null,
          team1: { name: 'Alpha', score: 16 },
          team2: { name: 'Beta', score: 4 },
        },
      ],
    };

    const result = normalizeMapDetail(rawPayload);

    expect(result?.recentMatches[0].winner).toBeNull();
  });
});
