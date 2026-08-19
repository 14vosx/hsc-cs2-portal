import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of, throwError } from 'rxjs';
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
  let fixture: ComponentFixture<MatchesPage>;
  let matchesApiMock: { getMatches: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    matchesApiMock = { getMatches: vi.fn() };

    TestBed.configureTestingModule({
      imports: [MatchesPage],
      providers: [provideRouter([]), provideTranslateService(), { provide: MatchesApiService, useValue: matchesApiMock }],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', { matches: { states: { loading: { title: 'Carregando partidas...', message: 'Sincronizando o histórico de partidas.' }, error: { title: 'Partidas indisponíveis', message: 'Erro', retry: 'Tentar novamente' }, empty: { title: 'Nenhuma partida encontrada', message: 'Nenhuma partida finalizada foi publicada.' }, filteredEmpty: { title: 'Nenhuma partida encontrada', message: 'A busca ou o filtro por mapa não retornou confrontos.' } }, hero: {}, summary: { ariaLabel: 'Resumo das partidas' }, history: {}, filters: {}, latest: { winner: 'Vencedor', seriesMapsAriaLabel: 'Mapas da série' }, feed: { winner: 'Vencedor', seriesMapsAriaLabel: 'Mapas da série' }, results: { summary: { one: 'Exibindo {{ start }}–{{ end }} de {{ total }} partida', other: 'Exibindo {{ start }}–{{ end }} de {{ total }} partidas' } }, pagination: {}, fallbacks: { map: 'Mapa não informado', team: 'Time não informado', date: 'Sem data disponível' }, counts: { maps: { one: '{{ count }} mapa', other: '{{ count }} mapas' } } } });
    translate.setTranslation('en-US', { matches: { hero: { eyebrow: 'Matches', title: 'Competitive history', description: 'Recent HSC CS2 results.', syncActive: 'Sync active', updatedAt: 'Updated at' }, states: {}, summary: { ariaLabel: 'Matches summary', matches: 'Matches', mapsPlayed: 'Maps played', latestMatch: 'Latest match' }, history: { eyebrow: 'History', title: 'Recent matches', description: 'Browse published matchups.' }, filters: { mapLabel: 'Map filter', allMaps: 'All maps', searchLabel: 'Search match', searchPlaceholder: 'Match ID, team, winner, series or map' }, latest: { ariaLabel: 'Latest match', eyebrow: 'LATEST MATCH', title: 'Latest match', winner: 'Winner', seriesMapsAriaLabel: 'Series maps', reportCta: 'View report and highlights' }, feed: { ariaLabel: 'Match feed', winner: 'Winner', seriesMapsAriaLabel: 'Series maps', detailsCta: 'View details' }, results: { summary: { one: 'Showing {{ start }}–{{ end }} of {{ total }} match', other: 'Showing {{ start }}–{{ end }} of {{ total }} matches' } }, pagination: { ariaLabel: 'Match pagination', previous: 'Previous', next: 'Next' }, fallbacks: { map: 'Map unavailable', team: 'Team unavailable', date: 'No date available' }, counts: { maps: { one: '{{ count }} map', other: '{{ count }} maps' } } } });
    void translate.use('pt-BR');
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(MatchesPage);
    fixture.detectChanges();
  };

  it('exibe o estado de loading', () => {
    matchesApiMock.getMatches.mockReturnValue(of());
    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Sincronizando o histórico de partidas.');
  });

  it('exibe erro e permite tentar novamente', () => {
    matchesApiMock.getMatches
      .mockReturnValueOnce(throwError(() => new MatchesContractError('Invalid payload')))
      .mockReturnValueOnce(of({ generatedAt: '2026-08-04T12:00:00Z', matches: [createMockMatch(1)] }));
    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Partidas indisponíveis');
    const retryBtn = fixture.nativeElement.querySelector('.page-state__btn') as HTMLButtonElement;
    expect(retryBtn).toBeTruthy();
    retryBtn.click();
    fixture.detectChanges();

    expect(matchesApiMock.getMatches).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('app-page-state')).toBeNull();
    expect(fixture.nativeElement.querySelector('.matches-page__latest')).toBeTruthy();
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

    const searchInput = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;

    for (const term of ['101', 'furia', 'team b', 'bo3', 'de_nuke']) {
      searchInput.value = term;
      searchInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.matches-page__match-row');
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].textContent).toContain('#101');
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

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'de_mirage';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.matches-page__match-row');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('#8');
    expect(rows[1].textContent).toContain('#5');
  });

  it('pagina em blocos de 10 preservando a ordem e a quantidade da página final', () => {
    const matches = Array.from({ length: 23 }, (_, index) => createMockMatch(100 + index));
    matchesApiMock.getMatches.mockReturnValue(
      of({ generatedAt: '2026-08-04T12:00:00Z', matches })
    );
    createComponent();

    const pageButtons = fixture.nativeElement.querySelectorAll(
      '.matches-page__page-number'
    ) as NodeListOf<HTMLButtonElement>;
    expect(pageButtons).toHaveLength(3);
    pageButtons[2].click();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.matches-page__match-row');
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain('#120');
    expect(rows[1].textContent).toContain('#121');
    expect(rows[2].textContent).toContain('#122');
    expect(fixture.nativeElement.textContent).toContain('Exibindo 21–23 de 23 partidas');
  });

  it('reseta para a primeira página ao alterar busca ou filtro de mapa', () => {
    const matches = Array.from({ length: 15 }, (_, index) => createMockMatch(100 + index));
    matchesApiMock.getMatches.mockReturnValue(
      of({ generatedAt: '2026-08-04T12:00:00Z', matches })
    );
    createComponent();

    const getPageButtons = () =>
      fixture.nativeElement.querySelectorAll('.matches-page__page-number') as NodeListOf<HTMLButtonElement>;

    getPageButtons()[1].click();
    fixture.detectChanges();
    expect(getPageButtons()[1].getAttribute('aria-current')).toBe('page');

    const searchInput = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    searchInput.value = '10';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(getPageButtons()[0].getAttribute('aria-current')).toBe('page');

    getPageButtons()[1].click();
    fixture.detectChanges();
    expect(getPageButtons()[1].getAttribute('aria-current')).toBe('page');

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'de_mirage';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(getPageButtons()[0].getAttribute('aria-current')).toBe('page');
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
    const matches = [
      createMockMatch(1, { startedAt: '2026-08-04T10:00:00Z', endedAt: '2026-08-04T11:00:00Z' }),
      createMockMatch(2, { startedAt: null }),
      createMockMatch(3, { endedAt: 'inválido' }),
      createMockMatch(4, { startedAt: '2026-08-04T11:00:00Z', endedAt: '2026-08-04T10:00:00Z' }),
    ];
    matchesApiMock.getMatches.mockReturnValue(
      of({ generatedAt: '2026-08-04T12:00:00Z', matches })
    );
    createComponent();

    const rows = fixture.nativeElement.querySelectorAll('.matches-page__match-row');
    expect(rows[0].querySelector('.matches-page__row-context')?.textContent).toContain('1h 00min');
    expect(rows[1].querySelector('.matches-page__row-context')?.textContent ?? '').not.toContain('min');
    expect(rows[2].querySelector('.matches-page__row-context')?.textContent ?? '').not.toContain('min');
    expect(rows[3].querySelector('.matches-page__row-context')?.textContent ?? '').not.toContain('min');
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
  });

  it('mantém o estado vazio local quando os filtros não retornam partidas', () => {
    matchesApiMock.getMatches.mockReturnValue(
      of({ generatedAt: '2026-08-04T12:00:00Z', matches: [createMockMatch(101)] })
    );
    createComponent();

    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'termo_inexistente';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'A busca ou o filtro por mapa não retornou confrontos.'
    );
  });

  it('troca a UI ready para en-US sem alterar estado, domínio ou nova request', async () => {
    const matches = Array.from({ length: 11 }, (_, index) => createMockMatch(501 + index));
    matchesApiMock.getMatches.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', matches }));
    createComponent();
    expect(fixture.nativeElement.textContent).toContain('Vencedor');

    const translate = TestBed.inject(TranslateService);
    await firstValueFrom(translate.use('en-US'));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Competitive history');
    expect(text).toContain('Map filter');
    expect(fixture.nativeElement.querySelector('input[type="search"]').getAttribute('placeholder')).toBe('Match ID, team, winner, series or map');
    expect(text).toContain('Winner');
    expect(text).toContain('Previous');
    expect(text).toContain('Next');
    for (const value of ['Team A', 'Team B', 'de_mirage', 'BO3', '#501', '13', '7', 'VS']) expect(text).toContain(value);
    expect(matchesApiMock.getMatches).toHaveBeenCalledTimes(1);
  });
});
