import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnalyticsContext } from '../../bunker-analytics.types';
import type { BunkerPlayerStats, BunkerTimelineItem } from '../../domain/bunker.model';
import { BunkerMotionRegistry } from '../../motion/bunker-motion-registry';
import { CompetitiveImpactTrendChart } from '../analytics/competitive-impact-trend-chart/competitive-impact-trend-chart';
import { BunkerOverviewPanel } from './bunker-overview-panel';

const TRANSLATIONS = {
  bunker: {
    overview: {
      ariaLabel: 'Visão geral',
      primary: { ariaLabel: 'Métricas principais', eyebrow: 'Métricas principais' },
      trend: { eyebrow: 'Performance recente', title: 'Evolução de Impacto', empty: 'Sem dados de impacto.' },
      fundamentals: { ariaLabel: 'Fundamentos', eyebrow: 'Fundamentos' },
      metrics: { impact: 'Impact', kd: 'K/D', winRate: 'Win Rate', adr: 'ADR', headshotPct: 'HS%', accuracy: 'Accuracy', entryWinRate: 'Entry Win Rate', utilityPerRound: 'Utility / Round', totalRounds: 'Total Rounds' },
      descriptions: { adr: 'Dano médio', headshotPct: 'Precisão de cabeça', accuracy: 'Tiros no alvo', entryWinRate: 'Conversão', utilityPerRound: 'Utilitário', totalRounds: 'Rounds' },
      empty: 'Sem estatísticas disponíveis para este contexto.',
    },
    charts: { mapUnavailable: 'Mapa não informado' },
  },
} as const;

function stats(overrides: Partial<BunkerPlayerStats> = {}): BunkerPlayerStats {
  return {
    mapsPlayed: 4, matchesPlayed: 4, wins: 2, losses: 2, winRate: .5,
    kdRatio: .55, adr: 72.4, impactRating: .583, kills: 20, deaths: 30,
    assists: 8, roundsPlayed: 90, headshotPct: 33.3, accuracy: .163,
    utilityDmgPerRound: 8.4, killsPerRound: .4, assistsPerRound: .1,
    deathsPerRound: .5, entryWinRate: .167, v1Count: 0, v1Wins: 0,
    v1WinRate: 0, v2Count: 0, v2Wins: 0, v2WinRate: 0,
    enemy2ks: 1, enemy3ks: 0, enemy4ks: 0, enemy5ks: 0,
    sampleWeight: 4, score: 999,
    ...overrides,
  };
}

function timelineItem(id: string, impactRating: number | null): BunkerTimelineItem {
  return {
    at: `2026-08-0${id}T12:00:00Z`, event: 'map_completed', mapName: `map-${id}`,
    matchId: id, mapNumber: 1, result: 'win', score: '13-10', kills: 10,
    deaths: 8, assists: 3, kdRatio: 1.25, adr: 80, impactRating,
  };
}

class MotionRegistryStub {
  readonly reducedMotionState = signal(false);
  readonly reducedMotion = this.reducedMotionState.asReadonly();
  readonly played = new Set<string>();
  hasPlayed(key: string): boolean { return this.played.has(key); }
  markPlayed(key: string): void { this.played.add(key); }
}

