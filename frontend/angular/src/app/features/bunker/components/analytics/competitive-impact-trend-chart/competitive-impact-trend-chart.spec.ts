import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ChartCoreComponent, type ApexAxisChartSeries } from 'ng-apexcharts';
import { beforeEach, describe, expect, it } from 'vitest';

import type { BunkerTimelineItem } from '../../../domain/bunker.model';
import { CompetitiveImpactTrendChart } from './competitive-impact-trend-chart';

function timelineItem(overrides: Partial<BunkerTimelineItem> = {}): BunkerTimelineItem {
  return {
    at: '2026-08-01T12:00:00Z',
    event: 'map_completed',
    mapName: 'de_mirage',
    matchId: 'match-1',
    mapNumber: 1,
    result: 'win',
    score: '13-11',
    kills: 20,
    deaths: 15,
    assists: 5,
    kdRatio: 1.33,
    adr: 83.3,
    impactRating: 1.2,
    ...overrides,
  };
}

describe('CompetitiveImpactTrendChart', () => {
  let fixture: ComponentFixture<CompetitiveImpactTrendChart>;

  function render(timeline: readonly BunkerTimelineItem[], animate = true): ChartCoreComponent {
    fixture = TestBed.createComponent(CompetitiveImpactTrendChart);
    fixture.componentRef.setInput('timeline', timeline);
    fixture.componentRef.setInput('animate', animate);
    fixture.detectChanges();

    return fixture.debugElement.query(By.directive(ChartCoreComponent))
      .componentInstance as ChartCoreComponent;
  }

  function axisSeries(chart: ChartCoreComponent): ApexAxisChartSeries {
    return chart.series() as unknown as ApexAxisChartSeries;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompetitiveImpactTrendChart],
      providers: [provideTranslateService()],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', { bunker: { charts: { mapUnavailable: 'Mapa não informado' } } });
    await firstValueFrom(translate.use('pt-BR'));
  });

  it('preserva a ordem publicada e lacunas null em posições ordinais uniformes', () => {
    const chart = render([
      timelineItem({ matchId: 'first', at: '2026-02-01T12:00:00Z', impactRating: 0.8, adr: 99.9, kdRatio: 9.99 }),
      timelineItem({ matchId: 'second', at: '2026-02-02T12:00:00Z', impactRating: null, adr: 88.8, kdRatio: 8.88 }),
      timelineItem({ at: null, impactRating: 1.4 }),
    ]);

    expect(axisSeries(chart)[0].data).toEqual([
      { x: 1, y: 0.8 },
      { x: 2, y: null },
      { x: 3, y: 1.4 },
    ]);
  });

  it('distância cronológica não altera a distância ordinal entre partidas', () => {
    const chart = render([
      timelineItem({ at: '2026-02-01T12:00:00Z', impactRating: 0.7 }),
      timelineItem({ at: '2026-02-02T12:00:00Z', impactRating: 0.9 }),
      timelineItem({ at: '2026-08-15T12:00:00Z', impactRating: 1.1 }),
    ]);

    expect(axisSeries(chart)[0].data).toEqual([
      { x: 1, y: 0.7 },
      { x: 2, y: 0.9 },
      { x: 3, y: 1.1 },
    ]);
  });

  it('uma única partida permanece como um ponto ordinal legítimo', () => {
    const chart = render([timelineItem({ impactRating: 1.2 })]);
    expect(axisSeries(chart)[0].data).toEqual([{ x: 1, y: 1.2 }]);
  });

  it('tooltip preserva mapa, data real e Impact do evento', () => {
    const chart = render([timelineItem({
      at: '2026-08-15T12:00:00Z',
      mapName: 'de_nuke',
      matchId: 'match-context',
      impactRating: 1.25,
    })]);
    const tooltip = chart.tooltip();
    const custom = tooltip?.custom;
    if (typeof custom !== 'function') {
      throw new Error('Expected the chart tooltip formatter.');
    }
    const content = custom({ dataPointIndex: 0 } as never);

    expect(content).toContain('de_nuke');
    expect(content).toContain('15/08/2026');
    expect(content).toContain('Impact 1,25');
  });

  it('controle explícito desabilita a animação Apex sem alterar a série', () => {
    const items = [timelineItem({ impactRating: 1.2 })];
    const chart = render(items, false);
    const chartOptions = chart.chart();

    if (!chartOptions) {
      throw new Error('Expected Apex chart options to be available.');
    }

    expect(chartOptions.animations?.enabled).toBe(false);
    expect(axisSeries(chart)[0].data).toEqual([
      { x: 1, y: 1.2 },
    ]);
  });
});
