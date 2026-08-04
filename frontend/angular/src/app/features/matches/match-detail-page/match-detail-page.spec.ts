import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MatchesApiService, MatchesContractError } from '../data-access/matches-api.service';
import type { MatchDetail } from '../domain/match.model';
import { MatchDetailPage } from './match-detail-page';

const createMockDetail = (id = 501): MatchDetail => ({
  generatedAt: '2026-08-04T12:00:00Z',
  id,
  match: {
    id,
    startedAt: '2026-08-04T10:00:00Z',
    endedAt: '2026-08-04T11:30:00Z',
    winner: 'Team A',
    seriesType: 'BO3',
    team1: { name: 'Team A', score: 2 },
    team2: { name: 'Team B', score: 1 },
    serverIp: '10.0.0.1:27015',
  },
  computed: {
    teams: ['Team A', 'Team B'],
    mapsPlayed: 3,
    bestOf: 3,
    partialSeries: false,
  },
  maps: [
    {
      matchId: id,
      mapNumber: 1,
      startedAt: '2026-08-04T10:00:00Z',
      endedAt: '2026-08-04T10:40:00Z',
      winner: 'Team A',
      name: 'de_nuke',
      team1Score: 13,
      team2Score: 7,
      teams: [
        {
          team: 'Team A',
          players: [],
          teamTotals: {
            kills: 20,
            deaths: 10,
            damage: 1800,
            assists: 5,
            enemy5Ks: 0,
            enemy4Ks: 0,
            enemy3Ks: 1,
            enemy2Ks: 2,
            utilityCount: 0,
            utilityDamage: 0,
            utilitySuccesses: 0,
            utilityEnemies: 0,
            flashCount: 0,
            flashSuccesses: 0,
            healthPointsRemovedTotal: 0,
            healthPointsDealtTotal: 0,
            shotsFiredTotal: 0,
            shotsOnTargetTotal: 0,
            v1Count: 0,
            v1Wins: 0,
            v2Count: 0,
            v2Wins: 0,
            entryCount: 0,
            entryWins: 0,
            equipmentValue: 0,
            moneySaved: 0,
            killReward: 0,
            liveTime: 0,
            headShotKills: 0,
            cashEarned: 0,
            enemiesFlashed: 0,
          },
        },
      ],
    },
  ],
  totals: [],
  limitations: ['Nota sobre ETL incompleto'],
});

describe('MatchDetailPage', () => {
  let component: MatchDetailPage;
  let fixture: ComponentFixture<MatchDetailPage>;
  let matchesApiMock: { getMatch: ReturnType<typeof vi.fn> };
  let paramMapSubject: BehaviorSubject<any>;

  beforeEach(() => {
    matchesApiMock = {
      getMatch: vi.fn(),
    };
    paramMapSubject = new BehaviorSubject(convertToParamMap({ matchId: '501' }));

    TestBed.configureTestingModule({
      imports: [MatchDetailPage],
      providers: [
        provideRouter([]),
        { provide: MatchesApiService, useValue: matchesApiMock },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMapSubject.asObservable() },
        },
      ],
    });
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(MatchDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('o componente pode ser criado e carrega os detalhes da partida válida', () => {
    matchesApiMock.getMatch.mockReturnValue(of(createMockDetail(501)));
    createComponent();

    expect(component).toBeTruthy();
    expect(matchesApiMock.getMatch).toHaveBeenCalledWith(501);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Team A vs Team B');
    expect(el.textContent).toContain('Match #501');
    expect(el.textContent).toContain('Nota sobre ETL incompleto');
  });

  it('emite not-found imediatamente sem chamar o serviço se o matchId for inválido (texto, decimal ou vazio)', () => {
    paramMapSubject.next(convertToParamMap({ matchId: 'abc' }));
    createComponent();

    expect(matchesApiMock.getMatch).not.toHaveBeenCalled();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Partida não encontrada');
  });

  it('emite not-found imediatamente sem chamar o serviço se o matchId for um número decimal ("12.3")', () => {
    paramMapSubject.next(convertToParamMap({ matchId: '12.3' }));
    createComponent();

    expect(matchesApiMock.getMatch).not.toHaveBeenCalled();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Partida não encontrada');
  });

  it('converte erro HTTP 404 para estado not-found', () => {
    matchesApiMock.getMatch.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }))
    );
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Partida não encontrada');
  });

  it('converte erro HTTP 500 ou MatchesContractError para estado error', () => {
    matchesApiMock.getMatch.mockReturnValue(
      throwError(() => new MatchesContractError('Payload malformado'))
    );
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Erro ao carregar partida');
  });

  it('mudança de parâmetro na rota aciona nova requisição', () => {
    matchesApiMock.getMatch.mockReturnValue(of(createMockDetail(501)));
    createComponent();

    expect(matchesApiMock.getMatch).toHaveBeenCalledWith(501);

    matchesApiMock.getMatch.mockReturnValue(of(createMockDetail(502)));
    paramMapSubject.next(convertToParamMap({ matchId: '502' }));
    fixture.detectChanges();

    expect(matchesApiMock.getMatch).toHaveBeenCalledWith(502);
  });

  it('renderiza breadcrumbs, link de voltar e link para JSON público da API', () => {
    matchesApiMock.getMatch.mockReturnValue(of(createMockDetail(501)));
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.match-detail-page__breadcrumbs')).not.toBeNull();

    const apiLink = el.querySelector('.match-detail-page__api') as HTMLAnchorElement;
    expect(apiLink.href).toContain('/api/cs2/v2/match/501.json');
  });

  it('não exibe link para mapa que possui nome null', () => {
    const detail = createMockDetail(501);
    const firstMap = detail.maps[0];
    expect(firstMap).toBeDefined();

    const changedDetail: MatchDetail = {
      ...detail,
      maps: [
        {
          ...firstMap!,
          name: null,
        },
        ...detail.maps.slice(1),
      ],
    };
    matchesApiMock.getMatch.mockReturnValue(of(changedDetail));
    createComponent();

    const mapLinks = fixture.nativeElement.querySelectorAll('.match-detail-page__map-link');
    expect(mapLinks.length).toBe(0);
    const spanMap = fixture.nativeElement.querySelector('.match-detail-page__map-span');
    expect(spanMap).not.toBeNull();
  });
});
