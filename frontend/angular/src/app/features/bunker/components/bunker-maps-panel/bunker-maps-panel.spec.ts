import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import type { BunkerMapPerformance, BunkerRecentMap } from '../../domain/bunker.model';
import { BunkerMapsPanel } from './bunker-maps-panel';

const TRANSLATIONS = { bunker: { maps: {
  ariaLabel: 'Desempenho por mapa', eyebrow: 'Desempenho por mapa', selector: 'Selecionar mapa', map: 'Mapa',
  volume: { title: 'Volume competitivo', one: '{{ count }} partida', other: '{{ count }} partidas' },
  fundamentals: { title: 'Fundamentos neste mapa' }, multikills: 'Multi-kills',
  metrics: { winRate: 'Win Rate', kd: 'K/D', adr: 'ADR', impact: 'Impact', headshotPct: 'HS%', accuracy: 'Accuracy', entryWinRate: 'Entry Win Rate', utilityPerRound: 'Utility / Round', kills: 'Kills', deaths: 'Deaths', assists: 'Assists', rounds: 'Rounds' },
  recent: { title: 'Partidas recentes neste mapa', date: 'Data', score: 'Placar', result: 'Resultado', empty: 'Nenhuma partida recente deste mapa disponível no contexto.' },
  results: { win: 'Vitória', loss: 'Derrota' }, empty: 'Sem desempenho por mapa disponível para este contexto.',
} } } as const;

function mapPerformance(overrides: Partial<BunkerMapPerformance> = {}): BunkerMapPerformance {
  return {
    mapName: 'de_mirage', mapsPlayed: 6, matchesPlayed: 6, wins: 3, losses: 3,
    winRate: .5, kdRatio: .62, adr: 57, impactRating: .68, roundsPlayed: 147,
    kills: 69, deaths: 111, assists: 36, headshotPct: 46.4, accuracy: .151,
    utilityDmgPerRound: 3.8, entryWinRate: .263, enemy2ks: 10, enemy3ks: 1,
    enemy4ks: 1, enemy5ks: 0, ...overrides,
  };
}

function recentMap(overrides: Partial<BunkerRecentMap> = {}): BunkerRecentMap {
  return {
    mapName: 'de_mirage', startedAt: '2026-08-15T12:00:00Z', matchId: 'match-1', mapNumber: 1,
    result: 'win', outcome: 'win', score: '13-10', team: 'team1', winner: 'team1', isWin: true,
    team1Score: 13, team2Score: 10, rounds: 23, damage: 1000, utilityDamage: 80,
    headShotKills: 4, entryCount: 3, entryWins: 2, v1Count: 1, v1Wins: 1,
    v2Count: 0, v2Wins: 0, enemy2ks: 2, enemy3ks: 0, enemy4ks: 0, enemy5ks: 0,
    shotsFiredTotal: 200, shotsOnTargetTotal: 40, kills: 18, deaths: 14, assists: 5,
    kdRatio: 1.29, adr: 81.2, impactRating: 1.1, ...overrides,
  };
}

interface MapsHarness {
  selectedMap(): BunkerMapPerformance | null;
  selectedRecentMaps(): readonly BunkerRecentMap[];
  mapImage(value: string | null): string | null;
}

