import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of, throwError } from 'rxjs';
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
        provideTranslateService(),
        { provide: MapsApiService, useValue: mapsApiMock },
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', { maps: { states: { header: { title: 'Rotação de mapas' }, loading: { message: 'Sincronizando a rotação de mapas.' }, error: { title: 'Mapas indisponíveis' }, empty: { message: 'Nenhum mapa foi publicado.' }, filteredEmpty: { message: 'A busca atual não encontrou mapas na rotação.' } }, hero: { title: 'Rotação de mapas', updated: 'Dados atualizados' }, overview: { maps: 'Mapas', appearances: 'Aparições' }, featured: { progressAriaLabel: '{{ map }}: {{ percent }} de participação na rotação' }, distribution: { progressAriaLabel: '{{ map }}: {{ percent }} de participação na rotação' }, counts: { appearances: { one: '{{ count }} aparição', other: '{{ count }} aparições' } }, relativeDate: { otherDays: 'há {{ days }} dias' }, catalog: {}, fallbacks: {} }, mapStatCard: {} });
    translate.setTranslation('en-US', { maps: { hero: { title: 'Map rotation' }, overview: { maps: 'Maps' }, catalog: { searchLabel: 'Search map', sortLabel: 'Sort by' } }, mapStatCard: {} });
    void translate.use('pt-BR');
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
    expect(el.textContent).toContain('Dados atualizados');
    expect(el.textContent).toContain('de_mirage');

    const metrics = el.querySelector('.maps-page__overview');
    expect(metrics?.textContent).toContain('Mapas');
    expect(metrics?.textContent).toContain('2');
    expect(metrics?.textContent).toContain('Aparições');
    expect(metrics?.textContent).toContain('80');
    expect(metrics?.textContent).toContain('1600');
    expect(metrics?.textContent).toContain('20,0');
  });

  it('escolhe o hero por maior número de aparições sem depender da ordem', () => {
    const maps = [createMockMap('de_nuke', { matches: 2 }), createMockMap('de_mirage', { matches: 8 })];
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', maps }));
    createComponent();
    expect((fixture.nativeElement.querySelector('.maps-page__hero h2') as HTMLElement).textContent).toContain('de_mirage');
  });

  it('preserva a primeira ocorrência publicada como desempate do hero', () => {
    const maps = [createMockMap('de_nuke', { matches: 8 }), createMockMap('de_mirage', { matches: 8 })];
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', maps }));
    createComponent();
    expect((fixture.nativeElement.querySelector('.maps-page__hero h2') as HTMLElement).textContent).toContain('de_nuke');
  });

  it('calcula participação na rotação e mantém todos os mapas na distribuição publicada', () => {
    const maps = [createMockMap('de_mirage', { matches: 10 }), createMockMap('de_nuke', { matches: 8 })];
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-10T12:00:00Z', maps }));
    createComponent();
    const rows = fixture.nativeElement.querySelectorAll('.maps-page__distribution-row') as NodeListOf<HTMLElement>;
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('55,6%');
    expect(rows[0].textContent).toContain('de_mirage');
    expect(rows[1].textContent).toContain('de_nuke');
  });

  it('usa fallback neutro para média e participação quando não há aparições', () => {
    const maps = [createMockMap('de_mirage', { matches: 0, rounds: 0 })];
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', maps }));
    createComponent();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.maps-page__overview')?.textContent).toContain('—');
    expect(el.querySelector('.maps-page__distribution-row')?.textContent).toContain('0,0%');
  });

  it('usa generatedAt como referência para a recência e expõe o CTA do hero', () => {
    const maps = [createMockMap('de_mirage', { lastPlayedAt: '2026-08-05T12:00:00Z' })];
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-10T12:00:00Z', maps }));
    createComponent();
    const hero = fixture.nativeElement.querySelector('.maps-page__hero') as HTMLElement;
    expect(hero.textContent).toContain('há 5 dias');
    expect((hero.querySelector('a') as HTMLAnchorElement).getAttribute('href')).toBe('/maps/de_mirage');
  });

  it('preserva a ordem remota quando o sort selecionado é "published"', () => {
    const maps: MapSummary[] = [
      createMockMap('de_nuke', { matches: 10 }),
      createMockMap('de_mirage', { matches: 50 }),
      createMockMap('de_dust2', { matches: 30 }),
    ];
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', maps }));
    createComponent();

    const cardTitles = Array.from(
      fixture.nativeElement.querySelectorAll('.maps-page__grid app-map-stat-card h3'),
      (el) => (el as HTMLElement).textContent?.trim(),
    );
    expect(cardTitles).toEqual(['de_nuke', 'de_mirage', 'de_dust2']);
  });

  it('ordena por matches, rounds, lastPlayed e name sem mutar a lista recebida', () => {
    const maps: MapSummary[] = [
      createMockMap('de_nuke', { matches: 10, rounds: 300, lastPlayedAt: '2026-08-01T10:00:00Z' }),
      createMockMap('de_mirage', { matches: 50, rounds: 100, lastPlayedAt: '2026-08-04T10:00:00Z' }),
      createMockMap('de_dust2', { matches: 30, rounds: 500, lastPlayedAt: '2026-08-02T10:00:00Z' }),
    ];
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', maps }));
    createComponent();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    const getRenderedOrder = () =>
      Array.from(
        fixture.nativeElement.querySelectorAll('.maps-page__grid app-map-stat-card h3'),
        (el) => (el as HTMLElement).textContent?.trim(),
      );

    select.value = 'matches';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(getRenderedOrder()).toEqual(['de_mirage', 'de_dust2', 'de_nuke']);

    select.value = 'rounds';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(getRenderedOrder()).toEqual(['de_dust2', 'de_nuke', 'de_mirage']);

    select.value = 'lastPlayed';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(getRenderedOrder()).toEqual(['de_mirage', 'de_dust2', 'de_nuke']);

    select.value = 'name';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(getRenderedOrder()).toEqual(['de_dust2', 'de_mirage', 'de_nuke']);

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
    mapsApiMock.getMaps
      .mockReturnValueOnce(throwError(() => new Error('HTTP 500')))
      .mockReturnValueOnce(of({ generatedAt: '2026-08-04T12:00:00Z', maps: [createMockMap('de_mirage')] }));
    createComponent();

    expect(mapsApiMock.getMaps).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('app-page-state[type="error"]')).toBeTruthy();

    const retryBtn = fixture.nativeElement.querySelector('.page-state__btn') as HTMLButtonElement;
    expect(retryBtn).toBeTruthy();
    retryBtn.click();
    fixture.detectChanges();

    expect(mapsApiMock.getMaps).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('app-page-state')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('de_mirage');
  });

  it('alteração de busca ou sort opera localmente sem realizar chamadas adicionais à API', () => {
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', maps: [createMockMap('de_mirage')] }));
    createComponent();

    expect(mapsApiMock.getMaps).toHaveBeenCalledTimes(1);

    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'mirage';
    input.dispatchEvent(new Event('input'));

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'name';
    select.dispatchEvent(new Event('change'));

    fixture.detectChanges();

    expect(mapsApiMock.getMaps).toHaveBeenCalledTimes(1);
  });

  it('troca o locale da data na mesma instância sem refetch ou reordenar mapas', async () => {
    const maps = [
      createMockMap('de_nuke'),
      createMockMap('de_mirage'),
      createMockMap('de_dust2'),
    ];
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', maps }));
    createComponent();

    const getRenderedOrder = () =>
      Array.from(
        fixture.nativeElement.querySelectorAll('.maps-page__grid app-map-stat-card h3'),
        (el) => (el as HTMLElement).textContent?.trim(),
      );

    const ptDate = (fixture.nativeElement as HTMLElement).querySelector('.maps-page__snapshot time')?.textContent?.trim();
    const initialOrder = getRenderedOrder();

    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();

    const enDate = (fixture.nativeElement as HTMLElement).querySelector('.maps-page__snapshot time')?.textContent?.trim();
    expect(enDate).not.toBe(ptDate);
    expect(getRenderedOrder()).toEqual(initialOrder);
    expect(initialOrder).toEqual(['de_nuke', 'de_mirage', 'de_dust2']);
    expect(mapsApiMock.getMaps).toHaveBeenCalledTimes(1);
  });

  it('filtra mapas pelo nome sem alterar a lista original', () => {
    const maps = [createMockMap('de_mirage'), createMockMap('de_nuke')];
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', maps }));
    createComponent();

    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'MIR';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const cardTitles = Array.from(
      fixture.nativeElement.querySelectorAll('.maps-page__grid app-map-stat-card h3'),
      (el) => (el as HTMLElement).textContent?.trim(),
    );
    expect(cardTitles).toEqual(['de_mirage']);
    expect(maps.map((map) => map.name)).toEqual(['de_mirage', 'de_nuke']);
  });

  it('exibe estado empty localizado quando a busca por nome não encontra mapas', () => {
    const maps = [createMockMap('de_mirage')];
    mapsApiMock.getMaps.mockReturnValue(of({ generatedAt: '2026-08-04T12:00:00Z', maps }));
    createComponent();

    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'mapa_inexistente';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Rotação de mapas');
    expect(el.textContent).toContain('A busca atual não encontrou mapas na rotação.');
  });
});
