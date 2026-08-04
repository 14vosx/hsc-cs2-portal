import { describe, expect, it } from 'vitest';

import { normalizeMatchDetail, normalizeMatchesIndex } from './match.normalizer';

describe('normalizeMatchesIndex', () => {
  it('retorna null para payload raiz nulo ou indefinido', () => {
    expect(normalizeMatchesIndex(null)).toBeNull();
    expect(normalizeMatchesIndex(undefined)).toBeNull();
  });

  it('retorna null para tipos primitivos ou arrays na raiz', () => {
    expect(normalizeMatchesIndex('invalid')).toBeNull();
    expect(normalizeMatchesIndex(123)).toBeNull();
    expect(normalizeMatchesIndex(true)).toBeNull();
    expect(normalizeMatchesIndex([])).toBeNull();
  });

  it('retorna null quando falta generatedAt ou não é string', () => {
    expect(normalizeMatchesIndex({ matches: [] })).toBeNull();
    expect(normalizeMatchesIndex({ generatedAt: 12345, matches: [] })).toBeNull();
  });

  it('retorna null quando matches não é um array', () => {
    expect(normalizeMatchesIndex({ generatedAt: '2026-08-04T12:00:00Z', matches: 'invalid' })).toBeNull();
  });

  it('aceita array de matches vazio como payload válido', () => {
    const result = normalizeMatchesIndex({
      generatedAt: '2026-08-04T12:00:00Z',
      matches: [],
    });
    expect(result).toEqual({
      generatedAt: '2026-08-04T12:00:00Z',
      matches: [],
    });
  });

  it('normaliza payload completo com conversão de snake_case para camelCase e preservação da ordem', () => {
    const rawPayload = {
      generatedAt: '2026-08-04T12:00:00Z',
      matches: [
        {
          matchid: 101,
          start_time: '2026-08-04T10:00:00Z',
          end_time: '2026-08-04T11:00:00Z',
          winner: 'Team Alpha',
          series_type: 'BO3',
          team1_name: 'Team Alpha',
          team1_score: 2,
          team2_name: 'Team Beta',
          team2_score: 1,
          server_ip: '192.168.1.1:27015',
          maps: [
            {
              mapnumber: 1,
              start_time: '2026-08-04T10:05:00Z',
              end_time: '2026-08-04T10:30:00Z',
              winner: 'Team Alpha',
              mapname: 'de_mirage',
              team1_score: 13,
              team2_score: 9,
            },
            {
              mapnumber: 2,
              start_time: '2026-08-04T10:35:00Z',
              end_time: '2026-08-04T11:00:00Z',
              winner: 'Team Beta',
              mapname: 'de_inferno',
              team1_score: 8,
              team2_score: 13,
            },
          ],
        },
        {
          matchid: 102,
          start_time: '2026-08-04T11:30:00Z',
          end_time: null,
          winner: null,
          series_type: 'BO1',
          team1_name: 'Team Gamma',
          team1_score: 0,
          team2_name: 'Team Delta',
          team2_score: 0,
          server_ip: null,
          maps: [],
        },
      ],
    };

    const result = normalizeMatchesIndex(rawPayload);

    expect(result).not.toBeNull();
    expect(result?.generatedAt).toBe('2026-08-04T12:00:00Z');
    expect(result?.matches).toHaveLength(2);

    expect(result?.matches[0].id).toBe(101);
    expect(result?.matches[0].startedAt).toBe('2026-08-04T10:00:00Z');
    expect(result?.matches[0].endedAt).toBe('2026-08-04T11:00:00Z');
    expect(result?.matches[0].winner).toBe('Team Alpha');
    expect(result?.matches[0].seriesType).toBe('BO3');
    expect(result?.matches[0].team1).toEqual({ name: 'Team Alpha', score: 2 });
    expect(result?.matches[0].team2).toEqual({ name: 'Team Beta', score: 1 });
    expect(result?.matches[0].serverIp).toBe('192.168.1.1:27015');
    expect(result?.matches[0].maps).toHaveLength(2);

    expect(result?.matches[0].maps[0]).toEqual({
      mapNumber: 1,
      startedAt: '2026-08-04T10:05:00Z',
      endedAt: '2026-08-04T10:30:00Z',
      winner: 'Team Alpha',
      name: 'de_mirage',
      team1Score: 13,
      team2Score: 9,
    });

    expect(result?.matches[1].id).toBe(102);
    expect(result?.matches[1].seriesType).toBe('BO1');
    expect(result?.matches[1].serverIp).toBeNull();
  });

  it('ignora itens de match com matchid inválido ou sem identidade', () => {
    const rawPayload = {
      generatedAt: '2026-08-04T12:00:00Z',
      matches: [
        'not-an-object',
        { team1_name: 'No ID Match' },
        { matchid: 'invalid-id' },
        { matchid: 201, team1_name: 'Valid Match' },
      ],
    };

    const result = normalizeMatchesIndex(rawPayload);

    expect(result?.matches).toHaveLength(1);
    expect(result?.matches[0].id).toBe(201);
  });

  it('preserva valores null do contrato em vez de converter para string vazia ou default', () => {
    const rawPayload = {
      generatedAt: '2026-08-04T12:00:00Z',
      matches: [
        {
          matchid: 301,
          start_time: null,
          end_time: null,
          winner: null,
          series_type: null,
          team1_name: null,
          team1_score: null,
          team2_name: null,
          team2_score: null,
          server_ip: null,
          maps: [],
        },
      ],
    };

    const result = normalizeMatchesIndex(rawPayload);
    const match = result?.matches[0];

    expect(match?.startedAt).toBeNull();
    expect(match?.endedAt).toBeNull();
    expect(match?.winner).toBeNull();
    expect(match?.seriesType).toBeNull();
    expect(match?.team1.name).toBeNull();
    expect(match?.team1.score).toBeNull();
    expect(match?.team2.name).toBeNull();
    expect(match?.team2.score).toBeNull();
    expect(match?.serverIp).toBeNull();
  });
});