describe('BunkerMapsPanel Map Explorer', () => {
  let fixture: ComponentFixture<BunkerMapsPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BunkerMapsPanel], providers: [provideTranslateService()] }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', TRANSLATIONS);
    await firstValueFrom(translate.use('pt-BR'));
  });

  function render(byMap: readonly BunkerMapPerformance[] | null | undefined, recentMaps: readonly BunkerRecentMap[] = []): HTMLElement {
    fixture = TestBed.createComponent(BunkerMapsPanel);
    fixture.componentRef.setInput('byMap', byMap);
    fixture.componentRef.setInput('recentMaps', recentMaps);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function harness(): MapsHarness {
    return fixture.componentInstance as unknown as MapsHarness;
  }

  function selectorButtons(element: HTMLElement): HTMLButtonElement[] {
    return Array.from(element.querySelectorAll<HTMLButtonElement>('nav button'));
  }

  it('preserva a ordem publicada, fabrica somente as opções recebidas e seleciona a primeira', () => {
    const maps = [mapPerformance({ mapName: 'de_train' }), mapPerformance({ mapName: 'de_mirage' }), mapPerformance({ mapName: 'de_ancient' })];
    const element = render(maps);
    expect(selectorButtons(element).map((button) => button.textContent?.trim())).toEqual(['TRAIN', 'MIRAGE', 'ANCIENT']);
    expect(selectorButtons(element)).toHaveLength(3);
    expect(harness().selectedMap()).toBe(maps[0]);
  });

  it('button nativo seleciona outro mapa sem alterar ou reordenar a coleção', () => {
    const maps = [mapPerformance({ mapName: 'de_mirage' }), mapPerformance({ mapName: 'de_inferno' })];
    const original = [...maps];
    const element = render(maps);
    selectorButtons(element)[1].click();
    fixture.detectChanges();
    expect(harness().selectedMap()).toBe(maps[1]);
    expect(maps).toEqual(original);
    expect(selectorButtons(element)[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('troca de coleção não mantém objeto inválido do contexto anterior', () => {
    const season = [mapPerformance({ mapName: 'de_inferno', mapsPlayed: 1 })];
    render(season);
    const lifetime = [mapPerformance({ mapName: 'de_mirage', mapsPlayed: 6 })];
    fixture.componentRef.setInput('byMap', lifetime);
    fixture.detectChanges();
    expect(harness().selectedMap()).toBe(lifetime[0]);
    expect(harness().selectedMap()).not.toBe(season[0]);
  });

  it('resolve somente assets locais conhecidos e mantém fallback para mapa desconhecido', () => {
    const element = render([mapPerformance({ mapName: 'de_mirage' }), mapPerformance({ mapName: 'de_cache' })]);
    expect(harness().mapImage('de_mirage')).toBe('/map-images/de_mirage.png');
    expect(harness().mapImage('de_cache')).toBeNull();
    expect(selectorButtons(element)[0].querySelector('img')?.getAttribute('src')).toBe('/map-images/de_mirage.png');
    expect(selectorButtons(element)[1].querySelector('img')).toBeNull();
  });

  it('nome humano e seleção não alteram mapName original', () => {
    const map = mapPerformance({ mapName: 'de_dust2' });
    const element = render([map]);
    expect(element.textContent).toContain('DUST2');
    expect(map.mapName).toBe('de_dust2');
  });

  it('hero usa resultado e performance principal publicados sem recalcular Win Rate ou K/D', () => {
    const element = render([mapPerformance({ mapsPlayed: 6, wins: 6, losses: 0, winRate: .25, kdRatio: .62, adr: 57, impactRating: .68 })]);
    expect(element.textContent).toContain('6 partidas');
    expect(element.textContent).toContain('6W');
    expect(element.textContent).toContain('0L');
    expect(element.textContent).toContain('25,0%');
    expect(element.textContent).not.toContain('100,0%');
    expect(element.textContent).toContain('0,62');
    expect(element.textContent).toContain('57,0');
    expect(element.textContent).toContain('0,68');
    expect(element.querySelector('[role="meter"]')?.getAttribute('aria-valuenow')).toBe('0.25');
  });

  it('formata fundamentos conforme seus domínios publicados', () => {
    const element = render([mapPerformance({ headshotPct: 46.4, accuracy: .151, entryWinRate: .263, utilityDmgPerRound: 3.8 })]);
    expect(element.textContent).toContain('46,4%');
    expect(element.textContent).toContain('15,1%');
    expect(element.textContent).toContain('26,3%');
    expect(element.textContent).toContain('3,8');
    expect(element.textContent).not.toContain('4.640');
  });

  it('exibe volume e multi-kills diretamente em strips compactas', () => {
    const element = render([mapPerformance({ kills: 69, deaths: 111, assists: 36, roundsPlayed: 147, enemy2ks: 10, enemy3ks: 1, enemy4ks: 1, enemy5ks: 0 })]);
    for (const value of ['69', '111', '36', '147', '10', '1', '0']) expect(element.textContent).toContain(value);
    expect(element.querySelector('apx-chart-core')).toBeNull();
  });

  it('filtra recentMaps pelo mapa selecionado, preserva ordem e limita a três', () => {
    const recent = [
      recentMap({ mapName: 'de_mirage', score: 'first' }), recentMap({ mapName: 'de_inferno', score: 'other' }),
      recentMap({ mapName: 'de_mirage', score: 'second' }), recentMap({ mapName: 'de_mirage', score: 'third' }),
      recentMap({ mapName: 'de_mirage', score: 'fourth' }),
    ];
    const element = render([mapPerformance({ mapName: 'de_mirage' })], recent);
    expect(harness().selectedRecentMaps().map((item) => item.score)).toEqual(['first', 'second', 'third']);
    expect(element.textContent).toContain('first');
    expect(element.textContent).not.toContain('other');
    expect(element.textContent).not.toContain('fourth');
  });

  it('recent match usa data, placar, resultado, K/D, ADR e Impact publicados', () => {
    const element = render([mapPerformance()], [recentMap({ startedAt: '2026-08-15T12:00:00Z', score: '13-10', isWin: true, kdRatio: 1.29, adr: 81.2, impactRating: 1.1 })]);
    for (const value of ['15/08/2026', '13-10', 'Vitória', '1,29', '81,2', '1,10']) expect(element.textContent).toContain(value);
  });

  it('exibe o header de partidas recentes na mesma ordem semântica das linhas', () => {
    const element = render([mapPerformance()], [recentMap()]);
    const labels = Array.from(element.querySelectorAll('[role="columnheader"]'), (header) => header.textContent?.trim());
    expect(labels).toEqual(['Data', 'Placar', 'Resultado', 'K/D', 'ADR', 'Impact']);
  });

  it('mapa sem partidas recentes apresenta empty state parcial', () => {
    const element = render([mapPerformance({ mapName: 'de_train' })], [recentMap({ mapName: 'de_mirage' })]);
    expect(element.textContent).toContain('Nenhuma partida recente deste mapa disponível no contexto.');
  });

  it('null vira travessão e zero permanece valor legítimo sem excluir o mapa', () => {
    const element = render([mapPerformance({ mapsPlayed: 0, wins: 0, losses: null, winRate: 0, kdRatio: null, adr: 0, impactRating: 0, headshotPct: null, accuracy: 0, entryWinRate: 0, utilityDmgPerRound: null })]);
    expect(selectorButtons(element)).toHaveLength(1);
    expect(element.textContent).toContain('0 partidas');
    expect(element.textContent).toContain('0W');
    expect(element.textContent).toContain('—L');
    expect(element.textContent).toContain('0,0%');
    expect(element.textContent).toContain('—');
  });

  it.each([null, undefined, []] as const)('byMap ausente ou vazio produz empty state geral', (maps) => {
    const element = render(maps);
    expect(element.textContent).toContain('Sem desempenho por mapa disponível para este contexto.');
    expect(selectorButtons(element)).toHaveLength(0);
  });

  it('não monta ApexCharts nem infraestrutura global de motion', () => {
    const element = render([mapPerformance()]);
    expect(element.querySelector('apx-chart-core')).toBeNull();
    expect(element.querySelector('[appViewportOnce]')).toBeNull();
  });
});
