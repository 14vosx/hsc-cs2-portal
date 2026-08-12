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
    matchesApiMock = { getMatches: vi.fn() };

    TestBed.configureTestingModule({
      imports: [MatchesPage],
      providers: [provideRouter([]), { provide: MatchesApiService, useValue: matchesApiMock }],
    });
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(MatchesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('exibe o estado de loading', () => {
    matchesApiMock.getMatches.mockReturnValue(of());
    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Sincronizando o histórico de partidas.');
  });

  it('exibe erro e permite tentar novamente', () => {
    matchesApiMock.getMatches.mockReturnValue(
      throwError(() => new MatchesContractError('Invalid payload'))
    );
    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Partidas indisponíveis');
    component['retry']();
    expect(matchesApiMock.getMatches).toHaveBeenCalledTimes(2);
  });

  it('exibe empty quando nenhuma partida foi publicada', () => {
    matchesApiMock.getMatches.mockReturnValue(
      of({ generatedAt: '2026-08-04T12:00:00Z', matches: [] })
    );
    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Nenhuma partida finalizada foi publicada.');
  });

  it('usa o primeiro item publicado como latestMatch e preserva a ordem no feed', () => {
    const matches = [createMockMatch(203), createMockMatch(201), createMockMatch(202)];
    matchesApiMock.getMatches.mockReturnValue(
      of({ generatedAt: '2026-08-04T12:00:00Z', matches })
    );
    createComponent();

    const latest = fixture.nativeElement.querySelector('.matches-page__latest') as HTMLElement;
    const rows = Array.from(
      fixture.nativeElement.querySelectorAll('.matches-page__match-row') as NodeListOf<HTMLElement>
    );

    expect(latest.textContent).toContain('#203');
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('#203'),
      expect.stringContaining('#201'),
      expect.stringContaining('#202'),
    ]);
  });

  it('mantém totalMapsPlayed correto sem alterar os matches', () => {
    const matches = [createMockMatch(1), createMockMatch(2, { maps: [] })];
    matchesApiMock.getMatches.mockReturnValue(
      of({ generatedAt: '2026-08-04T12:00:00Z', matches })
    );
    createComponent();

    const metrics = Array.from(
      fixture.nativeElement.querySelectorAll('.matches-page__summary-card') as NodeListOf<HTMLElement>
    );
    expect(metrics[1].textContent).toContain('2');
    expect(matches.map((match) => match.id)).toEqual([1, 2]);
  });

  it('busca por ID, times, vencedor, seriesType e nomes de mapas', () => {
    const matches = [
      createMockMatch(101, { team1: { name: 'Furia', score: 2 }, winner: 'Furia' }),
      createMockMatch(102, { seriesType: 'BO1' }),
    ];
    matchesApiMock.getMatches.mockReturnValue(
      of({ generatedAt: '2026-08-04T12:00:00Z', matches })
    );
    createComponent();

    for (const term of ['101', 'furia', 'team b', 'bo3', 'de_nuke']) {
      component['searchTerm'].set(term);
      expect(component['filteredMatches'](matches)[0].id).toBe(101);
    }
  });

  it('filtra por mapa sem reordenar os resultados', () => {
    const matches = [
      createMockMatch(8),
      createMockMatch(3, {
        maps: [{ mapNumber: 1, startedAt: null, endedAt: null, winner: null, name: 'de_dust2', team1Score: 13, team2Score: 0 }],
      }),
      createMockMatch(5),
    ];
    matchesApiMock.getMatches.mockReturnValue(
      of({ generatedAt: '2026-08-04T12:00:00Z', matches })
    );
    createComponent();

    component['selectedMap'].set('de_mirage');
    expect(component['filteredMatches'](matches).map((match) => match.id)).toEqual([8, 5]);
  });

  it('pagina em blocos de 10 preservando a ordem e a quantidade da página final', () => {
    const matches = Array.from({ length: 23 }, (_, index) => createMockMatch(100 + index));
    matchesApiMock.getMatches.mockReturnValue(
      of({ generatedAt: '2026-08-04T12:00:00Z', matches })
    );
    createComponent();

    component['goToPage'](3, matches.length);
    fixture.detectChanges();
    const page = component['paginatedMatches'](matches);

    expect(page).toHaveLength(3);
    expect(page.map((match) => match.id)).toEqual([120, 121, 122]);
    expect(fixture.nativeElement.textContent).toContain('Exibindo 21–23 de 23 partidas');
  });

  it('reseta para a primeira página ao alterar busca ou filtro de mapa', () => {
    matchesApiMock.getMatches.mockReturnValue(
      of({ generatedAt: '2026-08-04T12:00:00Z', matches: [createMockMatch(1)] })
    );
    createComponent();

    component['currentPage'].set(2);
    component['updateSearch']({ target: { value: 'team' } } as unknown as Event);
    expect(component['currentPage']()).toBe(1);

    component['currentPage'].set(2);
    component['updateMapFilter']({ target: { value: 'de_mirage' } } as unknown as Event);
    expect(component['currentPage']()).toBe(1);
  });

  it('mantém /matches/:id nos links do destaque e do feed', () => {
    matchesApiMock.getMatches.mockReturnValue(
      of({ generatedAt: '2026-08-04T12:00:00Z', matches: [createMockMatch(3012)] })
    );
    createComponent();

    const latestLink = fixture.nativeElement.querySelector('.matches-page__latest-footer a');
    const rowLink = fixture.nativeElement.querySelector('.matches-page__row-cta');
    expect(latestLink.getAttribute('href')).toBe('/matches/3012');
    expect(rowLink.getAttribute('href')).toBe('/matches/3012');
  });

  it('exibe duração somente quando os dois timestamps são válidos e ordenados', () => {
    matchesApiMock.getMatches.mockReturnValue(
      of({ generatedAt: '2026-08-04T12:00:00Z', matches: [createMockMatch(1)] })
    );
    createComponent();

    expect(component['durationLabel'](createMockMatch(1))).toBe('1h 00min');
    expect(component['durationLabel'](createMockMatch(2, { startedAt: null }))).toBeNull();
    expect(component['durationLabel'](createMockMatch(3, { endedAt: 'inválido' }))).toBeNull();
    expect(
      component['durationLabel'](
        createMockMatch(4, {
          startedAt: '2026-08-04T11:00:00Z',
          endedAt: '2026-08-04T10:00:00Z',
        })
      )
    ).toBeNull();
  });

  it('renderiza score null como ausência neutra', () => {
    const match = createMockMatch(77, {
      maps: [{ mapNumber: 1, startedAt: null, endedAt: null, winner: null, name: 'de_mirage', team1Score: null, team2Score: 9 }],
    });
    const index: MatchesIndex = { generatedAt: '2026-08-04T12:00:00Z', matches: [match] };
    matchesApiMock.getMatches.mockReturnValue(of(index));
    createComponent();

    const row = fixture.nativeElement.querySelector('.matches-page__match-row') as HTMLElement;
    expect(row.textContent).toContain('—');
    expect(component['scoreLabel'](null)).toBe('—');
  });

  it('mantém o estado vazio local quando os filtros não retornam partidas', () => {
    matchesApiMock.getMatches.mockReturnValue(
      of({ generatedAt: '2026-08-04T12:00:00Z', matches: [createMockMatch(101)] })
    );
    createComponent();

    component['searchTerm'].set('termo_inexistente');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'A busca ou o filtro por mapa não retornou confrontos.'
    );
  });
});
