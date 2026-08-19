import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, type ParamMap } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SeasonMapsApiService } from '../data-access/season-maps-api.service';
import type { SeasonMaps } from '../domain/season-maps.model';
import { SeasonMapsPage } from './season-maps-page';
import { installSeasonsTranslations } from '../../../testing/seasons-i18n.fixture';

const createMockSeasonMaps = (slug = 'season-1'): SeasonMaps => ({
  generatedAt: '2026-08-04T12:00:00Z',
  season: {
    slug,
    name: 'Season 1',
    description: null,
    status: 'active',
    startAt: '2026-01-01T00:00:00Z',
    endAt: '2026-06-30T23:59:59Z',
    coverImageUrl: null,
  },
  rules: {
    minRoundsPerMap: 12,
    seasonMembership: 'regular',
    matchDetailEndpoint: null,
    mapDetailEndpoint: null,
  },
  summary: {
    matches: 10,
    maps: 25,
    rounds: 400,
    players: 30,
    lastMapEndedAt: '2026-06-30T20:00:00Z',
  },
  computed: {
    distinctMaps: 4,
  },
  maps: [
    {
      name: 'de_mirage',
      matches: 15,
      rounds: 300,
      averageRoundsPerMatch: 20.0,
      lastPlayedAt: '2026-06-30T20:00:00Z',
    },
    {
      name: 'de_nuke',
      matches: 10,
      rounds: 100,
      averageRoundsPerMatch: 10.0,
      lastPlayedAt: null,
    },
  ],
});