describe('normalizeMatchDetail', () => {
  it('retorna null para payload raiz nulo, sem generatedAt ou com id inválido', () => {
    expect(normalizeMatchDetail(null)).toBeNull();
    expect(normalizeMatchDetail({ generatedAt: '2026-08-04T12:00:00Z' })).toBeNull();
    expect(normalizeMatchDetail({ matchid: 101 })).toBeNull();
    expect(normalizeMatchDetail({ generatedAt: '2026-08-04T12:00:00Z', matchid: 'not-int' })).toBeNull();
  });

  it('normaliza detalhe de partida válido com snake_case e tipos corretos', () => {
    const rawPayload = {
      generatedAt: '2026-08-04T12:00:00Z',
      matchid: 501,
      match: {
        matchid: 501,
        start_time: '2026-08-04T10:00:00Z',
        end_time: '2026-08-04T11:30:00Z',
        winner: 'Team A',
        series_type: 'BO3',
        team1_name: 'Team A',
        team1_score: 2,
        team2_name: 'Team B',
        team2_score: 1,
        server_ip: '10.0.0.1:27015',
      },
      computed: {
        teams: ['Team A', 'Team B'],
        mapsPlayed: 3,
        bestOf: 3,
        isPartialSeries: 0,
      },
      maps: [
        {
          matchid: 501,
          mapnumber: 1,
          start_time: '2026-08-04T10:00:00Z',
          end_time: '2026-08-04T10:40:00Z',
          winner: 'Team A',
          mapname: 'de_nuke',
          team1_score: 13,
          team2_score: 7,
          teams: [
            {
              team: 'Team A',
              players: [
                {
                  matchid: 501,
                  mapnumber: 1,
                  steamid64: '76561198000000001',
                  team: 'Team A',
                  name: 'Player 1',
                  kills: 22,
                  deaths: 12,
                  damage: 2100,
                  assists: 5,
                  enemy5ks: 0,
                  enemy4ks: 1,
                  enemy3ks: 2,
                  enemy2ks: 3,
                  utility_count: 10,
                  utility_damage: 150,
                  utility_successes: 8,
                  utility_enemies: 4,
                  flash_count: 12,
                  flash_successes: 6,
                  health_points_removed_total: 2100,
                  health_points_dealt_total: 2200,
                  shots_fired_total: 400,
                  shots_on_target_total: 120,
                  v1_count: 2,
                  v1_wins: 1,
                  v2_count: 1,
                  v2_wins: 0,
                  entry_count: 4,
                  entry_wins: 3,
                  equipment_value: 45000,
                  money_saved: 12000,
                  kill_reward: 6600,
                  live_time: 1800,
                  head_shot_kills: 11,
                  cash_earned: 35000,
                  enemies_flashed: 9,
                },
              ],
              teamTotals: {
                kills: 22,
                deaths: 12,
                damage: 2100,
              },
            },
          ],
        },
      ],
      totals: [
        {
          team: 'Team A',
          players: [
            {
              steamid64: '76561198000000001',
              name: 'Player 1',
              aggregates: {
                kills: 60,
                deaths: 35,
                damage: 6100,
                assists: 15,
              },
            },
          ],
          teamTotals: {
            kills: 60,
            deaths: 35,
            damage: 6100,
          },
        },
      ],
      notes: {
        limitations: ['ETL incomplete data for round 14'],
      },
    };

    const result = normalizeMatchDetail(rawPayload);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(501);
    expect(result?.generatedAt).toBe('2026-08-04T12:00:00Z');
    expect(result?.computed.bestOf).toBe(3);
    expect(result?.computed.partialSeries).toBe(false);

    expect(result?.maps[0].teams[0].players[0].steamId64).toBe('76561198000000001');
    expect(result?.maps[0].teams[0].players[0].kills).toBe(22);
    expect(result?.maps[0].teams[0].players[0].enemy4Ks).toBe(1);

    expect(result?.totals[0].players[0].steamId64).toBe('76561198000000001');
    expect(result?.totals[0].players[0].aggregates.kills).toBe(60);

    expect(result?.limitations).toEqual(['ETL incomplete data for round 14']);
  });

  it('converte isPartialSeries 1 para true e 0 para false', () => {
    const res1 = normalizeMatchDetail({
      generatedAt: '2026-08-04T12:00:00Z',
      matchid: 601,
      computed: { isPartialSeries: 1 },
    });
    expect(res1?.computed.partialSeries).toBe(true);

    const res0 = normalizeMatchDetail({
      generatedAt: '2026-08-04T12:00:00Z',
      matchid: 602,
      computed: { isPartialSeries: 0 },
    });
    expect(res0?.computed.partialSeries).toBe(false);
  });

  it('preserva SteamID64 como string e converte numérico para string sem alterar valor', () => {
    const res = normalizeMatchDetail({
      generatedAt: '2026-08-04T12:00:00Z',
      matchid: 701,
      totals: [
        {
          team: 'Team A',
          players: [
            { steamid64: '76561198000000001', name: 'Str ID', aggregates: {} },
            { steamid64: 12345678, name: 'Num ID', aggregates: {} },
          ],
        },
      ],
    });

    expect(res?.totals[0].players[0].steamId64).toBe('76561198000000001');
    expect(res?.totals[0].players[1].steamId64).toBe('12345678');
  });

  it('normaliza estatísticas nulas ou inválidas para 0', () => {
    const res = normalizeMatchDetail({
      generatedAt: '2026-08-04T12:00:00Z',
      matchid: 801,
      maps: [
        {
          teams: [
            {
              players: [
                {
                  kills: null,
                  deaths: 'invalid',
                  damage: undefined,
                },
              ],
            },
          ],
        },
      ],
    });

    const p = res?.maps[0].teams[0].players[0];
    expect(p?.kills).toBe(0);
    expect(p?.deaths).toBe(0);
    expect(p?.damage).toBe(0);
  });

  it('filtra limitações inválidas que não sejam strings', () => {
    const res = normalizeMatchDetail({
      generatedAt: '2026-08-04T12:00:00Z',
      matchid: 901,
      limitations: ['Valid note', 123, null, 'Another note'],
    });

    expect(res?.limitations).toEqual(['Valid note', 'Another note']);
  });

  it('preserva a ordem recebida sem reordenar partidas, mapas ou jogadores', () => {
    const res = normalizeMatchDetail({
      generatedAt: '2026-08-04T12:00:00Z',
      matchid: 1001,
      maps: [
        { mapnumber: 2, mapname: 'de_dust2' },
        { mapnumber: 1, mapname: 'de_inferno' },
      ],
    });

    expect(res?.maps.map((m) => m.name)).toEqual(['de_dust2', 'de_inferno']);
  });
});
