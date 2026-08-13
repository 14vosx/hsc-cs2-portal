import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ChartCoreComponent, type ApexAxisChartSeries } from 'ng-apexcharts';
import { beforeEach, describe, expect, it } from 'vitest';

import type { BunkerPlayerStats } from '../../../domain/bunker.model';
import { CompetitiveMultikillChart } from './competitive-multikill-chart';

function stats(overrides: Partial<BunkerPlayerStats> = {}): BunkerPlayerStats {
  return {
    mapsPlayed: 84,
    matchesPlayed: 80,
    wins: 45,
    losses: 35,
    winRate: 0.5625,
    kdRatio: 1.08,
    adr: 78.4,
    impactRating: 1.03,
    kills: 1432,
    deaths: 1326,
    assists: 411,
    roundsPlayed: 1920,
    headshotPct: 0.487,
    accuracy: 0.219,
    utilityDmgPerRound: 8.7,
    killsPerRound: 0.746,
    assistsPerRound: 0.214,
    deathsPerRound: 0.691,
    entryWinRate: 0.524,
    v1Count: 38,
    v1Wins: 21,
    v1WinRate: 0.553,
    v2Count: 61,
    v2Wins: 29,
    v2WinRate: 0.475,
    enemy2ks: 14,
    enemy3ks: 3,
    enemy4ks: 1,
    enemy5ks: 0,
    sampleWeight: 84,
    score: 1.12,
    ...overrides,
  };
}

describe('CompetitiveMultikillChart', () => {
  let fixture: ComponentFixture<CompetitiveMultikillChart>;

  function render(value: BunkerPlayerStats): ChartCoreComponent {
    fixture = TestBed.createComponent(CompetitiveMultikillChart);
    fixture.componentRef.setInput('stats', value);
    fixture.detectChanges();

    return fixture.debugElement.query(By.directive(ChartCoreComponent))
      .componentInstance as ChartCoreComponent;
  }

  function axisSeries(chart: ChartCoreComponent): ApexAxisChartSeries {
    return chart.series() as unknown as ApexAxisChartSeries;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompetitiveMultikillChart],
      providers: [provideTranslateService()],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', { bunker: { charts: { occurrences: 'Ocorrências' } } });
    await firstValueFrom(translate.use('pt-BR'));
  });

  it('usa somente contadores 2K, 3K, 4K e 5K publicados', () => {
    const chart = render(stats({ enemy2ks: 20, enemy3ks: 6, enemy4ks: 2, enemy5ks: 1 }));

    expect(chart.xaxis()?.categories).toEqual(['2K', '3K', '4K', '5K']);
    expect(axisSeries(chart)[0].name).toBe('Ocorrências');
    expect(axisSeries(chart)[0].data).toEqual([20, 6, 2, 1]);
  });
});
