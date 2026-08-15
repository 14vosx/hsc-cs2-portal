import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import type { BunkerRecentMap } from '../../domain/bunker.model';
import { CompetitiveKdaChart } from '../analytics/competitive-kda-chart/competitive-kda-chart';
import { BunkerMatchHistoryPanel } from './bunker-match-history-panel';

const TRANSLATIONS = { bunker: { matchHistory: {
  ariaLabel: 'Histórico de Partidas', form: 'Forma recente', matches: 'Partidas', list: 'Lista de partidas',
  hero: 'Partida selecionada', dossier: 'Detalhes da performance individual',
  performance: 'Performance principal', details: 'Detalhes da partida', situational: 'Performance situacional',
  entry: 'Entry', clutch: 'Clutch', multikill: 'Multi-kill', aimStats: 'Aim Stats',
  filters: { allMaps: 'Todos os mapas', allResults: 'Todos os resultados', wins: 'Vitórias', losses: 'Derrotas', empty: 'Nenhuma partida encontrada com os filtros selecionados.' },
  multikillStates: { zero: 'Nenhum multi-kill registrado nesta partida.', unavailable: 'Multi-kills indisponíveis para esta partida.' },
  labels: {
    date: 'Data', map: 'Mapa', score: 'Placar', result: 'Resultado', kills: 'Kills',
    deaths: 'Deaths', assists: 'Assists', kd: 'K/D', adr: 'ADR', impact: 'Impact',
    damage: 'Damage', rounds: 'Rounds', utilityDamage: 'Utility Damage',
    headshotKills: 'Headshot Kills', shotsOnTarget: 'Tiros no alvo',
    shotsFired: 'Tiros disparados', entries: 'Entradas',
  },
  results: { win: 'Vitória', loss: 'Derrota', winShort: 'V', lossShort: 'D' },
  empty: 'Sem partidas recentes disponíveis para este contexto.',
} } } as const;

function recentMap(overrides: Partial<BunkerRecentMap> = {}): BunkerRecentMap {
  return {
    mapName: 'de_mirage', startedAt: '2026-08-15T12:00:00Z', matchId: 'match-1', mapNumber: 1,
    result: 'win', outcome: 'win', score: '13-10', team: 'team1', winner: 'team1', isWin: true,
    team1Score: 13, team2Score: 10, rounds: 23, damage: 1434, utilityDamage: 139,
    headShotKills: 2, entryCount: 3, entryWins: 1, v1Count: 1, v1Wins: 1,
    v2Count: 2, v2Wins: 1, enemy2ks: 2, enemy3ks: 1, enemy4ks: 1, enemy5ks: 0,
    shotsFiredTotal: 233, shotsOnTargetTotal: 49, kills: 15, deaths: 12, assists: 5,
    kdRatio: 1.25, adr: 62.3, impactRating: .935, ...overrides,
  };
}

interface MatchHistoryHarness {
  selectedMatch(): BunkerRecentMap | null;
  filteredMatches(): readonly BunkerRecentMap[];
  mapOptions(): readonly string[];
  mapImage(value: string | null): string | null;
  matchStableKey(match: BunkerRecentMap): string;
}

