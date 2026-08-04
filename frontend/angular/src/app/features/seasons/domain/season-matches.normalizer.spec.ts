import { describe, expect, it } from 'vitest';
import { normalizeSeasonMatches } from './season-matches.normalizer';

describe('normalizeSeasonMatches', () => {
  it('normaliza payload completo convertendo snake_case para camelCase', () => {
    const raw = {
      generatedAt: '2026-08-04T12:00:00Z',
      season: {
        slug: 'season-1',
        name: 'Season 1',
        description: 'Primeira temporada',
        status: 'active',
        start_at: '2026-01-01T00:00:00Z',
        end_at: '2026-06-30T23:59:59Z',
        cover_image_url: 'https://example.com/cover.png',
      },
      rules: {
        minRoundsPerMap: 12,
        seasonMembership: 'regular',
        matchDetailEndpoint: '/api/cs2/v2/match/{id}.json',
        mapDetailEndpoint: '/api/cs2/v2/map/{name}.json',
      },
      summary: {
        matches: 10,
        maps: 25,
        rounds: 400,
        players: 30,
        lastMapEndedAt: '2026-06-30T20:00:00Z',
      },
      computed: {
        firstMapStartedAt: '2026-01-02T10:00:00Z',
      },
      matches: [
        {
          matchid: 101,
          start_time: '2026-01-02T10:00:00Z',
          end_time: '2026-01-02T11:30:00Z',
          winner: 'Team A',
          series_type: 'BO3',
          team1_name: 'Team A',
          team1_score: 2,
          team2_name: 'Team B',
          team2_score: 1,
          server_ip: '10.0.0.1',
          seasonMapCount: 3,
          seasonRounds: 45,
          seasonFirstMapStartedAt: '2026-01-02T10:00:00Z',
          seasonLastMapEndedAt: '2026-01-02T11:30:00Z',
          maps: [
            {
              mapnumber: 1,
              start_time: '2026-01-02T10:00:00Z',
              end_time: '2026-01-02T10:40:00Z',
              winner: 'Team A',
              mapname: 'de_nuke',
              team1_score: 13,
              team2_score: 7,
              rounds: 20,
            },
          ],
        },
      ],
    };

    const normalized = normalizeSeasonMatches(raw);

    expect(normalized).not.toBeNull();
    expect(normalized?.generatedAt).toBe('2026-08-04T12:00:00Z');
    expect(normalized?.season.slug).toBe('season-1');
    expect(normalized?.season.coverImageUrl).toBe('https://example.com/cover.png');
    expect(normalized?.matches.length).toBe(1);

    const m = normalized?.matches[0];
    expect(m?.id).toBe(101);
    expect(m?.team1.name).toBe('Team A');
    expect(m?.team1.score).toBe(2);
    expect(m?.maps[0].name).toBe('de_nuke');
    expect(m?.maps[0].mapNumber).toBe(1);
    expect(m?.maps[0].team1Score).toBe(13);
  });

  it('retorna null para root inválido ou quando faltar geradoAt ou season.slug', () => {
    expect(normalizeSeasonMatches(null)).toBeNull();
    expect(normalizeSeasonMatches({})).toBeNull();
    expect(normalizeSeasonMatches({ generatedAt: '2026-08-04T12:00:00Z', season: { name: 'Sem slug' } })).toBeNull();
  });

  it('ignora partidas e mapas inválidos sem invalidar todo o root', () => {
    const raw = {
      generatedAt: '2026-08-04T12:00:00Z',
      season: { slug: 'season-1' },
      rules: { minRoundsPerMap: 0 },
      summary: { matches: 1, maps: 1, rounds: 10, players: 10 },
      computed: { firstMapStartedAt: null },
      matches: [
        { matchid: -1 }, // inválido
        {
          matchid: 102,
          team1_score: 1,
          team2_score: 0,
          seasonMapCount: 1,
          seasonRounds: 16,
          maps: [
            { mapnumber: 1, mapname: '', team1_score: 16, team2_score: 0, rounds: 16 }, // nome de mapa inválido
            { mapnumber: 2, mapname: 'de_mirage', team1_score: 16, team2_score: 0, rounds: 16 }, // válido
          ],
        },
      ],
    };

    const res = normalizeSeasonMatches(raw);
    expect(res?.matches.length).toBe(1);
    expect(res?.matches[0].id).toBe(102);
    expect(res?.matches[0].maps.length).toBe(1);
    expect(res?.matches[0].maps[0].name).toBe('de_mirage');
  });

  it('aceita array de partidas vazio', () => {
    const raw = {
      generatedAt: '2026-08-04T12:00:00Z',
      season: { slug: 'season-1' },
      rules: { minRoundsPerMap: 0 },
      summary: { matches: 0, maps: 0, rounds: 0, players: 0 },
      computed: { firstMapStartedAt: null },
      matches: [],
    };

    const res = normalizeSeasonMatches(raw);
    expect(res).not.toBeNull();
    expect(res?.matches).toEqual([]);
  });
});
