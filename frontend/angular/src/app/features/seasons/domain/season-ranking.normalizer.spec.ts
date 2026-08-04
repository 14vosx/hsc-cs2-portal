import { describe, expect, it } from 'vitest';

import { normalizeSeasonRanking } from './season-ranking.normalizer';

describe('normalizeSeasonRanking', () => {
  it('normaliza um payload sazonal completo usando os nomes reais snake_case do contrato', () => {
    const result = normalizeSeasonRanking({
      generated_at: '2026-08-03T12:00:00Z',
      season: {
        slug: 'summer-2026',
        name: 'Summer 2026',
        description: 'Descrição',
        status: 'active',
        start_at: '2026-07-01',
        end_at: '2026-08-31',
        cover_image_url: 'https://cdn.example/cover.jpg',
      },
      rules: {
        min_rounds_per_map: 12,
        ranking_formula_version: 'v2',
        prize_eligibility: {
          min_maps_played: 3,
          min_rounds_played: 24,
        },
      },
      summary: {
        matches: 10,
        maps: 6,
        rounds: 160,
        players: 20,
        eligible_players: 8,
        last_map_ended_at: '2026-08-03T11:00:00Z',
      },
      top_prize_candidates: [{ name: 'Top One' }, { name: 'Top Two' }],
      players: [{ name: 'First' }, { name: 'Second' }],
    });

    expect(result).not.toBeNull();
    expect(result?.season.slug).toBe('summer-2026');
    expect(result?.summary.players).toBe(20);
    expect(result?.topPrizeCandidates[0].name).toBe('Top One');
    expect(result?.players[1].name).toBe('Second');
  });

  it('aceita aliases camelCase equivalentes', () => {
    const result = normalizeSeasonRanking({
      generatedAt: '2026-08-03T12:00:00Z',
      season: {
        slug: 'spring-2026',
        startAt: '2026-01-01',
        endAt: '2026-03-01',
      },
      rules: {
        minRoundsPerMap: 10,
        rankingFormulaVersion: 'v3',
        prizeEligibility: {
          minMapsPlayed: 2,
          minRoundsPlayed: 8,
        },
      },
      summary: {
        eligiblePlayers: 5,
        lastMapEndedAt: '2026-02-01',
      },
      players: [{ name: 'Camel' }],
    });

    expect(result?.season.startAt).toBe('2026-01-01');
    expect(result?.rules.minRoundsPerMap).toBe(10);
    expect(result?.summary.eligiblePlayers).toBe(5);
    expect(result?.players[0].name).toBe('Camel');
  });

  it('usa a precedência correta para a capa e faz fallback quando o primeiro alias está vazio', () => {
    const result = normalizeSeasonRanking({
      season: {
        slug: 'summer-2026',
        cover_image_url: ' ',
        coverImageUrl: 'https://cdn.example/cover-camel.jpg',
        image_url: 'https://cdn.example/image.jpg',
      },
    });

    expect(result?.season.coverImageUrl).toBe('https://cdn.example/cover-camel.jpg');
  });

  it('usa a precedência correta para o avatar e faz fallback quando o primeiro alias está vazio', () => {
    const result = normalizeSeasonRanking({
      season: {
        slug: 'summer-2026',
      },
      players: [
        {
          avatarUrl: ' ',
          avatar_url: 'https://cdn.example/avatar-snake.jpg',
          steamAvatarUrl: 'https://cdn.example/avatar-camel.jpg',
        },
      ],
    });

    expect(result?.players[0].avatarUrl).toBe('https://cdn.example/avatar-snake.jpg');
  });

  it('aceita aliases de rules, prizeEligibility, summary e player', () => {
    const result = normalizeSeasonRanking({
      season: {
        slug: 'summer-2026',
      },
      rules: {
        min_rounds_per_map: 8,
        ranking_formula_version: 'v4',
        prize_eligibility: {
          min_maps_played: 4,
          min_rounds_played: 16,
        },
      },
      summary: {
        eligible_players: 7,
        last_map_ended_at: '2026-08-03',
      },
      players: [
        {
          prize_rank: 2,
          prize_eligible: true,
          prize_eligibility_reason: 'eligible',
          steamid64: '76561198000000001',
          matches_played: 10,
          maps_played: 8,
          rounds_played: 40,
          kd_ratio: 1.6,
          headshot_pct: 45,
          utility_dmg_per_round: 4.2,
          kills_per_round: 0.7,
          assists_per_round: 0.2,
          deaths_per_round: 0.4,
          impact_rating: 1.1,
          win_rate: 0.8,
          sample_weight: 0.3,
          score: 95,
        },
      ],
    });

    expect(result?.rules.minRoundsPerMap).toBe(8);
    expect(result?.rules.prizeEligibility.minMapsPlayed).toBe(4);
    expect(result?.summary.eligiblePlayers).toBe(7);
    expect(result?.players[0].prizeRank).toBe(2);
    expect(result?.players[0].prizeEligible).toBe(true);
    expect(result?.players[0].steamId64).toBe('76561198000000001');
    expect(result?.players[0].score).toBe(95);
  });

  it('retorna ranking válido com players vazio quando players é []', () => {
    const result = normalizeSeasonRanking({
      season: {
        slug: 'summer-2026',
      },
      players: [],
    });

    expect(result).not.toBeNull();
    expect(result?.players).toEqual([]);
  });

  it('retorna ranking válido com players vazio quando players contém somente itens malformados', () => {
    const result = normalizeSeasonRanking({
      season: {
        slug: 'summer-2026',
      },
      players: [null, 'bad', 3],
    });

    expect(result).not.toBeNull();
    expect(result?.players).toEqual([]);
  });

  it('mantém jogador objeto com nome e SteamID vazios no array com campos null', () => {
    const result = normalizeSeasonRanking({
      season: {
        slug: 'summer-2026',
      },
      players: [{ name: '   ', steamId64: '   ' }],
    });

    expect(result).not.toBeNull();
    expect(result?.players).toHaveLength(1);
    expect(result?.players[0].name).toBeNull();
    expect(result?.players[0].steamId64).toBeNull();
  });

  it('usa zero para métricas inválidas', () => {
    const result = normalizeSeasonRanking({
      season: {
        slug: 'summer-2026',
      },
      players: [
        {
          matchesPlayed: Number.NaN,
          roundsPlayed: -4,
          score: 'abc',
          kdRatio: -1,
        },
      ],
    });

    expect(result).not.toBeNull();
    expect(result?.players[0].matchesPlayed).toBe(0);
    expect(result?.players[0].roundsPlayed).toBe(0);
    expect(result?.players[0].score).toBe(0);
    expect(result?.players[0].kdRatio).toBe(0);
  });

  it('ignora elementos inválidos de players e preserva a ordem dos objetos válidos', () => {
    const result = normalizeSeasonRanking({
      season: {
        slug: 'summer-2026',
      },
      players: [null, 'bad', 3, { name: 'First' }, { name: 'Second' }, { name: 'Third' }],
    });

    expect(result?.players.map((player) => player.name)).toEqual(['First', 'Second', 'Third']);
  });

  it('prizeRank ausente retorna null e prizeRank válido via snake_case é preservado', () => {
    const result = normalizeSeasonRanking({
      season: {
        slug: 'summer-2026',
      },
      players: [{}, { prize_rank: 3 }],
    });

    expect(result?.players[0].prizeRank).toBeNull();
    expect(result?.players[1].prizeRank).toBe(3);
  });

  it('prizeEligible inválido no primeiro alias usa boolean válido do segundo', () => {
    const result = normalizeSeasonRanking({
      season: {
        slug: 'summer-2026',
      },
      players: [{ prizeEligible: 'yes', prize_eligible: false }],
    });

    expect(result?.players[0].prizeEligible).toBe(false);
  });

  it('topPrizeCandidates inválido no primeiro alias usa array válido do segundo', () => {
    const result = normalizeSeasonRanking({
      season: {
        slug: 'summer-2026',
      },
      topPrizeCandidates: 'bad',
      top_prize_candidates: [{ name: 'Top One' }],
    });

    expect(result?.topPrizeCandidates.map((player) => player.name)).toEqual(['Top One']);
  });

  it('mantém topPrizeCandidates independente de players', () => {
    const result = normalizeSeasonRanking({
      season: {
        slug: 'summer-2026',
      },
      players: [{ name: 'First' }, { name: 'Second' }],
      topPrizeCandidates: [{ name: 'Top One' }, { name: 'Top Two' }],
    });

    expect(result?.topPrizeCandidates.map((player) => player.name)).toEqual(['Top One', 'Top Two']);
    expect(result?.players.map((player) => player.name)).toEqual(['First', 'Second']);
  });

  it('não lança exceção para entradas malformadas', () => {
    expect(() => normalizeSeasonRanking('oops')).not.toThrow();
    expect(() => normalizeSeasonRanking({ season: { slug: 'ok' }, rules: 'bad', summary: ['x'] })).not.toThrow();
  });
});
