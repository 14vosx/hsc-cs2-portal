import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ChartCoreComponent, type ApexAxisChartSeries } from 'ng-apexcharts';
import { beforeEach, describe, expect, it } from 'vitest';

import type { BunkerMapPerformance } from '../../../domain/bunker.model';
import { CompetitiveMapWinrateChart } from './competitive-map-winrate-chart';

function mapPerformance(overrides: Partial<BunkerMapPerformance> = {}): BunkerMapPerformance {
  return {
    mapName: 'de_inferno',
    mapsPlayed: 4,
    matchesPlayed: 4,
    wins: 3,
    losses: 1,
    winRate: 0.75,
    kdRatio: 1.12,
    adr: 82.4,
    impactRating: 1.11,
    roundsPlayed: 92,
    kills: 74,
    deaths: 66,
    assists: 19,
    headshotPct: 0.48,
    accuracy: 0.22,
    utilityDmgPerRound: 8.2,
    entryWinRate: 0.58,
    enemy2ks: 8,
    enemy3ks: 2,
    enemy4ks: 1,
    enemy5ks: 0,
    ...overrides,
  };
}

describe('CompetitiveMapWinrateChart', () => {
  let fixture: ComponentFixture<CompetitiveMapWinrateChart>;

  function render(maps: readonly BunkerMapPerformance[]): ChartCoreComponent {
    fixture = TestBed.createComponent(CompetitiveMapWinrateChart);
    fixture.componentRef.setInput('maps', maps);
    fixture.detectChanges();

    return fixture.debugElement.query(By.directive(ChartCoreComponent))
      .componentInstance as ChartCoreComponent;
  }

  function axisSeries(chart: ChartCoreComponent): ApexAxisChartSeries {
    return chart.series() as unknown as ApexAxisChartSeries;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompetitiveMapWinrateChart],
    }).compileComponents();
  });

  it('preserva ordem dos mapas e mantém winRate null como null', () => {
    const chart = render([
      mapPerformance({ mapName: 'de_ancient', winRate: 0.4 }),
      mapPerformance({ mapName: 'de_nuke', winRate: null }),
      mapPerformance({ mapName: 'de_inferno', winRate: 75 }),
    ]);

    expect(chart.xaxis()?.categories).toEqual(['de_ancient', 'de_nuke', 'de_inferno']);
    expect(axisSeries(chart)[0].data).toEqual([40, null, 75]);
  });
});