describe('BunkerOverviewPanel', () => {
  let fixture: ComponentFixture<BunkerOverviewPanel>;
  let motion: MotionRegistryStub;
  let intersect: IntersectionObserverCallback;

  beforeEach(async () => {
    class IntersectionObserverMock {
      constructor(callback: IntersectionObserverCallback) { intersect = callback; }
      observe = vi.fn();
      disconnect = vi.fn();
    }
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
    motion = new MotionRegistryStub();

    await TestBed.configureTestingModule({
      imports: [BunkerOverviewPanel],
      providers: [
        provideTranslateService(),
        { provide: BunkerMotionRegistry, useValue: motion },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', TRANSLATIONS);
    await firstValueFrom(translate.use('pt-BR'));
  });

  function render(
    summary: BunkerPlayerStats | null = stats(),
    timeline: readonly BunkerTimelineItem[] = [timelineItem('1', .8), timelineItem('2', 1.2)],
    context: AnalyticsContext = 'season',
  ): HTMLElement {
    fixture = TestBed.createComponent(BunkerOverviewPanel);
    fixture.componentRef.setInput('summary', summary);
    fixture.componentRef.setInput('timeline', timeline);
    fixture.componentRef.setInput('context', context);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function enterViewport(): void {
    intersect([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    fixture.detectChanges();
  }

  function chart(): CompetitiveImpactTrendChart | null {
    return fixture.debugElement.query(By.directive(CompetitiveImpactTrendChart))?.componentInstance ?? null;
  }

  it('apresenta Impact e K/D diretamente, Win Rate como percentual e nunca exibe score', () => {
    const element = render();
    expect(element.textContent).toContain('0,58');
    expect(element.textContent).toContain('0,55');
    expect(element.textContent).toContain('50,0%');
    expect(element.textContent).not.toContain('999');
    expect(element.textContent).not.toContain('Performance Rating');
  });

  it('respeita os domínios diferentes de HS%, Accuracy e Entry Win Rate', () => {
    const element = render();
    expect(element.textContent).toContain('33,3%');
    expect(element.textContent).toContain('16,3%');
    expect(element.textContent).toContain('16,7%');
    expect(element.textContent).not.toContain('3.330');
  });

  it('preserva zero legítimo e converte null em travessão', () => {
    const element = render(stats({ impactRating: null, kdRatio: 0, winRate: 0, headshotPct: null, accuracy: 0, entryWinRate: null }));
    expect(element.textContent).toContain('0,00');
    expect(element.textContent).toContain('0,0%');
    expect(element.textContent).toContain('—');
  });

  it('summary ausente produz empty state contextual', () => {
    const element = render(null);
    expect(element.textContent).toContain('Sem estatísticas disponíveis para este contexto.');
    expect(element.querySelector('app-competitive-impact-trend-chart')).toBeNull();
  });

  it('não monta o chart antes de entrar no viewport', async () => {
    const element = render();
    await fixture.whenStable();
    expect(element.querySelector('app-competitive-impact-trend-chart')).toBeNull();
  });

  it('passa timeline ao chart na mesma referência e ordem recebida', async () => {
    const timeline = [timelineItem('2', 1.2), timelineItem('1', .8)];
    render(stats(), timeline);
    await fixture.whenStable();
    enterViewport();
    expect(chart()?.timeline()).toBe(timeline);
    expect(chart()?.timeline().map((item) => item.matchId)).toEqual(['2', '1']);
  });

  it('timeline sem Impact válido exibe estado vazio e não monta Apex', async () => {
    const element = render(stats(), [timelineItem('1', null), timelineItem('2', Number.NaN)]);
    await fixture.whenStable();
    enterViewport();
    expect(element.textContent).toContain('Sem dados de impacto.');
    expect(chart()).toBeNull();
  });

  it('uma única partida com Impact monta o chart em vez do empty state', async () => {
    const element = render(stats(), [timelineItem('1', .83)]);
    await fixture.whenStable();
    enterViewport();
    expect(chart()).toBeTruthy();
    expect(element.textContent).not.toContain('Sem dados de impacto.');
  });

  it('primeira key anima após viewport e é marcada como executada', async () => {
    render();
    await fixture.whenStable();
    enterViewport();
    expect(chart()?.animate()).toBe(true);
    expect(motion.played).toContain('overview:season:impact');
  });

  it('Season e Lifetime usam keys distintas e a nova key pode animar', async () => {
    render();
    await fixture.whenStable();
    enterViewport();
    fixture.componentRef.setInput('context', 'lifetime');
    fixture.detectChanges();
    expect(chart()?.animate()).toBe(true);
    expect(motion.played).toEqual(new Set(['overview:season:impact', 'overview:lifetime:impact']));
  });

  it('Season -> Lifetime -> Season não repete animação de Season', async () => {
    render();
    await fixture.whenStable();
    enterViewport();
    fixture.componentRef.setInput('context', 'lifetime');
    fixture.detectChanges();
    fixture.componentRef.setInput('context', 'season');
    fixture.detectChanges();
    expect(chart()?.animate()).toBe(false);
  });

  it('key já executada não repete animação ao remontar o painel', async () => {
    motion.played.add('overview:season:impact');
    render();
    await fixture.whenStable();
    enterViewport();
    expect(chart()?.animate()).toBe(false);
  });

  it('reduced motion libera imediatamente com animate=false sem aguardar viewport', () => {
    motion.reducedMotionState.set(true);
    const element = render();
    fixture.detectChanges();
    expect(element.querySelector('app-competitive-impact-trend-chart')).toBeTruthy();
    expect(chart()?.animate()).toBe(false);
    expect(motion.played).toContain('overview:season:impact');
  });
});
