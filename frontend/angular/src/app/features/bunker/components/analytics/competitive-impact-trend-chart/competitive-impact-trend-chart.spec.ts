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

  function render(timeline: readonly BunkerTimelineItem[]): ChartCoreComponent {
    fixture = TestBed.createComponent(CompetitiveImpactTrendChart);
    fixture.componentRef.setInput('timeline', timeline);
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

  it('usa somente at e impactRating, preservando ordem e lacunas null', () => {
    const firstDate = '2026-08-01T12:00:00Z';
    const secondDate = '2026-08-02T12:00:00Z';
    const chart = render([
      timelineItem({ at: firstDate, impactRating: 0.8, adr: 99.9, kdRatio: 9.99 }),
      timelineItem({ at: secondDate, impactRating: null, adr: 88.8, kdRatio: 8.88 }),
      timelineItem({ at: null, impactRating: 1.4 }),
    ]);

    expect(axisSeries(chart)[0].data).toEqual([
      { x: new Date(firstDate).getTime(), y: 0.8 },
      { x: new Date(secondDate).getTime(), y: null },
    ]);
  });
});
