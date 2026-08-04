import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MapsApiService, MapsContractError } from '../data-access/maps-api.service';
import type { MapDetail } from '../domain/map.model';
import { MapDetailPage } from './map-detail-page';

const createMockMapDetail = (name = 'de_mirage'): MapDetail => ({
  generatedAt: '2026-08-04T12:00:00Z',
  name,
  lifetime: {
    matches: 42,
    rounds: 920,
    averageRoundsPerMatch: 21.9,
    lastPlayedAt: '2026-08-04T12:00:00Z',
  },
  recentMatches: [
    {
      matchId: 101,
      seriesType: 'BO3',
      endedAt: '2026-08-04T12:00:00Z',
      winner: 'Team A',
      team1: { name: 'Team A', score: 2 },
      team2: { name: 'Team B', score: 1 },
      mapNumber: 1,
      mapScore: { team1: 13, team2: 7 },
    },
    {
      matchId: 102,
      seriesType: 'BO1',
      endedAt: '2026-08-03T18:00:00Z',
      winner: 'Team B',
      team1: { name: 'Team A', score: 0 },
      team2: { name: 'Team B', score: 1 },
      mapNumber: 1,
      mapScore: { team1: 9, team2: 13 },
    },
  ],
});

describe('MapDetailPage', () => {
  let component: MapDetailPage;
  let fixture: ComponentFixture<MapDetailPage>;
  let mapsApiMock: { getMap: ReturnType<typeof vi.fn> };
  let paramMapSubject: BehaviorSubject<any>;

  beforeEach(() => {
    mapsApiMock = {
      getMap: vi.fn(),
    };
    paramMapSubject = new BehaviorSubject(convertToParamMap({ map: 'de_mirage' }));

    TestBed.configureTestingModule({
      imports: [MapDetailPage],
      providers: [
        provideRouter([]),
        { provide: MapsApiService, useValue: mapsApiMock },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMapSubject.asObservable() },
        },
      ],
    });
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(MapDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('o componente pode ser criado e carrega os detalhes do mapa válido', () => {
    mapsApiMock.getMap.mockReturnValue(of(createMockMapDetail('de_mirage')));
    createComponent();

    expect(component).toBeTruthy();
    expect(mapsApiMock.getMap).toHaveBeenCalledWith('de_mirage');

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('de_mirage');
    expect(el.textContent).toContain('42 partidas registradas');
  });

  it('aceita mapa com nome customizado válido e faz a requisição corretamente', () => {
    paramMapSubject.next(convertToParamMap({ map: 'de_aim_map_custom' }));
    mapsApiMock.getMap.mockReturnValue(of(createMockMapDetail('de_aim_map_custom')));
    createComponent();

    expect(mapsApiMock.getMap).toHaveBeenCalledWith('de_aim_map_custom');
  });

  it('emite not-found imediatamente sem chamar o serviço para parâmetro vazio ou somente whitespace', () => {
    paramMapSubject.next(convertToParamMap({ map: '   ' }));
    createComponent();

    expect(mapsApiMock.getMap).not.toHaveBeenCalled();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Mapa não encontrado');
  });

  it('converte erro HTTP 404 para estado not-found', () => {
    mapsApiMock.getMap.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }))
    );
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Mapa não encontrado');
  });

  it('converte erro HTTP 500 ou MapsContractError para estado error', () => {
    mapsApiMock.getMap.mockReturnValue(
      throwError(() => new MapsContractError('Payload malformado'))
    );
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Erro ao carregar mapa');
  });

  it('mudança de parâmetro na rota aciona nova requisição', () => {
    mapsApiMock.getMap.mockReturnValue(of(createMockMapDetail('de_mirage')));
    createComponent();

    expect(mapsApiMock.getMap).toHaveBeenCalledWith('de_mirage');

    mapsApiMock.getMap.mockReturnValue(of(createMockMapDetail('de_nuke')));
    paramMapSubject.next(convertToParamMap({ map: 'de_nuke' }));
    fixture.detectChanges();

    expect(mapsApiMock.getMap).toHaveBeenCalledWith('de_nuke');
  });

  it('renderiza breadcrumbs, link de voltar e link para JSON público com nome codificado', () => {
    mapsApiMock.getMap.mockReturnValue(of(createMockMapDetail('de_mirage')));
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.map-detail-page__breadcrumbs')).not.toBeNull();

    const apiLink = el.querySelector('.map-detail-page__api') as HTMLAnchorElement;
    expect(apiLink.href).toContain('/api/cs2/v2/map/de_mirage.json');
  });

  it('exibe estado empty localizado na seção quando o mapa não possui partidas recentes', () => {
    const detail = createMockMapDetail('de_dust2');
    const emptyMatchesDetail: MapDetail = {
      ...detail,
      recentMatches: [],
    };
    mapsApiMock.getMap.mockReturnValue(of(emptyMatchesDetail));
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('de_dust2');
    expect(el.textContent).toContain('Este mapa ainda não possui partidas recentes no histórico.');
  });
});
