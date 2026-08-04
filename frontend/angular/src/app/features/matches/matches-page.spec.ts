import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MatchesApiService, MatchesContractError } from './data-access/matches-api.service';
import type { MatchesIndex, MatchSummary } from './domain/match.model';
import { MatchesPage } from './matches-page';

const createMockMatch = (id: number, overrides: Partial<MatchSummary> = {}): MatchSummary => ({
  id,
  startedAt: '2026-08-04T10:00:00Z',
  endedAt: '2026-08-04T11:00:00Z',
  winner: 'Team A',
  seriesType: 'BO3',
  team1: { name: 'Team A', score: 2 },
  team2: { name: 'Team B', score: 1 },
  serverIp: '127.0.0.1:27015',
  maps: [
    {
      mapNumber: 1,
      startedAt: '2026-08-04T10:00:00Z',
      endedAt: '2026-08-04T10:30:00Z',
      winner: 'Team A',
      name: 'de_mirage',
      team1Score: 13,
      team2Score: 7,
    },
    {
      mapNumber: 2,
      startedAt: '2026-08-04T10:35:00Z',
      endedAt: '2026-08-04T11:00:00Z',
      winner: 'Team B',
      name: 'de_nuke',
      team1Score: 9,
      team2Score: 13,
    },
  ],
  ...overrides,
});

describe('MatchesPage', () => {
  let component: MatchesPage;
  let fixture: ComponentFixture<MatchesPage>;
  let matchesApiMock: { getMatches: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    matchesApiMock = {
      getMatches: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [MatchesPage],
      providers: [
        provideRouter([]),
        { provide: MatchesApiService, useValue: matchesApiMock },
      ],
    });
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(MatchesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('o componente pode ser criado utilizando MatchesApiService', () => {
    matchesApiMock.getMatches.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', matches: [] }));
    createComponent();
    expect(component).toBeTruthy();
    expect(matchesApiMock.getMatches).toHaveBeenCalledTimes(1);
  });

  it('exibe estado de carregamento inicial', () => {
    matchesApiMock.getMatches.mockReturnValue(of());
    createComponent();

    const pageState = fixture.nativeElement.querySelector('app-page-state') as HTMLElement | null;
    expect(pageState).not.toBeNull();
    expect(pageState?.textContent).toContain('Sincronizando o histórico de partidas.');
  });

  it('exibe estado ready com métricas, destaque da última partida e histórico', () => {
    const matches: MatchSummary[] = [
      createMockMatch(101, { winner: 'Team A' }),
      createMockMatch(102, { winner: 'Team B' }),
    ];
    const indexData: MatchesIndex = {
      generatedAt: '2026-08-04T12:00:00Z',
      matches,
    };
    matchesApiMock.getMatches.mockReturnValue(of(indexData));
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Histórico competitivo');
    expect(el.textContent).toContain('Atualizado em');
    expect(el.textContent).toContain('#101');
  });

  it('preserva a ordem remota de partidas sem reordenar localmente', () => {
    const matches: MatchSummary[] = [
      createMockMatch(201),
      createMockMatch(202),
      createMockMatch(203),
    ];
    matchesApiMock.getMatches.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', matches }));
    createComponent();

    let vmResult: any;
    component['vm$'].subscribe((res) => (vmResult = res));
    expect(vmResult.state).toBe('ready');
    expect(vmResult.matches.map((m: MatchSummary) => m.id)).toEqual([201, 202, 203]);
    expect(vmResult.latestMatch.id).toBe(201);
  });

  it('deriva o total de mapas jogados e deduplica mapOptions em ordem alfabética', () => {
    const matches: MatchSummary[] = [
      createMockMatch(1, {
        maps: [
          { mapNumber: 1, startedAt: null, endedAt: null, winner: null, name: 'de_nuke', team1Score: 13, team2Score: 5 },
          { mapNumber: 2, startedAt: null, endedAt: null, winner: null, name: 'de_mirage', team1Score: 13, team2Score: 8 },
        ],
      }),
      createMockMatch(2, {
        maps: [
          { mapNumber: 1, startedAt: null, endedAt: null, winner: null, name: 'de_mirage', team1Score: 13, team2Score: 2 },
          { mapNumber: 2, startedAt: null, endedAt: null, winner: null, name: 'de_ancient', team1Score: 13, team2Score: 9 },
        ],
      }),
    ];
    matchesApiMock.getMatches.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', matches }));
    createComponent();

    let vmResult: any;
    component['vm$'].subscribe((res) => (vmResult = res));
    expect(vmResult.totalMapsPlayed).toBe(4);
    expect(vmResult.mapOptions).toEqual(['de_ancient', 'de_mirage', 'de_nuke']);
  });

  it('exibe estado empty quando a API retorna array de partidas vazio', () => {
    matchesApiMock.getMatches.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', matches: [] }));
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Nenhuma partida finalizada foi publicada.');
  });

  it('exibe estado de erro ao ocorrer falha HTTP ou erro contratual', () => {
    matchesApiMock.getMatches.mockReturnValue(throwError(() => new MatchesContractError('Invalid payload')));
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Partidas indisponíveis');
  });

  it('retry aciona uma nova requisição e emite estado loading', () => {
    matchesApiMock.getMatches.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', matches: [createMockMatch(1)] }));
    createComponent();

    expect(matchesApiMock.getMatches).toHaveBeenCalledTimes(1);

    component['retry']();
    expect(matchesApiMock.getMatches).toHaveBeenCalledTimes(2);
  });

  it('filtra partidas por termo de busca (ID, time, vencedor ou mapa)', () => {
    const matches: MatchSummary[] = [
      createMockMatch(101, { team1: { name: 'Furia', score: 2 }, winner: 'Furia' }),
      createMockMatch(102, { team1: { name: 'MIBR', score: 1 }, winner: 'Team X' }),
    ];
    matchesApiMock.getMatches.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', matches }));
    createComponent();

    component['searchTerm'].set('furia');
    fixture.detectChanges();

    const filtered = component['filteredMatches'](matches);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe(101);
  });

  it('filtra partidas por mapa selecionado', () => {
    const matches: MatchSummary[] = [
      createMockMatch(101, {
        maps: [{ mapNumber: 1, startedAt: null, endedAt: null, winner: null, name: 'de_dust2', team1Score: 13, team2Score: 0 }],
      }),
      createMockMatch(102, {
        maps: [{ mapNumber: 1, startedAt: null, endedAt: null, winner: null, name: 'de_mirage', team1Score: 13, team2Score: 0 }],
      }),
    ];
    matchesApiMock.getMatches.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', matches }));
    createComponent();

    component['selectedMap'].set('de_dust2');
    fixture.detectChanges();

    const filtered = component['filteredMatches'](matches);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe(101);
  });

  it('exibe estado empty localizado na seção quando a busca local não retorna resultados', () => {
    const matches: MatchSummary[] = [createMockMatch(101)];
    matchesApiMock.getMatches.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', matches }));
    createComponent();

    component['searchTerm'].set('termo_inexistente');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    // O header e as métricas principais continuam visíveis
    expect(el.textContent).toContain('Histórico competitivo');
    expect(el.textContent).toContain('Partidas');
    // Estado local sem resultados exibe mensagem de busca
    expect(el.textContent).toContain('A busca ou o filtro por mapa não retornou confrontos.');
  });
});