describe('BunkerMatchHistoryPanel Match Explorer', () => {
  let fixture: ComponentFixture<BunkerMatchHistoryPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BunkerMatchHistoryPanel],
      providers: [provideTranslateService()],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', TRANSLATIONS);
    await firstValueFrom(translate.use('pt-BR'));
  });

  function render(recentMaps: readonly BunkerRecentMap[] | null | undefined): HTMLElement {
    fixture = TestBed.createComponent(BunkerMatchHistoryPanel);
    fixture.componentRef.setInput('recentMaps', recentMaps);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function harness(): MatchHistoryHarness {
    return fixture.componentInstance as unknown as MatchHistoryHarness;
  }

  function matchRows(element: HTMLElement): HTMLButtonElement[] {
    return Array.from(element.querySelectorAll<HTMLButtonElement>('[role="option"]'));
  }

  function dossier(element: HTMLElement): HTMLElement {
    return element.querySelector<HTMLElement>('[aria-label="Detalhes da performance individual"]') as HTMLElement;
  }

  function selectFilter(element: HTMLElement, index: number, value: string): void {
    const select = element.querySelectorAll<HTMLSelectElement>('select')[index];
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function definitionValue(element: HTMLElement, label: string): string | undefined {
    const term = Array.from(element.querySelectorAll('dt')).find((item) => item.textContent?.trim() === label);
    return term?.parentElement?.querySelector('dd')?.textContent?.trim();
  }

  function groupedValue(element: HTMLElement, label: string): string | undefined {
    const labelElement = Array.from(element.querySelectorAll('h3, span')).find((item) => item.textContent?.trim() === label);
    return labelElement?.parentElement?.querySelector('strong')?.textContent?.trim();
  }

  it('preserva toda a ordem publicada e inicia com o primeiro registro selecionado', () => {
    const matches = Array.from({ length: 5 }, (_, index) => recentMap({
      matchId: `match-${index + 1}`,
      mapName: `de_map${index + 1}`,
      score: `score-${index + 1}`,
    }));
    const element = render(matches);

    const rows = matchRows(element);
    expect(rows.map((row) => row.querySelector('strong')?.textContent?.trim())).toEqual(['MAP1', 'MAP2', 'MAP3', 'MAP4', 'MAP5']);
    expect(rows.map((row) => row.querySelector('span')?.textContent?.trim())).toEqual(['score-1', 'score-2', 'score-3', 'score-4', 'score-5']);
    expect(rows).toHaveLength(5);
    expect(harness().selectedMatch()).toBe(matches[0]);
    expect(rows[0].getAttribute('aria-selected')).toBe('true');
  });

  it('seleciona outra linha, atualiza o dossier e não altera a coleção original', () => {
    const matches = [
      recentMap({ matchId: 'first', mapName: 'de_mirage', kills: 11 }),
      recentMap({ matchId: 'second', mapName: 'de_inferno', kills: 27 }),
    ];
    const original = [...matches];
    const element = render(matches);
    matchRows(element)[1].click();
    fixture.detectChanges();

    expect(harness().selectedMatch()).toBe(matches[1]);
    expect(dossier(element).textContent).toContain('27');
    expect(matches).toEqual(original);
  });

  it('troca de coleção não mantém o objeto inválido do contexto anterior', () => {
    const season = [recentMap({ matchId: 'season', mapName: 'de_inferno' })];
    render(season);
    const lifetime = [recentMap({ matchId: 'lifetime', mapName: 'de_mirage' })];
    fixture.componentRef.setInput('recentMaps', lifetime);
    fixture.detectChanges();

    expect(harness().selectedMatch()).toBe(lifetime[0]);
    expect(harness().selectedMatch()).not.toBe(season[0]);
  });

  it('mantém chave factual estável quando uma partida sem matchId é recriada', () => {
    const original = recentMap({ matchId: null });
    const recreated = recentMap({ matchId: null });
    render([original]);

    expect(harness().matchStableKey(recreated)).toBe(harness().matchStableKey(original));
    expect(harness().matchStableKey(recentMap({ matchId: null, mapNumber: 2 })))
      .not.toBe(harness().matchStableKey(original));
  });

  it('forma recente preserva win, loss e estado neutro na ordem publicada', () => {
    const element = render([
      recentMap({ matchId: 'loss', isWin: false, result: 'loss', outcome: 'loss' }),
      recentMap({ matchId: 'neutral', isWin: null, result: null, outcome: null, score: '13-0' }),
      recentMap({ matchId: 'win', isWin: true, result: 'win', outcome: 'win' }),
    ]);
    const form = element.querySelector('[aria-label="Forma recente"]') as HTMLElement;
    const states = Array.from(form.querySelectorAll('[data-result]'));

    expect(states.map((state) => state.getAttribute('data-result'))).toEqual(['loss', 'neutral', 'win']);
    expect(states.map((state) => state.getAttribute('aria-label'))).toEqual(['Derrota', '—', 'Vitória']);
  });

  it('limita somente a Forma Recente a 12 e mantém a coleção completa no Match Index', () => {
    const matches = Array.from({ length: 15 }, (_, index) => recentMap({ matchId: `match-${index}`, score: `score-${index}` }));
    const element = render(matches);
    const form = element.querySelector('[aria-label="Forma recente"]') as HTMLElement;

    expect(form.querySelectorAll('[data-result]')).toHaveLength(12);
    expect(matchRows(element)).toHaveLength(15);
    expect(matchRows(element)[14].textContent).toContain('score-14');
    expect(element.querySelector('table')).toBeNull();
  });

  it('Match Index mostra somente data, mapa, placar e resultado', () => {
    const element = render([recentMap({ kdRatio: 9.91, adr: 222.2, impactRating: 8.88 })]);
    const text = matchRows(element)[0].textContent ?? '';

    for (const value of ['15/08/2026', 'MIRAGE', '13-10', 'Vitória']) expect(text).toContain(value);
    for (const value of ['9,91', '222,2', '8,88', 'K/D', 'ADR', 'Impact']) expect(text).not.toContain(value);
  });

  it('filtro de mapa deriva somente opções presentes na ordem da primeira ocorrência', () => {
    const element = render([
      recentMap({ matchId: '1', mapName: 'de_nuke' }),
      recentMap({ matchId: '2', mapName: 'de_mirage' }),
      recentMap({ matchId: '3', mapName: 'de_nuke' }),
      recentMap({ matchId: '4', mapName: null }),
    ]);
    const options = Array.from(element.querySelectorAll<HTMLSelectElement>('select')[0].options, (option) => option.textContent?.trim());

    expect(options).toEqual(['Todos os mapas', 'NUKE', 'MIRAGE']);
    expect(harness().mapOptions()).toEqual(['de_nuke', 'de_mirage']);
  });

  it('combina filtros de mapa e resultado sem inferir pelo score ou alterar a coleção', () => {
    const matches = [
      recentMap({ matchId: '1', mapName: 'de_mirage', isWin: false, result: 'loss', outcome: 'loss', score: '13-0' }),
      recentMap({ matchId: '2', mapName: 'de_mirage', isWin: true, result: 'win', outcome: 'win' }),
      recentMap({ matchId: '3', mapName: 'de_nuke', isWin: false, result: 'loss', outcome: 'loss' }),
    ];
    const original = [...matches];
    const element = render(matches);
    selectFilter(element, 0, 'de_mirage');
    selectFilter(element, 1, 'loss');

    expect(harness().filteredMatches()).toEqual([matches[0]]);
    expect(matchRows(element)).toHaveLength(1);
    expect(matchRows(element)[0].textContent).toContain('13-0');
    expect(matchRows(element)[0].textContent).toContain('Derrota');
    expect(matches).toEqual(original);
  });

  it('preserva seleção visível e recai no primeiro item quando o filtro a remove', () => {
    const matches = [
      recentMap({ matchId: 'first', mapName: 'de_mirage', isWin: false, result: 'loss', outcome: 'loss' }),
      recentMap({ matchId: 'second', mapName: 'de_mirage', isWin: true, result: 'win', outcome: 'win' }),
      recentMap({ matchId: 'third', mapName: 'de_nuke', isWin: true, result: 'win', outcome: 'win' }),
    ];
    const element = render(matches);
    matchRows(element)[1].click();
    fixture.detectChanges();
    selectFilter(element, 0, 'de_mirage');
    expect(harness().selectedMatch()).toBe(matches[1]);

    selectFilter(element, 1, 'loss');
    expect(harness().selectedMatch()).toBe(matches[0]);
  });

  it('filtros sem resultado mantêm filtros e mostram empty state local no index e dossier', () => {
    const element = render([recentMap({ mapName: 'de_mirage', isWin: true, result: 'win', outcome: 'win' })]);
    selectFilter(element, 1, 'loss');

    expect(matchRows(element)).toHaveLength(0);
    expect(harness().selectedMatch()).toBeNull();
    expect(element.textContent?.match(/Nenhuma partida encontrada com os filtros selecionados\./g)).toHaveLength(2);
    expect(element.querySelectorAll<HTMLSelectElement>('select')[1].value).toBe('loss');
  });

  it('mantém score publicado independente do resultado e não o usa para inferência', () => {
    const element = render([
      recentMap({ matchId: 'explicit-loss', score: '13-10', isWin: false, result: 'loss', outcome: 'loss' }),
      recentMap({ matchId: 'unknown', score: '16-0', isWin: null, result: null, outcome: null }),
    ]);
    const rows = matchRows(element);

    expect(rows[0].textContent).toContain('13-10');
    expect(rows[0].textContent).toContain('Derrota');
    expect(rows[1].textContent).toContain('16-0');
    expect(rows[1].textContent).toContain('—');
  });

  it('usa diretamente todos os campos publicados no dossier sem derivar percentuais', () => {
    const element = render([recentMap({
      kills: 15, deaths: 12, assists: 5, kdRatio: 1.25, adr: 62.3, impactRating: .935,
      damage: 1434, rounds: 23, utilityDamage: 139, headShotKills: 2,
      shotsOnTargetTotal: 49, shotsFiredTotal: 233, entryWins: 1, entryCount: 3,
      v1Wins: 1, v1Count: 1, v2Wins: 1, v2Count: 2,
      enemy2ks: 2, enemy3ks: 1, enemy4ks: 1, enemy5ks: 0,
    })]);
    const text = dossier(element).textContent?.replace(/\s+/g, ' ');

    for (const value of ['15', '12', '5', '1,25', '62,3', '0,94', '1.434', '23', '139', '49', '233', '1 / 3', '1 / 1', '1 / 2']) {
      expect(text).toContain(value);
    }
    expect(text).not.toContain('%');
    expect(text).not.toContain('Accuracy');
    expect(text).not.toContain('HS%');
    expect(text).not.toContain('1v3');
  });

  it('mantém zero como dado e apresenta null como travessão por campo', () => {
    const element = render([recentMap({
      kills: 0, deaths: null, assists: 0, damage: null, rounds: 0,
      entryWins: 0, entryCount: 0, v2Wins: null, v2Count: 0,
      enemy2ks: 0, enemy3ks: null, enemy4ks: 0, enemy5ks: 0,
    })]);
    const selectedDossier = dossier(element);
    const text = selectedDossier.textContent ?? '';

    expect(definitionValue(selectedDossier, 'Kills')).toBe('0');
    expect(definitionValue(selectedDossier, 'Deaths')).toBe('—');
    expect(definitionValue(selectedDossier, 'Rounds')).toBe('0');
    expect(groupedValue(selectedDossier, 'Entry')).toBe('0 / 0');
    expect(groupedValue(selectedDossier, '1v2')).toBe('— / 0');
    expect(text).toContain('Multi-kills indisponíveis para esta partida.');
    expect(text).not.toContain('3K ×0');
  });

  it('multi-kill positivo mostra somente categorias maiores que zero', () => {
    const element = render([recentMap({ enemy2ks: 2, enemy3ks: 0, enemy4ks: 1, enemy5ks: null })]);
    const text = dossier(element).textContent ?? '';

    expect(text).toContain('2K ×2');
    expect(text).toContain('4K ×1');
    expect(text).not.toContain('3K ×');
    expect(text).not.toContain('5K ×');
  });

  it('multi-kills todos zero usam fallback compacto e todos null usam indisponível', () => {
    let element = render([recentMap({ enemy2ks: 0, enemy3ks: 0, enemy4ks: 0, enemy5ks: 0 })]);
    expect(dossier(element).textContent).toContain('Nenhum multi-kill registrado nesta partida.');
    expect(dossier(element).textContent).not.toContain('2K ×0');

    element = render([recentMap({ enemy2ks: null, enemy3ks: null, enemy4ks: null, enemy5ks: null })]);
    expect(dossier(element).textContent).toContain('Multi-kills indisponíveis para esta partida.');
  });

  it('humaniza mapName sem mutação e compartilha whitelist segura de assets', () => {
    const known = recentMap({ mapName: 'de_mirage' });
    const element = render([known]);
    expect(element.textContent).toContain('MIRAGE');
    expect(known.mapName).toBe('de_mirage');
    expect(harness().mapImage('de_mirage')).toBe('/map-images/de_mirage.png');
    expect(element.querySelector('[aria-label="Partida selecionada"] img')?.getAttribute('src')).toBe('/map-images/de_mirage.png');

    const unknownElement = render([recentMap({ mapName: 'de_cache' })]);
    expect(harness().mapImage('de_cache')).toBeNull();
    expect(unknownElement.querySelector('[aria-label="Partida selecionada"] img')).toBeNull();
  });

  it.each([null, undefined, []] as const)('recentMaps ausente ou vazio produz somente empty state geral', (matches) => {
    const element = render(matches);
    expect(element.textContent).toContain('Sem partidas recentes disponíveis para este contexto.');
    expect(matchRows(element)).toHaveLength(0);
    expect(element.querySelector('[aria-label="Forma recente"]')).toBeNull();
    expect(element.querySelector('[aria-label="Detalhes da performance individual"]')).toBeNull();
  });

  it('monta Apex somente no K/D/A com valores publicados e não cria badges derivados', () => {
    const element = render([recentMap()]);
    const chart = fixture.debugElement.query(By.directive(CompetitiveKdaChart)).componentInstance as CompetitiveKdaChart;
    expect(chart.kills()).toBe(15);
    expect(chart.deaths()).toBe(12);
    expect(chart.assists()).toBe(5);
    expect(element.querySelectorAll('apx-chart-core')).toHaveLength(1);
    expect(element.querySelector('[appViewportOnce]')).toBeNull();
    for (const label of ['MVP', 'Carry', 'Top Fragger', 'Underperform', 'Performance Score']) {
      expect(element.textContent).not.toContain(label);
    }
  });
});