describe('SeasonMapsPage', () => {
  let fixture: ComponentFixture<SeasonMapsPage>;
  let seasonMapsApiMock: { getMaps: ReturnType<typeof vi.fn> };
  let paramMapSubject: BehaviorSubject<ParamMap>;

  beforeEach(async () => {
    seasonMapsApiMock = {
      getMaps: vi.fn(),
    };
    paramMapSubject = new BehaviorSubject(convertToParamMap({ slug: 'season-1' }));

    TestBed.configureTestingModule({
      imports: [SeasonMapsPage],
      providers: [
        provideTranslateService({ fallbackLang: 'pt-BR' }),
        provideRouter([]),
        { provide: SeasonMapsApiService, useValue: seasonMapsApiMock },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMapSubject.asObservable() },
        },
      ],
    });
    await installSeasonsTranslations(TestBed.inject(TranslateService));
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(SeasonMapsPage);
    fixture.detectChanges();
  };

  it('o componente pode ser criado e carrega os mapas da Season', () => {
    seasonMapsApiMock.getMaps.mockReturnValue(
      of({ kind: 'available', maps: createMockSeasonMaps('season-1') })
    );
    createComponent();

    expect(fixture.componentInstance).toBeTruthy();
    expect(seasonMapsApiMock.getMaps).toHaveBeenCalledWith('season-1');

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Season 1');
    expect(el.textContent).toContain('de_mirage');
    expect(el.textContent).toContain('Mapas distintos');
    expect(el.textContent).toContain('20.0');
    expect(el.textContent).toContain('30/06/2026');
    expect(el.querySelector<HTMLAnchorElement>('.season-map-card a')?.getAttribute('href')).toBe('/maps/de_mirage');
  });

  it('switches map-pool chrome at runtime while preserving search, sort, maps, links, and requests', async () => {
    const data = createMockSeasonMaps('season-1');
    seasonMapsApiMock.getMaps.mockReturnValue(of({ kind: 'available', maps: data }));
    const translate = TestBed.inject(TranslateService);
    createComponent();
    const search = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    search.value = 'mirage'; search.dispatchEvent(new Event('input')); select.value = 'name'; select.dispatchEvent(new Event('change')); fixture.detectChanges();
    const calls = seasonMapsApiMock.getMaps.mock.calls.length;
    const links = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
    const hrefs = Array.from(links, (link) => link.getAttribute('href'));
    expect(fixture.nativeElement.textContent).toContain('Map pool da temporada'); expect(fixture.nativeElement.textContent).toContain('Buscar mapa'); expect(fixture.nativeElement.textContent).toContain('Ordenar por'); expect(fixture.nativeElement.textContent).toContain('Média de rounds');
    await translate.use('en-US').toPromise(); fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Season map pool'); expect(text).toContain('Search map'); expect(text).toContain('Sort by'); expect(text).toContain('Average rounds'); expect(text).toContain('View map');
    expect(text).toContain('de_mirage'); expect(search.value).toBe('mirage'); expect(select.value).toBe('name');
    const localizedLinks = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
    expect(Array.from(localizedLinks, (link) => link.getAttribute('href'))).toEqual(hrefs);
    expect(seasonMapsApiMock.getMaps).toHaveBeenCalledTimes(calls);
  });

  it('passa null para o serviço no recorte /seasons/current/maps (slug ausente)', () => {
    paramMapSubject.next(convertToParamMap({}));
    seasonMapsApiMock.getMaps.mockReturnValue(
      of({ kind: 'available', maps: createMockSeasonMaps('active-season') })
    );
    createComponent();

    expect(seasonMapsApiMock.getMaps).toHaveBeenCalledWith(null);
  });

  it('exibe estado season-unavailable quando a Season não for encontrada', () => {
    seasonMapsApiMock.getMaps.mockReturnValue(of({ kind: 'season-unavailable' }));
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Temporada não encontrada');
  });

  it('preserva published por padrão e aplica busca e ordenações locais sem mutar o array original', () => {
    const data = createMockSeasonMaps('season-1');
    const publishedMaps = [data.maps[1]!, data.maps[0]!];
    seasonMapsApiMock.getMaps.mockReturnValue(of({ kind: 'available', maps: { ...data, maps: publishedMaps } }));
    createComponent();

    const originalOrder = publishedMaps.map((m) => m.name);
    const getRenderedOrder = () =>
      Array.from(
        fixture.nativeElement.querySelectorAll('.season-map-card h3'),
        (el) => (el as HTMLElement).textContent?.trim(),
      );

    const searchInput = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    const sortSelect = fixture.nativeElement.querySelector('select') as HTMLSelectElement;

    expect(getRenderedOrder()).toEqual(['de_nuke', 'de_mirage']);

    searchInput.value = 'nuke';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(getRenderedOrder()).toEqual(['de_nuke']);

    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    sortSelect.value = 'matches';
    sortSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(getRenderedOrder()).toEqual(['de_mirage', 'de_nuke']);

    sortSelect.value = 'rounds';
    sortSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(getRenderedOrder()).toEqual(['de_mirage', 'de_nuke']);

    sortSelect.value = 'lastPlayed';
    sortSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(getRenderedOrder()).toEqual(['de_mirage', 'de_nuke']);

    sortSelect.value = 'name';
    sortSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(getRenderedOrder()).toEqual(['de_mirage', 'de_nuke']);

    expect(publishedMaps.map((m) => m.name)).toEqual(originalOrder);
  });

  it('usa artwork local somente para mapas conhecidos e fallback para desconhecidos', () => {
    const data = createMockSeasonMaps('season-1');
    const maps = [
      {
        name: 'de_mirage',
        matches: 15,
        rounds: 300,
        averageRoundsPerMatch: 20.0,
        lastPlayedAt: '2026-06-30T20:00:00Z',
      },
      {
        name: 'de_unknown',
        matches: 5,
        rounds: 50,
        averageRoundsPerMatch: 10.0,
        lastPlayedAt: null,
      },
    ];
    seasonMapsApiMock.getMaps.mockReturnValue(
      of({ kind: 'available', maps: { ...data, maps } })
    );
    createComponent();

    const cards = fixture.nativeElement.querySelectorAll('.season-map-card') as NodeListOf<HTMLElement>;
    const mirageCard = Array.from(cards).find((c) => c.querySelector('h3')?.textContent?.trim() === 'de_mirage');
    const unknownCard = Array.from(cards).find((c) => c.querySelector('h3')?.textContent?.trim() === 'de_unknown');

    expect(mirageCard).toBeTruthy();
    expect(mirageCard?.style.getPropertyValue('--map-bg')).toContain('map-images/de_mirage.png');

    expect(unknownCard).toBeTruthy();
    expect(unknownCard?.style.getPropertyValue('--map-bg')).toBe('none');
  });

  it('mantém o contexto sazonal e exibe empty específico quando a Season não possui mapas', () => {
    const data = createMockSeasonMaps('season-1');
    seasonMapsApiMock.getMaps.mockReturnValue(
      of({ kind: 'available', maps: { ...data, maps: [] } })
    );
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Season 1');
    expect(el.textContent).toContain('Mapas distintos');
    expect(el.textContent).toContain('Nenhum mapa na temporada');
    expect(el.querySelector('app-season-tabs')).toBeTruthy();
  });

  it('exibe estado error para falhas genéricas da requisição', () => {
    seasonMapsApiMock.getMaps.mockReturnValue(
      throwError(() => new Error('Falha de rede'))
    );
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Mapas indisponíveis');
  });
});
