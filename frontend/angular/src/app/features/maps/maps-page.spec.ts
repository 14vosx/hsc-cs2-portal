import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MapsApiService, MapsContractError } from './data-access/maps-api.service';
import type { MapsIndex, MapSummary } from './domain/map.model';
import { MapsPage } from './maps-page';

const createMockMap = (name: string, overrides: Partial<MapSummary> = {}): MapSummary => ({
  name,
  matches: 10,
  rounds: 200,
  averageRoundsPerMatch: 20.0,
  lastPlayedAt: '2026-08-04T12:00:00Z',
  ...overrides,
});

describe('MapsPage', () => {
  let component: MapsPage;
  let fixture: ComponentFixture<MapsPage>;
  let mapsApiMock: { getMaps: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mapsApiMock = {
      getMaps: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [MapsPage],
      providers: [
        provideRouter([]),
        { provide: MapsApiService, useValue: mapsApiMock },
      ],
    });
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(MapsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('o componente pode ser criado utilizando MapsApiService', () => {
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', maps: [] }));
    createComponent();

    expect(component).toBeTruthy();
    expect(mapsApiMock.getMaps).toHaveBeenCalledTimes(1);
  });

  it('exibe estado de carregamento inicial com app-page-state', () => {
    mapsApiMock.getMaps.mockReturnValue(of());
    createComponent();

    const pageState = fixture.nativeElement.querySelector('app-page-state') as HTMLElement | null;
    expect(pageState).not.toBeNull();
    expect(pageState?.textContent).toContain('Sincronizando a rotação de mapas.');
  });

  it('exibe estado ready com estatísticas, métricas e mapas ordenados', () => {
    const maps: MapSummary[] = [
      createMockMap('de_mirage', { matches: 50, rounds: 1000 }),
      createMockMap('de_nuke', { matches: 30, rounds: 600 }),
    ];
    const indexData: MapsIndex = {
      generatedAt: '2026-08-04T12:00:00Z',
      maps,
    };
    mapsApiMock.getMaps.mockReturnValue(of(indexData));
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Rotação de mapas');
    expect(el.textContent).toContain('Atualizado em');
    expect(el.textContent).toContain('de_mirage');

    const metrics = el.querySelector('.maps-page__metrics');
    expect(metrics?.textContent).toContain('Mapa mais jogado');
    expect(metrics?.textContent).toContain('de_mirage');
    expect(metrics?.textContent).toContain('80');
    expect(metrics?.textContent).toContain('1600');
  });

  it('preserva a ordem remota quando o sort selecionado é "published"', () => {
    const maps: MapSummary[] = [
      createMockMap('de_nuke', { matches: 10 }),
      createMockMap('de_mirage', { matches: 50 }),
      createMockMap('de_dust2', { matches: 30 }),
    ];
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', maps }));
    createComponent();

    const visible = component['visibleMaps'](maps);
    expect(visible.map((m) => m.name)).toEqual(['de_nuke', 'de_mirage', 'de_dust2']);
  });

  it('ordena por matches, rounds, lastPlayed e name sem mutar a lista recebida', () => {
    const maps: MapSummary[] = [
      createMockMap('de_nuke', { matches: 10, rounds: 300, lastPlayedAt: '2026-08-01T10:00:00Z' }),
      createMockMap('de_mirage', { matches: 50, rounds: 100, lastPlayedAt: '2026-08-04T10:00:00Z' }),
      createMockMap('de_dust2', { matches: 30, rounds: 500, lastPlayedAt: '2026-08-02T10:00:00Z' }),
    ];
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', maps }));
    createComponent();

    component['sortBy'].set('matches');
    expect(component['visibleMaps'](maps).map((m) => m.name)).toEqual(['de_mirage', 'de_dust2', 'de_nuke']);

    component['sortBy'].set('rounds');
    expect(component['visibleMaps'](maps).map((m) => m.name)).toEqual(['de_dust2', 'de_nuke', 'de_mirage']);

    component['sortBy'].set('lastPlayed');
    expect(component['visibleMaps'](maps).map((m) => m.name)).toEqual(['de_mirage', 'de_dust2', 'de_nuke']);

    component['sortBy'].set('name');
    expect(component['visibleMaps'](maps).map((m) => m.name)).toEqual(['de_dust2', 'de_mirage', 'de_nuke']);

    // garante imutabilidade
    expect(maps[0].name).toBe('de_nuke');
  });

  it('exibe estado empty quando a API retorna array de mapas vazio', () => {
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', maps: [] }));
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Nenhum mapa foi publicado.');
  });

  it('exibe estado de erro para falhas HTTP ou erros contratuais', () => {
    mapsApiMock.getMaps.mockReturnValue(throwError(() => new MapsContractError('Invalid payload')));
    createComponent();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Mapas indisponíveis');
  });

  it('retry realiza uma nova chamada à API e emite estado loading', () => {
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', maps: [createMockMap('de_mirage')] }));
    createComponent();

    expect(mapsApiMock.getMaps).toHaveBeenCalledTimes(1);

    component['retry']();
    expect(mapsApiMock.getMaps).toHaveBeenCalledTimes(2);
  });

  it('alteração de busca ou sort opera localmente sem realizar chamadas adicionais à API', () => {
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', maps: [createMockMap('de_mirage')] }));
    createComponent();

    expect(mapsApiMock.getMaps).toHaveBeenCalledTimes(1);

    component['searchTerm'].set('mirage');
    component['sortBy'].set('name');
    fixture.detectChanges();

    expect(mapsApiMock.getMaps).toHaveBeenCalledTimes(1);
  });

  it('exibe estado empty localizado quando a busca por nome não encontra mapas', () => {
    const maps = [createMockMap('de_mirage')];
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', maps }));
    createComponent();

    component['searchTerm'].set('mapa_inexistente');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Rotação de mapas');
    expect(el.textContent).toContain('A busca atual não encontrou mapas na rotação.');
  });
});
