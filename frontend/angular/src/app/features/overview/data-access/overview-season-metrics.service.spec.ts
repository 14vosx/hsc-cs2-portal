import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cs2ApiService } from '../../../core/api/cs2-api.service';
import {
  SeasonRankingDto,
  SeasonRankingPlayerDto,
  SeasonRankingSummaryDto,
} from '../../../core/api/dto/season-ranking.dto';
import { SeasonDto, SeasonsIndexDto } from '../../../core/api/dto/season.dto';
import { OverviewSeasonMetrics } from '../domain/overview-season-metrics.model';
import { OverviewSeasonMetricsService } from './overview-season-metrics.service';

describe('OverviewSeasonMetricsService', () => {
  let service: OverviewSeasonMetricsService;
  let mockCs2Api: {
    getSeasons: ReturnType<typeof vi.fn<() => Observable<SeasonsIndexDto>>>;
    getSeasonRanking: ReturnType<
      typeof vi.fn<(slug: string) => Observable<SeasonRankingDto>>
    >;
  };

  const validSteamId = '76561198000000001';
  const secondValidSteamId = '76561198000000002';

  beforeEach(() => {
    mockCs2Api = {
      getSeasons: vi.fn(),
      getSeasonRanking: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        OverviewSeasonMetricsService,
        { provide: Cs2ApiService, useValue: mockCs2Api },
      ],
    });

    service = TestBed.inject(OverviewSeasonMetricsService);
  });

  it('deve resolver Season ativa quando disponível', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: 'season-2',
      seasons: [
        {
          slug: 'season-1',
          status: 'closed',
          end_at: '2026-01-01T00:00:00Z',
          name: 'Season 1',
        },
        {
          slug: 'season-2',
          status: 'active',
          start_at: '2026-02-01T00:00:00Z',
          name: 'Season 2',
        },
      ],
    };

    const rankingDto: SeasonRankingDto = {
      generatedAt: '2026-08-04T00:00:00Z',
      summary: { players: 25, matches: 10, maps: 15, rounds: 300 },
      players: [],
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    let result: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (result = res));

    expect(result).not.toBeNull();
    expect(result?.seasonSlug).toBe('season-2');
    expect(result?.seasonName).toBe('Season 2');
    expect(result?.contextMode).toBe('active');
  });

  it('deve usar fallback para a Season closed mais recente quando não houver Season ativa', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: null,
      seasons: [
        {
          slug: 'season-1',
          status: 'closed',
          end_at: '2026-01-01T00:00:00Z',
          name: 'Season 1',
        },
        {
          slug: 'season-2',
          status: 'closed',
          end_at: '2026-05-01T00:00:00Z',
          name: 'Season 2',
        },
      ],
    };

    const rankingDto: SeasonRankingDto = {
      generatedAt: '2026-08-04T00:00:00Z',
      summary: { players: 30, matches: 12, maps: 18, rounds: 360 },
      players: [],
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    let result: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (result = res));

    expect(result).not.toBeNull();
    expect(result?.seasonSlug).toBe('season-2');
    expect(result?.contextMode).toBe('latest-closed');
  });

  it('retorna null quando só existem Seasons draft', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: null,
      seasons: [
        { slug: 'season-draft-1', status: 'draft', name: 'Draft 1' },
        { slug: 'season-draft-2', status: 'draft', name: 'Draft 2' },
      ],
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));

    let result: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (result = res));

    expect(result).toBeNull();
    expect(mockCs2Api.getSeasonRanking).not.toHaveBeenCalled();
  });

  it('retorna null quando não existem Seasons', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: null,
      seasons: [],
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));

    let result: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (result = res));

    expect(result).toBeNull();
    expect(mockCs2Api.getSeasonRanking).not.toHaveBeenCalled();
  });

  it('usa summary.players, não players.length', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: 's1',
      seasons: [{ slug: 's1', status: 'active', name: 'Season 1' }],
    };

    const rankingDto: SeasonRankingDto = {
      summary: { players: 50, matches: 10, maps: 20, rounds: 400 },
      players: [
        {
          steamid64: validSteamId,
          name: 'P1',
          rank: 1,
          score: 100,
          wins: 5,
          losses: 1,
          kdRatio: 1.5,
        },
        {
          steamid64: secondValidSteamId,
          name: 'P2',
          rank: 2,
          score: 90,
          wins: 4,
          losses: 2,
          kdRatio: 1.2,
        },
      ],
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    let result: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (result = res));

    expect(result?.playersCount).toBe(50);
    expect(result?.playersCount).not.toBe(rankingDto.players?.length);
  });

  it('usa summary.matches', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: 's1',
      seasons: [{ slug: 's1', status: 'active', name: 'Season 1' }],
    };

    const rankingDto: SeasonRankingDto = {
      summary: { players: 10, matches: 42, maps: 20, rounds: 400 },
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    let result: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (result = res));

    expect(result?.matchesCount).toBe(42);
  });

  it('usa summary.maps', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: 's1',
      seasons: [{ slug: 's1', status: 'active', name: 'Season 1' }],
    };

    const rankingDto: SeasonRankingDto = {
      summary: { players: 10, matches: 42, maps: 88, rounds: 400 },
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    let result: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (result = res));

    expect(result?.mapsCount).toBe(88);
  });

  it('usa summary.rounds', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: 's1',
      seasons: [{ slug: 's1', status: 'active', name: 'Season 1' }],
    };

    const rankingDto: SeasonRankingDto = {
      summary: { players: 10, matches: 42, maps: 88, rounds: 1250 },
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    let result: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (result = res));

    expect(result?.roundsCount).toBe(1250);
  });

  it('preserva o primeiro jogador como líder quando for válido', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: 's1',
      seasons: [{ slug: 's1', status: 'active', name: 'Season 1' }],
    };

    const rankingDto: SeasonRankingDto = {
      summary: { players: 10, matches: 5, maps: 5, rounds: 100 },
      players: [
        {
          steamid64: validSteamId,
          name: 'Alpha Leader',
          rank: 1,
          score: 95.5,
          wins: 10,
          losses: 2,
          kdRatio: 1.85,
        },
        {
          steamid64: secondValidSteamId,
          name: 'Beta Second',
          rank: 2,
          score: 88.0,
          wins: 8,
          losses: 4,
          kdRatio: 1.4,
        },
      ],
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    let result: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (result = res));

    expect(result?.leader).toEqual({
      position: 1,
      steamId64: validSteamId,
      name: 'Alpha Leader',
      score: 95.5,
      wins: 10,
      losses: 2,
      kdRatio: 1.85,
    });
  });

  it('não ordena localmente os jogadores (preserva a ordem recebida)', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: 's1',
      seasons: [{ slug: 's1', status: 'active', name: 'Season 1' }],
    };

    const rankingDto: SeasonRankingDto = {
      summary: { players: 10, matches: 5, maps: 5, rounds: 100 },
      players: [
        {
          steamid64: validSteamId,
          name: 'First Received',
          rank: 5,
          score: 10.0,
          wins: 1,
          losses: 5,
          kdRatio: 0.5,
        },
        {
          steamid64: secondValidSteamId,
          name: 'Second Received',
          rank: 1,
          score: 100.0,
          wins: 20,
          losses: 1,
          kdRatio: 2.5,
        },
      ],
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    let result: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (result = res));

    expect(result?.leader?.steamId64).toBe(validSteamId);
    expect(result?.leader?.name).toBe('First Received');
  });

  it('líder null quando players está vazio', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: 's1',
      seasons: [{ slug: 's1', status: 'active', name: 'Season 1' }],
    };

    const rankingDto: SeasonRankingDto = {
      summary: { players: 0, matches: 0, maps: 0, rounds: 0 },
      players: [],
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    let result: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (result = res));

    expect(result?.leader).toBeNull();
  });

  it('retorna o segundo jogador quando a primeira entrada for inválida e a segunda for válida', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: 's1',
      seasons: [{ slug: 's1', status: 'active', name: 'Season 1' }],
    };

    const rankingDto: SeasonRankingDto = {
      summary: { players: 2, matches: 1, maps: 1, rounds: 20 },
      players: [
        {
          steamid64: '',
          name: 'Invalid Player',
          rank: 1,
          score: 100,
        },
        {
          steamid64: validSteamId,
          name: 'Valid Second Player',
          rank: 2,
          score: 90,
          wins: 4,
          losses: 1,
          kdRatio: 1.3,
        },
      ],
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    let result: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (result = res));

    expect(result?.leader?.steamId64).toBe(validSteamId);
    expect(result?.leader?.name).toBe('Valid Second Player');
    expect(result?.leader?.position).toBe(2);
  });

  it('retorna líder null quando todas as entradas de players forem inválidas', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: 's1',
      seasons: [{ slug: 's1', status: 'active', name: 'Season 1' }],
    };

    const rankingDto: SeasonRankingDto = {
      summary: { players: 2, matches: 1, maps: 1, rounds: 20 },
      players: [
        { steamid64: '', name: 'No SteamID' },
        { steamid64: '123456789', name: 'Short SteamID' },
        { steamid64: validSteamId, name: '   ' },
      ],
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    let result: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (result = res));

    expect(result?.leader).toBeNull();
  });

  it('desconsidera jogador com SteamID64 vazio como entrada inválida', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: 's1',
      seasons: [{ slug: 's1', status: 'active', name: 'Season 1' }],
    };

    const rankingDto: SeasonRankingDto = {
      players: [{ steamid64: '   ', name: 'Player' }],
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    let result: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (result = res));

    expect(result?.leader).toBeNull();
  });

  it('desconsidera jogador com SteamID64 fora do formato de 17 dígitos como entrada inválida', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: 's1',
      seasons: [{ slug: 's1', status: 'active', name: 'Season 1' }],
    };

    const rankingDto: SeasonRankingDto = {
      players: [
        { steamid64: '7656119800000000', name: 'Sixteen Digits' },
        { steamid64: '765611980000000000', name: 'Eighteen Digits' },
        { steamid64: '7656119800000000a', name: 'Letters Included' },
      ],
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    let result: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (result = res));

    expect(result?.leader).toBeNull();
  });

  it('desconsidera jogador com nome vazio ou apenas espaços como entrada inválida', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: 's1',
      seasons: [{ slug: 's1', status: 'active', name: 'Season 1' }],
    };

    const rankingDto: SeasonRankingDto = {
      players: [
        { steamid64: validSteamId, name: '' },
        { steamid64: validSteamId, name: '     ' },
      ],
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    let result: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (result = res));

    expect(result?.leader).toBeNull();
  });

  it('resolve o nome da season priorizando context.season.name, rankingDto.season.name ou context.slug', () => {
    const rankingWithBackupName: SeasonRankingDto = {
      season: { name: '  Ranking DTO Season Name  ' },
    };

    const rankingWithoutName: SeasonRankingDto = {
      season: { name: '   ' },
    };

    // 1. Prioriza context.season.name quando válido
    mockCs2Api.getSeasons.mockReturnValue(
      of({
        activeSeasonSlug: 's1',
        seasons: [{ slug: 's1', status: 'active', name: ' Context Season Name ' }],
      }),
    );
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingWithBackupName));

    let res1: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (res1 = res));
    expect(res1?.seasonName).toBe('Context Season Name');

    // 2. Usa rankingDto.season.name quando context.season.name for ausente ou inválido
    mockCs2Api.getSeasons.mockReturnValue(
      of({
        activeSeasonSlug: 's1',
        seasons: [{ slug: 's1', status: 'active', name: '   ' }],
      }),
    );
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingWithBackupName));

    let res2: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (res2 = res));
    expect(res2?.seasonName).toBe('Ranking DTO Season Name');

    // 3. Usa context.slug como fallback quando ambos os nomes forem inválidos
    mockCs2Api.getSeasons.mockReturnValue(
      of({
        activeSeasonSlug: 's1-fallback-slug',
        seasons: [{ slug: 's1-fallback-slug', status: 'active', name: '' }],
      }),
    );
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingWithoutName));

    let res3: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (res3 = res));
    expect(res3?.seasonName).toBe('s1-fallback-slug');
  });

  it('mantém erro HTTP de getSeasons() como erro (propaga falha no Observable)', () => {
    const httpError = new Error('Network Error / HTTP 500 em getSeasons');
    mockCs2Api.getSeasons.mockReturnValue(throwError(() => httpError));

    let errorReceived: unknown;
    service.getOverviewSeasonMetrics().subscribe({
      next: () => {},
      error: (err) => (errorReceived = err),
    });

    expect(errorReceived).toBe(httpError);
  });

  it('mantém erro HTTP de getSeasonRanking() como erro (propaga falha no Observable)', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: 's1',
      seasons: [{ slug: 's1', status: 'active', name: 'Season 1' }],
    };
    const httpError = new Error('HTTP 404 / Season Ranking Not Found');

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(throwError(() => httpError));

    let errorReceived: unknown;
    service.getOverviewSeasonMetrics().subscribe({
      next: () => {},
      error: (err) => (errorReceived = err),
    });

    expect(errorReceived).toBe(httpError);
  });

  it('chama getSeasonRanking apenas uma vez', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: 's1',
      seasons: [{ slug: 's1', status: 'active', name: 'Season 1' }],
    };

    const rankingDto: SeasonRankingDto = {
      summary: { players: 5, matches: 2, maps: 2, rounds: 40 },
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    service.getOverviewSeasonMetrics().subscribe();

    expect(mockCs2Api.getSeasonRanking).toHaveBeenCalledTimes(1);
  });

  it('usa o slug resolvido no request', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: 'resolved-slug-123',
      seasons: [
        {
          slug: 'resolved-slug-123',
          status: 'active',
          name: 'Resolved Season',
        },
      ],
    };

    const rankingDto: SeasonRankingDto = {
      summary: { players: 5, matches: 2, maps: 2, rounds: 40 },
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    service.getOverviewSeasonMetrics().subscribe();

    expect(mockCs2Api.getSeasonRanking).toHaveBeenCalledWith('resolved-slug-123');
  });

  it('não modifica objetos ou arrays recebidos', () => {
    const season: SeasonDto = Object.freeze({
      slug: 's1',
      status: 'active',
      name: 'Season 1',
    });

    const seasonsIndex: SeasonsIndexDto = Object.freeze({
      activeSeasonSlug: 's1',
      seasons: Object.freeze([season]) as SeasonDto[],
    });

    const player: SeasonRankingPlayerDto = Object.freeze({
      steamid64: validSteamId,
      name: 'Player One',
      rank: 1,
      score: 100,
      wins: 5,
      losses: 0,
      kdRatio: 2.0,
    });

    const summary: SeasonRankingSummaryDto = Object.freeze({
      players: 10,
      matches: 5,
      maps: 5,
      rounds: 100,
    });

    const rankingDto: SeasonRankingDto = Object.freeze({
      generatedAt: '2026-08-04T00:00:00Z',
      summary,
      players: Object.freeze([player]) as SeasonRankingPlayerDto[],
    });

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    let result: OverviewSeasonMetrics | null | undefined;
    expect(() => {
      service.getOverviewSeasonMetrics().subscribe((res) => (result = res));
    }).not.toThrow();

    expect(result).not.toBeNull();
    expect(result?.leader?.name).toBe('Player One');
  });

  it('normaliza com segurança campos de summary nulos, ausentes ou numericamente inválidos', () => {
    const seasonsIndex: SeasonsIndexDto = {
      activeSeasonSlug: 's1',
      seasons: [{ slug: 's1', status: 'active', name: 'Season 1' }],
    };

    const invalidSummary = {
      players: -10,
      matches: 'invalid-number',
      maps: undefined,
      rounds: null,
    } as unknown as SeasonRankingSummaryDto;

    const rankingDto: SeasonRankingDto = {
      generatedAt: '   ',
      summary: invalidSummary,
      players: [],
    };

    mockCs2Api.getSeasons.mockReturnValue(of(seasonsIndex));
    mockCs2Api.getSeasonRanking.mockReturnValue(of(rankingDto));

    let result: OverviewSeasonMetrics | null | undefined;
    service.getOverviewSeasonMetrics().subscribe((res) => (result = res));

    expect(result).toEqual({
      seasonSlug: 's1',
      seasonName: 'Season 1',
      contextMode: 'active',
      generatedAt: null,
      playersCount: 0,
      matchesCount: 0,
      mapsCount: 0,
      roundsCount: 0,
      leader: null,
    });
  });
});
