import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import type { BunkerPlayerStats } from '../../domain/bunker.model';
import { BunkerCombatPanel } from './bunker-combat-panel';

const TRANSLATIONS = {
  bunker: {
    combat: {
      ariaLabel: 'Clutch e multi-kill', eyebrow: 'Clutch + Multi-kill',
      clutch: { title: 'Desempenho em Clutches', situation: 'Situação', success: 'Sucesso', rate: 'Taxa' },
      multikill: { title: 'Distribuição de Multi-kills', zero: 'Nenhum multi-kill registrado.', empty: 'Dados de multi-kill indisponíveis.', incomplete: 'Dados de multi-kill incompletos.' },
      empty: 'Sem estatísticas de combate disponíveis para este contexto.',
    },
  },
} as const;

function stats(overrides: Partial<BunkerPlayerStats> = {}): BunkerPlayerStats {
  return {
    mapsPlayed: 4, matchesPlayed: 4, wins: 2, losses: 2, winRate: .5,
    kdRatio: .8, adr: 72, impactRating: .7, kills: 20, deaths: 25,
    assists: 8, roundsPlayed: 90, headshotPct: 33.3, accuracy: .163,
    utilityDmgPerRound: 8.4, killsPerRound: .4, assistsPerRound: .1,
    deathsPerRound: .5, entryWinRate: .167, v1Count: 5, v1Wins: 2,
    v1WinRate: .4, v2Count: 9, v2Wins: 3, v2WinRate: .333,
    enemy2ks: 14, enemy3ks: 3, enemy4ks: 1, enemy5ks: 0,
    sampleWeight: 4, score: 999,
    ...overrides,
  };
}

interface CombatHarness {
  visualMax(): number;
  distributionWidth(value: number): string;
}

describe('BunkerCombatPanel', () => {
  let fixture: ComponentFixture<BunkerCombatPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BunkerCombatPanel],
      providers: [provideTranslateService()],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', TRANSLATIONS);
    await firstValueFrom(translate.use('pt-BR'));
  });

  function render(summary: BunkerPlayerStats | null = stats()): HTMLElement {
    fixture = TestBed.createComponent(BunkerCombatPanel);
    fixture.componentRef.setInput('summary', summary);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function harness(): CombatHarness {
    return fixture.componentInstance as unknown as CombatHarness;
  }

  function dataRows(element: HTMLElement): HTMLElement[] {
    return Array.from(element.querySelectorAll<HTMLElement>('[role="row"]')).slice(1);
  }

  it('usa a narrativa específica de Clutch + Multi-kill', () => {
    const element = render();
    expect(element.textContent).toContain('Clutch + Multi-kill');
    expect(element.textContent).not.toContain('Combate & Mira');
  });

  it('apresenta 1v1 e 1v2 com contadores e taxas publicados, sem 1v3', () => {
    const element = render();
    const rows = dataRows(element);
    expect(rows[0].textContent).toContain('1v1');
    expect(rows[0].textContent).toContain('2 / 5');
    expect(rows[0].textContent).toContain('40,0%');
    expect(rows[1].textContent).toContain('1v2');
    expect(rows[1].textContent).toContain('3 / 9');
    expect(rows[1].textContent).toContain('33,3%');
    expect(element.textContent).not.toContain('1v3');
  });

  it('não recalcula winRate a partir de wins/count', () => {
    const rows = dataRows(render(stats({ v1Count: 5, v1Wins: 2, v1WinRate: .9 })));
    expect(rows[0].textContent).toContain('2 / 5');
    expect(rows[0].textContent).toContain('90,0%');
    expect(rows[0].textContent).not.toContain('40,0%');
  });

  it('zero de clutch permanece zero e taxa null vira travessão', () => {
    const rows = dataRows(render(stats({ v1Count: 1, v1Wins: 0, v1WinRate: 0, v2WinRate: null })));
    expect(rows[0].textContent).toContain('0 / 1');
    expect(rows[0].textContent).toContain('0,0%');
    expect(rows[1].textContent).toContain('—');
  });

  it('apresenta diretamente os quatro contadores na distribuição CSS', () => {
    const element = render(stats({ enemy2ks: 14, enemy3ks: 3, enemy4ks: 1, enemy5ks: 0 }));
    const distribution = element.querySelector<HTMLElement>('[role="list"]');
    const rows = Array.from(distribution?.querySelectorAll<HTMLElement>('[role="listitem"]') ?? []);
    expect(rows.map((row) => row.getAttribute('aria-label'))).toEqual(['2K: 14', '3K: 3', '4K: 1', '5K: 0']);
    expect(element.querySelector('apx-chart-core')).toBeNull();
    expect(distribution?.textContent).not.toContain('%');
  });

  it('usa o maior contador como visualMax compartilhado para as larguras relativas', () => {
    render(stats({ enemy2ks: 14, enemy3ks: 3, enemy4ks: 1, enemy5ks: 0 }));
    expect(harness().visualMax()).toBe(14);
    expect(Number.parseFloat(harness().distributionWidth(14))).toBeGreaterThan(Number.parseFloat(harness().distributionWidth(3)));
    expect(Number.parseFloat(harness().distributionWidth(3))).toBeGreaterThan(Number.parseFloat(harness().distributionWidth(1)));
    expect(Number.parseFloat(harness().distributionWidth(0))).toBe(0);
  });

  it('quatro zeros acionam zero-state factual sem montar Apex', () => {
    const element = render(stats({ enemy2ks: 0, enemy3ks: 0, enemy4ks: 0, enemy5ks: 0 }));
    expect(element.textContent).toContain('Nenhum multi-kill registrado.');
    expect(element.textContent).toContain('2K 0');
    expect(element.textContent).toContain('3K 0');
    expect(element.textContent).toContain('4K 0');
    expect(element.textContent).toContain('5K 0');
    expect(element.querySelector('apx-chart-core')).toBeNull();
  });

  it('quatro multikills null produzem empty state sem esconder Clutch', () => {
    const element = render(stats({ enemy2ks: null, enemy3ks: null, enemy4ks: null, enemy5ks: null }));
    expect(element.textContent).toContain('Dados de multi-kill indisponíveis.');
    expect(element.textContent).toContain('2K —');
    expect(element.textContent).toContain('Desempenho em Clutches');
    expect(element.querySelector('apx-chart-core')).toBeNull();
  });

  it('dados parciais preservam valores e null sem desenhar distribuição completa', () => {
    const element = render(stats({ enemy2ks: 14, enemy3ks: null, enemy4ks: 1, enemy5ks: 0 }));
    expect(element.textContent).toContain('Dados de multi-kill incompletos.');
    expect(element.textContent).toContain('2K 14');
    expect(element.textContent).toContain('3K —');
    expect(element.textContent).toContain('4K 1');
    expect(element.textContent).toContain('5K 0');
    expect(element.querySelector('apx-chart-core')).toBeNull();
  });

  it('summary ausente produz somente o empty state do painel', () => {
    const element = render(null);
    expect(element.textContent).toContain('Sem estatísticas de combate disponíveis para este contexto.');
    expect(element.textContent).not.toContain('Desempenho em Clutches');
    expect(element.querySelector('apx-chart-core')).toBeNull();
  });
});
