import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { Cs2ApiService } from '../../core/api/cs2-api.service';
import { HealthDto } from '../../core/api/dto/health.dto';
import { MapsDto } from '../../core/api/dto/maps.dto';
import { MatchesDto } from '../../core/api/dto/matches.dto';
import { NewsIndexDto } from '../../core/api/dto/news.dto';
import { OverviewSeasonMetricsService } from './data-access/overview-season-metrics.service';
import {
  OverviewSeasonLeader,
  OverviewSeasonMetrics,
} from './domain/overview-season-metrics.model';
import { OverviewPage } from './overview-page';

type Cs2ApiMock = {
  getHealth: Mock<Cs2ApiService['getHealth']>;
  getRanking: Mock<Cs2ApiService['getRanking']>;
  getMatches: Mock<Cs2ApiService['getMatches']>;
  getMaps: Mock<Cs2ApiService['getMaps']>;
  getNewsIndex: Mock<Cs2ApiService['getNewsIndex']>;
};

type OverviewSeasonMetricsServiceMock = {
  getOverviewSeasonMetrics: Mock<
    OverviewSeasonMetricsService['getOverviewSeasonMetrics']
  >;
};

describe('OverviewPage', () => {
  let mockCs2Api: Cs2ApiMock;
  let mockOverviewSeasonMetrics: OverviewSeasonMetricsServiceMock;

  const mockHealth: HealthDto = {
    ok: true,
    generatedAt: '2026-08-04T00:00:00Z',
    version: '1.0.0',
  };

  const mockMatches: MatchesDto = {
    generatedAt: '2026-08-04T00:00:00Z',
    matches: [
      {
        matchid: 999,
        start_time: '2026-08-03T20:00:00Z',
        end_time: '2026-08-03T21:00:00Z',
        winner: 'Alpha',
        series_type: 'bo1',
        team1_name: 'Alpha',
        team1_score: 13,
        team2_name: 'Beta',
        team2_score: 9,
        server_ip: '127.0.0.1',
        maps: [
          {
            mapnumber: 1,
            start_time: '2026-08-03T20:00:00Z',
            end_time: '2026-08-03T21:00:00Z',
            winner: 'Alpha',
            mapname: 'de_mirage',
            team1_score: 13,
            team2_score: 9,
          },
        ],
      },
    ],
  };

  const mockMaps: MapsDto = {
    generatedAt: '2026-08-04T00:00:00Z',
    maps: [
      {
        map: 'de_dust2',
        matches: 15,
        rounds: 300,
        avgRoundsPerMatch: 20,
        lastPlayed: '2026-08-03T21:00:00Z',
      },
    ],
  };

  const mockNews: NewsIndexDto = {
    items: [
      {
        slug: 'noticia-1',
        title: 'Notícia de Teste da Comunidade',
        excerpt: 'Resumo da notícia da comunidade',
        published_at: '2026-08-02T10:00:00Z',
      },
    ],
  };

  const mockLeader: OverviewSeasonLeader = {
    position: 1,
    steamId64: '76561198000000001',
    name: 'Fallen',
    score: 99.5,
    wins: 10,
    losses: 2,
    kdRatio: 1.5,
  };

  const mockActiveSeasonMetrics: OverviewSeasonMetrics = {
    seasonSlug: 'season-2',
    seasonName: 'Season 2',
    contextMode: 'active',
    generatedAt: '2026-08-04T00:00:00Z',
    playersCount: 42,
    matchesCount: 100,
    mapsCount: 150,
    roundsCount: 3000,
    leader: mockLeader,
  };

  const mockClosedSeasonMetrics: OverviewSeasonMetrics = {
    seasonSlug: 'season-1',
    seasonName: 'Season 1',
    contextMode: 'latest-closed',
    generatedAt: '2026-05-01T00:00:00Z',
    playersCount: 30,
    matchesCount: 80,
    mapsCount: 120,
    roundsCount: 2400,
    leader: mockLeader,
  };

  beforeEach(() => {
    mockCs2Api = {
      getHealth: vi
        .fn<Cs2ApiService['getHealth']>()
        .mockReturnValue(of(mockHealth)),
      getRanking: vi.fn<Cs2ApiService['getRanking']>(),
      getMatches: vi
        .fn<Cs2ApiService['getMatches']>()
        .mockReturnValue(of(mockMatches)),
      getMaps: vi
        .fn<Cs2ApiService['getMaps']>()
        .mockReturnValue(of(mockMaps)),
      getNewsIndex: vi
        .fn<Cs2ApiService['getNewsIndex']>()
        .mockReturnValue(of(mockNews)),
    };

    mockOverviewSeasonMetrics = {
      getOverviewSeasonMetrics: vi
        .fn<OverviewSeasonMetricsService['getOverviewSeasonMetrics']>()
        .mockReturnValue(of(mockActiveSeasonMetrics)),
    };

    TestBed.configureTestingModule({
      imports: [OverviewPage],
      providers: [
        provideRouter([]),
        { provide: Cs2ApiService, useValue: mockCs2Api },
        {
          provide: OverviewSeasonMetricsService,
          useValue: mockOverviewSeasonMetrics,
        },
      ],
    });
  });

  function createComponent(): ComponentFixture<OverviewPage> {
    const fixture = TestBed.createComponent(OverviewPage);
    fixture.detectChanges();
    return fixture;
  }

  it('1. Season ativa aparece visualmente mesmo quando existe Notícia', () => {
    mockNews.items = [
      { slug: 'n1', title: 'Notícia em destaque', published_at: '2026-08-01' },
    ];
    mockOverviewSeasonMetrics.getOverviewSeasonMetrics.mockReturnValue(
      of(mockActiveSeasonMetrics),
    );

    const fixture = createComponent();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Notícia em destaque');
    expect(text).toContain('Temporada ativa · Season 2');
  });

  it('2. Última Season encerrada aparece visualmente mesmo quando existe Notícia', () => {
    mockNews.items = [
      { slug: 'n1', title: 'Notícia em destaque', published_at: '2026-08-01' },
    ];
    mockOverviewSeasonMetrics.getOverviewSeasonMetrics.mockReturnValue(
      of(mockClosedSeasonMetrics),
    );

    const fixture = createComponent();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Notícia em destaque');
    expect(text).toContain('Última temporada encerrada · Season 1');
  });

  it('3. ausência de Season aparece visualmente como "Sem temporada pública"', () => {
    mockOverviewSeasonMetrics.getOverviewSeasonMetrics.mockReturnValue(
      of(null),
    );

    const fixture = createComponent();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Sem temporada pública');
  });

  it('4. seasonMetrics null não produz mensagem de ranking vazio nem de líderes', () => {
    mockOverviewSeasonMetrics.getOverviewSeasonMetrics.mockReturnValue(
      of(null),
    );

    const fixture = createComponent();
    const text = fixture.nativeElement.textContent;

    expect(text).not.toContain('Ranking ainda sem jogadores classificados');
    expect(text).not.toContain('Em aberto');
    expect(text).not.toContain(
      'Os primeiros nomes ainda não entraram na classificação',
    );
    expect(text).toContain(
      'Não há uma temporada pública disponível no momento',
    );
  });

  it('5. Season existente com líder null produz mensagem de ranking sem classificados', () => {
    mockNews.items = []; // Garante exibição do hero sazonal
    mockOverviewSeasonMetrics.getOverviewSeasonMetrics.mockReturnValue(
      of({
        ...mockActiveSeasonMetrics,
        leader: null,
      }),
    );

    const fixture = createComponent();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Ranking ainda sem jogadores classificados');
    expect(text).toContain(
      'Os primeiros nomes ainda não entraram na classificação',
    );
  });

  it('6. latest-closed nunca apresenta "Líder atual"', () => {
    mockNews.items = []; // Exibe a hero de temporada
    mockOverviewSeasonMetrics.getOverviewSeasonMetrics.mockReturnValue(
      of(mockClosedSeasonMetrics),
    );

    const fixture = createComponent();
    const text = fixture.nativeElement.textContent;

    expect(text).not.toContain('Líder atual');
    expect(text).toContain('Líder final');
  });

  it('7. latest-closed nunca apresenta "Em aberto"', () => {
    mockNews.items = [];
    mockOverviewSeasonMetrics.getOverviewSeasonMetrics.mockReturnValue(
      of({
        ...mockClosedSeasonMetrics,
        leader: null,
      }),
    );

    const fixture = createComponent();
    const text = fixture.nativeElement.textContent;

    expect(text).not.toContain('Em aberto');
    expect(text).toContain('Sem classificados');
  });

  it('8. hero sazonal não inclui matchid global', () => {
    mockNews.items = [];
    mockOverviewSeasonMetrics.getOverviewSeasonMetrics.mockReturnValue(
      of(mockActiveSeasonMetrics),
    );

    const fixture = createComponent();
    const heroEl = fixture.nativeElement.querySelector(
      '.overview-page__hero',
    );

    expect(heroEl?.textContent).not.toContain('#999');
    expect(heroEl?.textContent).not.toContain('última partida #999');
  });

  it('9. hero sazonal não inclui mapa global', () => {
    mockNews.items = [];
    mockOverviewSeasonMetrics.getOverviewSeasonMetrics.mockReturnValue(
      of(mockActiveSeasonMetrics),
    );

    const fixture = createComponent();
    const heroEl = fixture.nativeElement.querySelector(
      '.overview-page__hero',
    );

    expect(heroEl?.textContent).not.toContain('DUST2 em rotação');
  });

  it('10. hero sazonal usa generatedAt sazonal', () => {
    mockNews.items = [];
    mockOverviewSeasonMetrics.getOverviewSeasonMetrics.mockReturnValue(
      of({
        ...mockActiveSeasonMetrics,
        generatedAt: '2026-07-15T12:00:00Z',
      }),
    );
    mockCs2Api.getHealth.mockReturnValue(
      of({ ...mockHealth, generatedAt: '2026-08-04T00:00:00Z' }),
    );

    const fixture = createComponent();
    const heroEl = fixture.nativeElement.querySelector(
      '.overview-page__hero',
    );

    expect(heroEl?.textContent).toContain('15/07/2026');
    expect(heroEl?.textContent).not.toContain('04/08/2026');
  });

  it('11. generatedAt sazonal null não recorre ao health.generatedAt', () => {
    mockNews.items = [];
    mockOverviewSeasonMetrics.getOverviewSeasonMetrics.mockReturnValue(
      of({
        ...mockActiveSeasonMetrics,
        generatedAt: null,
      }),
    );
    mockCs2Api.getHealth.mockReturnValue(
      of({ ...mockHealth, generatedAt: '2026-08-04T00:00:00Z' }),
    );

    const fixture = createComponent();
    const heroEl = fixture.nativeElement.querySelector(
      '.overview-page__hero',
    );

    expect(heroEl?.textContent).toContain('Sem data disponível');
    expect(heroEl?.textContent).not.toContain('04/08/2026');
  });

  it('12. links de ranking usam o slug resolvido', () => {
    mockNews.items = [];
    mockOverviewSeasonMetrics.getOverviewSeasonMetrics.mockReturnValue(
      of({
        ...mockActiveSeasonMetrics,
        seasonSlug: 'season-custom-slug',
      }),
    );

    const fixture = createComponent();
    const anchors = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    ) as HTMLAnchorElement[];

    const rankingLinks = anchors.filter((a) =>
      a.getAttribute('href')?.includes('/seasons/season-custom-slug/ranking'),
    );

    expect(rankingLinks.length).toBeGreaterThan(0);
  });

  it('13. ausência de Season aponta para /seasons', () => {
    mockNews.items = [];
    mockOverviewSeasonMetrics.getOverviewSeasonMetrics.mockReturnValue(
      of(null),
    );

    const fixture = createComponent();
    const anchors = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    ) as HTMLAnchorElement[];

    const seasonsLinks = anchors.filter(
      (a) => a.getAttribute('href') === '/seasons',
    );

    expect(seasonsLinks.length).toBeGreaterThan(0);
  });

  it('14. getMatches continua sendo usado somente para o card global de métricas', () => {
    const fixture = createComponent();
    const text = fixture.nativeElement.textContent;

    expect(mockCs2Api.getMatches).toHaveBeenCalledTimes(1);
    expect(text).toContain('#999');
  });

  it('15. getMaps continua sendo usado somente para o quadro global de mapas', () => {
    const fixture = createComponent();
    const text = fixture.nativeElement.textContent;

    expect(mockCs2Api.getMaps).toHaveBeenCalledTimes(1);
    expect(text).toContain('DUST2');
  });

  it('16. evita chamadas de requisições duplicadas indevidas na inicialização da página', () => {
    createComponent();

    expect(
      mockOverviewSeasonMetrics.getOverviewSeasonMetrics,
    ).toHaveBeenCalledTimes(1);
    expect(mockCs2Api.getHealth).toHaveBeenCalledTimes(1);
  });
});
