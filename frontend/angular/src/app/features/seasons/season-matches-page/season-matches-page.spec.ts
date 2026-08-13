import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, type ParamMap } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SeasonMatchesApiService } from '../data-access/season-matches-api.service';
import type { SeasonMatches } from '../domain/season-matches.model';
import { SeasonMatchesPage } from './season-matches-page';
import { installSeasonsTranslations } from '../../../testing/seasons-i18n.fixture';

const createMockSeasonMatches = (slug = 'season-1'): SeasonMatches => ({
  generatedAt: '2026-08-04T12:00:00Z',
  season: {
    slug,
    name: 'Season 1',
    description: 'Descrição',
    status: 'active',
    startAt: '2026-01-01T00:00:00Z',
    endAt: '2026-06-30T23:59:59Z',
    coverImageUrl: 'https://example.com/cover.png',
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
      id: 101,
      startedAt: '2026-01-02T10:00:00Z',
      endedAt: '2026-01-02T11:30:00Z',
      winner: 'Team A',
      seriesType: 'BO3',
      team1: { name: 'Team A', score: 2 },
      team2: { name: 'Team B', score: 1 },
      serverIp: '10.0.0.1',
      seasonMapCount: 3,
      seasonRounds: 45,
      seasonFirstMapStartedAt: '2026-01-02T10:00:00Z',
      seasonLastMapEndedAt: '2026-01-02T11:30:00Z',
      maps: [
        {
          mapNumber: 1,
          startedAt: '2026-01-02T10:00:00Z',
          endedAt: '2026-01-02T10:40:00Z',
          winner: 'Team A',
          name: 'de_nuke',
          team1Score: 13,
          team2Score: 7,
          rounds: 20,
        },
      ],
    },
  ],
});

describe('SeasonMatchesPage', () => {
  let component: SeasonMatchesPage;
  let fixture: ComponentFixture<SeasonMatchesPage>;
  let seasonMatchesApiMock: { getMatches: ReturnType<typeof vi.fn> };
  let paramMapSubject: BehaviorSubject<ParamMap>;

  beforeEach(async () => {
    seasonMatchesApiMock = {
      getMatches: vi.fn(),
    };
    paramMapSubject = new BehaviorSubject(convertToParamMap({ slug: 'season-1' }));

    TestBed.configureTestingModule({
      imports: [SeasonMatchesPage],
      providers: [
        provideTranslateService({ fallbackLang: 'pt-BR' }),
        provideRouter([]),
        { provide: SeasonMatchesApiService, useValue: seasonMatchesApiMock },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMapSubject.asObservable() },
        },
      ],
    });
    await installSeasonsTranslations(TestBed.inject(TranslateService));
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(SeasonMatchesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('o componente pode ser criado e carrega as partidas da Season', () => {
    seasonMatchesApiMock.getMatches.mockReturnValue(
      of({ kind: 'available', matches: createMockSeasonMatches('season-1') })
    );
    createComponent();

    expect(component).toBeTruthy();
    expect(seasonMatchesApiMock.getMatches).toHaveBeenCalledWith('season-1');

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Season 1');
    expect(el.textContent).toContain('#101');
  });

  it('switches match chrome at runtime without changing published match data or refetching', async () => {
    const data = createMockSeasonMatches('season-1');
    seasonMatchesApiMock.getMatches.mockReturnValue(of({ kind: 'available', matches: data }));
    const translate = TestBed.inject(TranslateService);
    createComponent();
    const calls = seasonMatchesApiMock.getMatches.mock.calls.length;
    const links = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
    const hrefs = Array.from(links, (link) => link.getAttribute('href'));
    expect(fixture.nativeElement.textContent).toContain('Partida'); expect(fixture.nativeElement.textContent).toContain('Vencedor'); expect(fixture.nativeElement.textContent).toContain('Histórico da temporada');
    await translate.use('en-US').toPromise(); fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Match'); expect(text).toContain('Winner'); expect(text).toContain('Season history');
    for (const value of ['VS', data.matches[0].seriesType!, data.matches[0].team1.name, data.matches[0].team2.name, data.matches[0].winner!, data.matches[0].maps[0].name, String(data.matches[0].id), String(data.matches[0].team1.score), String(data.matches[0].team2.score)]) expect(text).toContain(value);
    const localizedLinks = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
    expect(Array.from(localizedLinks, (link) => link.getAttribute('href'))).toEqual(hrefs);
    expect(seasonMatchesApiMock.getMatches).toHaveBeenCalledTimes(calls);
  });

  it('passa null para o serviço no recorte /seasons/current/matches (slug ausente)', () => {
    paramMapSubject.next(convertToParamMap({}));
    seasonMatchesApiMock.getMatches.mockReturnValue(
      of({ kind: 'available', matches: createMockSeasonMatches('active-season') })
    );
    createComponent();

    expect(seasonMatchesApiMock.getMatches).toHaveBeenCalledWith(null);
  });

  it('preserva a ordem publicada, placares, vencedor, metadata sazonal e CTA dos matches', () => {
    const data = createMockSeasonMatches('season-1');
    const originalMatch = data.matches[0]!;
    const publishedFirst = {
      ...originalMatch,
      id: 202,
      winner: 'Team D',
      seriesType: 'BO1',
      team1: { name: 'Team C', score: 0 },
      team2: { name: 'Team D', score: 1 },
      seasonMapCount: 1,
      seasonRounds: 22,
    };
    seasonMatchesApiMock.getMatches.mockReturnValue(
      of({ kind: 'available', matches: { ...data, matches: [publishedFirst, originalMatch] } })
    );
    createComponent();

    const entries = fixture.nativeElement.querySelectorAll('.season-matches__match') as NodeListOf<HTMLElement>;
    expect(entries).toHaveLength(2);
    expect(entries[0].textContent).toContain('#202');
    expect(entries[1].textContent).toContain('#101');
    expect(entries[0].textContent).toContain('Team C');
    expect(entries[0].textContent).toContain('Team D');
    expect(entries[0].textContent).toContain('Vencedor Team D');
    expect(entries[0].textContent).toContain('BO1');
    expect(entries[0].textContent).toContain('1 mapa na temporada');
    expect(entries[0].textContent).toContain('22 rounds válidos');
    expect(entries[0].querySelector('.season-matches__team--one b')?.textContent).toContain('0');
    expect(entries[0].querySelector('.season-matches__team--two b')?.textContent).toContain('1');
    expect(entries[0].querySelector<HTMLAnchorElement>('.season-matches__cta')?.getAttribute('href')).toBe('/matches/202');
    expect(entries[0].textContent).not.toContain('10.0.0.1');
  });

  it('exibe estado season-unavailable quando a Season não for encontrada', () => {
    seasonMatchesApiMock.getMatches.mockReturnValue(of({ kind: 'season-unavailable' }));
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Temporada não encontrada');
  });

  it('exibe estado empty localizado na seção quando a Season não possui partidas', () => {
    const emptyMatches = { ...createMockSeasonMatches('season-1'), matches: [] };
    seasonMatchesApiMock.getMatches.mockReturnValue(
      of({ kind: 'available', matches: emptyMatches })
    );
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Season 1');
    expect(el.textContent).toContain('Nenhuma partida na temporada');
  });

  it('exibe estado error para falhas genéricas da requisição', () => {
    seasonMatchesApiMock.getMatches.mockReturnValue(
      throwError(() => new Error('Falha de rede'))
    );
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Partidas indisponíveis');
  });
});
