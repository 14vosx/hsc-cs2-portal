import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, type ParamMap } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SeasonMapsApiService } from '../data-access/season-maps-api.service';
import type { SeasonMaps } from '../domain/season-maps.model';
import { SeasonMapsPage } from './season-maps-page';

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
  let component: SeasonMapsPage;
  let fixture: ComponentFixture<SeasonMapsPage>;
  let seasonMapsApiMock: { getMaps: ReturnType<typeof vi.fn> };
  let paramMapSubject: BehaviorSubject<ParamMap>;

  beforeEach(() => {
    seasonMapsApiMock = {
      getMaps: vi.fn(),
    };
    paramMapSubject = new BehaviorSubject(convertToParamMap({ slug: 'season-1' }));

    TestBed.configureTestingModule({
      imports: [SeasonMapsPage],
      providers: [
        provideRouter([]),
        { provide: SeasonMapsApiService, useValue: seasonMapsApiMock },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMapSubject.asObservable() },
        },
      ],
    });
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(SeasonMapsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('o componente pode ser criado e carrega os mapas da Season', () => {
    seasonMapsApiMock.getMaps.mockReturnValue(
      of({ kind: 'available', maps: createMockSeasonMaps('season-1') })
    );
    createComponent();

    expect(component).toBeTruthy();
    expect(seasonMapsApiMock.getMaps).toHaveBeenCalledWith('season-1');

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Season 1');
    expect(el.textContent).toContain('de_mirage');
    expect(el.textContent).toContain('Mapas distintos');
    expect(el.textContent).toContain('20.0');
    expect(el.textContent).toContain('30/06/2026');
    expect(el.querySelector<HTMLAnchorElement>('.season-map-card a')?.getAttribute('href')).toBe('/maps/de_mirage');
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
    expect(el.textContent).toContain('Season não encontrada');
  });

  it('preserva published por padrão e aplica busca e ordenações locais sem mutar o array original', () => {
    const data = createMockSeasonMaps('season-1');
    const publishedMaps = [data.maps[1]!, data.maps[0]!];
    seasonMapsApiMock.getMaps.mockReturnValue(of({ kind: 'available', maps: { ...data, maps: publishedMaps } }));
    createComponent();

    const originalOrder = publishedMaps.map((m) => m.name);
    expect(component['visibleMaps'](publishedMaps).map((m) => m.name)).toEqual(['de_nuke', 'de_mirage']);

    component['searchTerm'].set('nuke');
    expect(component['visibleMaps'](publishedMaps).map((m) => m.name)).toEqual(['de_nuke']);
    component['searchTerm'].set('');

    component['sortBy'].set('matches');
    expect(component['visibleMaps'](publishedMaps).map((m) => m.name)).toEqual(['de_mirage', 'de_nuke']);

    component['sortBy'].set('rounds');
    expect(component['visibleMaps'](publishedMaps).map((m) => m.name)).toEqual(['de_mirage', 'de_nuke']);

    component['sortBy'].set('lastPlayed');
    expect(component['visibleMaps'](publishedMaps).map((m) => m.name)).toEqual(['de_mirage', 'de_nuke']);

    component['sortBy'].set('name');
    expect(component['visibleMaps'](publishedMaps).map((m) => m.name)).toEqual(['de_mirage', 'de_nuke']);
    expect(publishedMaps.map((m) => m.name)).toEqual(originalOrder);
  });

  it('usa artwork local somente para mapas conhecidos e fallback para desconhecidos', () => {
    seasonMapsApiMock.getMaps.mockReturnValue(
      of({ kind: 'available', maps: createMockSeasonMaps('season-1') })
    );
    createComponent();

    expect(component['mapBackgroundImage']('de_mirage')).toBe('url("map-images/de_mirage.png")');
    expect(component['mapBackgroundImage']('de_unknown')).toBe('none');
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
    expect(el.textContent).toContain('Nenhum mapa na Season');
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
